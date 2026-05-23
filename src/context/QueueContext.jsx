import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { ticketsAPI, queuesAPI, servicesAPI, structuresAPI, adminAPI } from '../api/client';

const QueueContext = createContext();

// Real service IDs from database for fallback/initial state
export const FALLBACK_SERVICES = [
  { id: 'edc92457-5a80-4bd4-8a4e-2bd979550c7b', name: 'Algeria Post Office', nameAr: 'بريد الجزائر', icon: '📮', avgTime: 10 },
  { id: '47095414-5c1f-4860-b52c-41ced44b39b3', name: 'Hospital CHU Béjaïa', nameAr: 'مستشفى الجامعي بجاية', icon: '🏥', avgTime: 15 },
  { id: 'f1757773-03ad-4f4c-9f0c-559773c9323f', name: 'Municipality of Béjaïa', nameAr: 'بلدية بجاية', icon: '🏛️', avgTime: 12 },
];

export function QueueProvider({ children }) {
  const [queues, setQueues] = useState({});
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [allStructures, setAllStructures] = useState([]);
  const [mainStructure, setMainStructure] = useState(null);
  
  const [userTicket, setUserTicket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [activeServiceId, setActiveServiceId] = useState(FALLBACK_SERVICES[0].id);
  const [loading, setLoading] = useState(false);
  const toastIdRef = useRef(0);
  
  const { socket } = useSocket();
  const { isLoggedIn, user } = useAuth();

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type, duration, createdAt: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!isLoggedIn) {
       setUserTicket(null);
    }
    try {
      console.log('QueueContext: Fetching initial data...');
      const response = await servicesAPI.list();
      const svcs = response.services || response;
      
      if (Array.isArray(svcs) && svcs.length > 0) {
        // Merge with FALLBACK_SERVICES to keep icons if real data lacks them
        const merged = svcs.map(s => {
          const fallback = FALLBACK_SERVICES.find(f => f.name.toLowerCase() === s.name.toLowerCase());
          return { ...fallback, ...s };
        });
        setServices(merged);
        if (merged.length > 0) setActiveServiceId(merged[0].id);
      }
      
      const structResponse = await structuresAPI.list();
      const structs = structResponse.structures || structResponse;
      if (Array.isArray(structs) && structs.length > 0) {
        setAllStructures(structs);
        let primary = structs.find(s => s.name.includes('Poste')) || structs[0];
        
        if (user?.is_admin && user.structure_id) {
          primary = structs.find(s => s.id === user.structure_id) || primary;
        }
        
        setMainStructure(primary);
        
        const qsResponse = await queuesAPI.forStructure(primary.id);
        const qs = qsResponse.queues || qsResponse;
        
        const queueMap = {};
        if (Array.isArray(qs)) {
          qs.forEach(q => {
            const people = [];
            let currentlyServing = null;
            if (q.called_ticket) {
               currentlyServing = {
                 id: q.called_ticket.id,
                 number: q.called_ticket.number,
                 status: 'serving',
                 name: q.called_ticket.users ? `${q.called_ticket.users.first_name} ${q.called_ticket.users.last_name}` : 'Client'
               };
            }
            for (let i = 1; i <= (q.waiting_count || 0); i++) {
              people.push({
                 id: `${q.id}-wait-${i}`,
                 number: (q.last_called_number || 0) + i,
                 status: 'waiting'
              });
            }

            queueMap[q.service_id] = {
              id: q.id,
              service: (Array.isArray(svcs) ? svcs.find(s => s.id === q.service_id) : null) 
                       || { id: q.service_id, name: q.services?.name || 'Service', icon: q.services?.icon || '⚙️' },
              status: q.status,
              people,
              currentlyServing,
              totalServed: q.total_today || 0,
              currentNumber: q.last_called_number,
              waitingCount: q.waiting_count || 0
            };
          });
        }
        setQueues(queueMap);
      }
    } catch (err) {
      console.error("QueueContext: Failed to fetch queue data", err);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Listen to WebSocket events
  useEffect(() => {
    if (!socket) return;
    
    const handleQueueUpdate = (data) => {
      console.log('Queue update event received:', data);
      fetchInitialData();
    };
    
    const handleTicketCalled = (data) => {
      console.log('Ticket called event:', data);
      if (userTicket && userTicket.id === data.ticket_id) {
         addToast("🎉 C'est votre tour ! Veuillez vous présenter au guichet.", 'success', 10000);
      }
    };

    socket.on('queue_update', handleQueueUpdate);
    socket.on('ticket_called', handleTicketCalled);

    return () => {
      socket.off('queue_update', handleQueueUpdate);
      socket.off('ticket_called', handleTicketCalled);
    };
  }, [socket, fetchInitialData, userTicket?.id, addToast]); // Only depend on ticket ID, not full object

  const takeTicket = useCallback(async (serviceId, structureId) => {
    console.log('Attempting to take ticket:', { serviceId, structureId });
    const sid = structureId || (mainStructure ? mainStructure.id : null);
    
    if (!sid) {
      console.error('No structure ID available for taking ticket');
      addToast('Erreur : Structure non sélectionnée.', 'error');
      return null;
    }

    try {
      setLoading(true);
      const response = await ticketsAPI.take(sid, serviceId);
      console.log('Ticket taken successfully:', response);
      const ticket = response.ticket || response;
      
      setUserTicket(ticket);
      addToast(`Ticket #${ticket.number} généré avec succès !`, 'success');
      return ticket;
    } catch (err) {
      console.error('Failed to take ticket:', err);
      const errorMsg = err.error || err.message || 'Échec de la génération du ticket';
      addToast(errorMsg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [mainStructure, services, addToast]);

  const updateQueueStatus = useCallback(async (serviceId, status) => {
    const queue = queues[serviceId];
    if (!queue || !queue.id) {
      addToast("File d'attente introuvable", 'error');
      return;
    }
    try {
      setLoading(true);
      await queuesAPI.setStatus(queue.id, status);
      addToast(`Statut mis à jour : ${status}`, 'success');
      fetchInitialData();
    } catch (err) {
      addToast(err.error || 'Erreur lors de la mise à jour du statut', 'error');
    } finally {
      setLoading(false);
    }
  }, [queues, addToast, fetchInitialData]);

  const serveNext = useCallback(async (serviceId) => {
    const queue = queues[serviceId];
    if (!queue || !queue.id) {
      addToast("File d'attente introuvable", 'error');
      return;
    }
    try {
      const res = await adminAPI.callNext(queue.id);
      addToast(`Appel du numéro #${res.ticket.number}`, 'info');
      fetchInitialData();
    } catch (err) {
      addToast(err.error || 'Erreur lors de l\'appel du ticket', 'error');
    }
  }, [queues, addToast, fetchInitialData]);

  const completeTicket = useCallback(async (ticketId) => {
    try {
      await adminAPI.complete(ticketId);
      addToast('Ticket validé avec succès', 'success');
      fetchInitialData();
    } catch (err) {
      addToast(err.error || 'Erreur lors de la validation du ticket', 'error');
    }
  }, [addToast, fetchInitialData]);

  const missTicket = useCallback(async (ticketId) => {
    try {
      await adminAPI.missed(ticketId);
      addToast('Ticket marqué absent', 'info');
      fetchInitialData();
    } catch (err) {
      addToast(err.error || 'Erreur', 'error');
    }
  }, [addToast, fetchInitialData]);


  // Periodically check my ticket status if active
  useEffect(() => {
    if (!userTicket || !userTicket.id) return;

    const checkMyTicket = async () => {
       try {
         const myTicketsResponse = await ticketsAPI.mine();
         const myTickets = myTicketsResponse.tickets || myTicketsResponse;
         if (Array.isArray(myTickets)) {
           const current = myTickets.find(t => t.id === userTicket.id);
           if (!current || (current.status !== 'waiting' && current.status !== 'called')) {
              console.log('Ticket is no longer active, clearing local state');
              setUserTicket(null);
           }
         }
       } catch (e) {
         console.warn('Failed to sync ticket status', e);
       }
    };

    // Check once when ticket or queues change, but don't loop
    checkMyTicket();
  }, [userTicket?.id]); // Only depend on ID to avoid cycles

  const value = {
    queues,
    services,
    allStructures,
    userTicket,
    toasts,
    activeServiceId,
    setActiveServiceId,
    fetchInitialData,
    takeTicket,
    serveNext,
    completeTicket,
    missTicket,
    updateQueueStatus,
    addToast,
    removeToast,
    mainStructure
  };

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used inside QueueProvider');
  return ctx;
}


