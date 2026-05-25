import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { useSocket } from '../../context/SocketContext';
import { queuesAPI, adminAPI, structuresAPI } from '../../api/client';
import { Navigate, Link } from 'react-router-dom';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Users, AlertTriangle, Play, Square, Check, XCircle, RefreshCw, Ticket, Activity, Timer, Hash, User2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { mainStructure, addToast } = useQueue();
  const { socket } = useSocket();

  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const fetchRef = useRef(null);

  // Resolve admin structure ID robustly
  const [resolvedStructId, setResolvedStructId] = useState(null);

  useEffect(() => {
    const sid = user?.structure_id || mainStructure?.id;
    if (sid) {
      setResolvedStructId(sid);
    } else {
      // Fallback: fetch structures list and pick the admin's or first one
      structuresAPI.list().then(res => {
        const structs = res.structures || res;
        if (Array.isArray(structs) && structs.length > 0) {
          const mine = user?.structure_id ? structs.find(s => s.id === user.structure_id) : null;
          setResolvedStructId(mine?.id || structs[0].id);
        }
      }).catch(() => {});
    }
  }, [user?.structure_id, mainStructure?.id]);

  // Fetch all queues for admin's structure — with real ticket data
  const fetchQueues = useCallback(async (silent = false) => {
    if (!resolvedStructId) return;

    if (!silent) setLoading(true);
    try {
      const res = await queuesAPI.forStructure(resolvedStructId);
      const qs = res.queues || res;
      setQueues(Array.isArray(qs) ? qs : []);

      // Auto-select first queue if none selected
      if (!selectedQueueId && Array.isArray(qs) && qs.length > 0) {
        setSelectedQueueId(qs[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch queues:', err);
    } finally {
      setLoading(false);
    }
  }, [resolvedStructId, selectedQueueId]);

  // Store latest fetchQueues in ref for WebSocket
  useEffect(() => {
    fetchRef.current = fetchQueues;
  }, [fetchQueues]);

  // Initial load
  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  // Auto-polling every 15s — WebSocket fallback for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (fetchRef.current) fetchRef.current(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket: listen for updates and refresh silently
  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      if (fetchRef.current) fetchRef.current(true);
    };

    socket.on('queue_update', handleUpdate);
    socket.on('ticket_called', handleUpdate);

    return () => {
      socket.off('queue_update', handleUpdate);
      socket.off('ticket_called', handleUpdate);
    };
  }, [socket]);

  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  // Get the selected queue data
  const activeQueue = queues.find(q => q.id === selectedQueueId) || null;
  const calledTicket = activeQueue?.called_ticket || null;

  // Real waiting tickets from the backend (find_waiting_in_queue returns actual tickets)
  const waitingTickets = activeQueue?.waiting_tickets || [];
  const waitingCount = activeQueue?.waiting_count || 0;
  const servedToday = activeQueue?.total_today || 0;

  // ======= Admin Actions =======
  const handleCallNext = async () => {
    if (!selectedQueueId || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await adminAPI.callNext(selectedQueueId);
      addToast(`Appel du numéro #${res.ticket?.number}`, 'success');
      await fetchQueues(true);
    } catch (err) {
      addToast(err.error || "Erreur lors de l'appel", 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (ticketId) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await adminAPI.complete(ticketId);
      addToast('Ticket validé ✓', 'success');
      await fetchQueues(true);
    } catch (err) {
      addToast(err.error || 'Erreur lors de la validation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMissed = async (ticketId) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await adminAPI.missed(ticketId);
      addToast('Ticket marqué absent', 'info');
      await fetchQueues(true);
    } catch (err) {
      addToast(err.error || 'Erreur', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (status) => {
    if (!selectedQueueId || actionLoading) return;
    setActionLoading(true);
    try {
      await queuesAPI.setStatus(selectedQueueId, status);
      addToast(`File ${status === 'open' ? 'ouverte' : 'fermée'}`, 'success');
      await fetchQueues(true);
    } catch (err) {
      addToast(err.error || 'Erreur', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-6 lg:px-8 bg-[#FDFBF7] min-h-screen">
      <PageHeader 
        title="Administration" 
        subtitle={`Structure : ${mainStructure?.name || user?.structure_id || '—'}`}
        action={
          <div className="flex gap-2">
            <Link to="/admin/history">
              <Button variant="secondary" size="sm" icon={Activity}>
                Historique
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={RefreshCw} 
              onClick={() => fetchQueues(false)}
              loading={loading}
            >
              Rafraîchir
            </Button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ========= LEFT SIDEBAR ========= */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">

          {/* Queue Selector */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">Files d'attente</h3>
            <div className="space-y-2">
              {queues.map(q => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQueueId(q.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all border-2 border-surface-900 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 ${
                    selectedQueueId === q.id 
                      ? 'bg-emerald-300 text-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5' 
                      : 'bg-white text-surface-900'
                  }`}
                >
                  <span>{q.services?.name || 'Service'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg border-2 border-surface-900 font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                    selectedQueueId === q.id ? 'bg-white text-surface-900' : 'bg-surface-200 text-surface-900'
                  }`}>
                    {q.waiting_count || 0}
                  </span>
                </button>
              ))}
              {queues.length === 0 && !loading && (
                <p className="text-sm text-surface-400 text-center py-4">Aucune file trouvée</p>
              )}
            </div>
          </Card>

          {/* Live Stats */}
          {activeQueue && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center p-4 bg-emerald-300">
                <Users size={24} className="mx-auto mb-2 text-surface-900" />
                <p className="text-3xl font-black text-surface-900">{waitingCount}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-surface-900">En attente</p>
              </Card>
              <Card className="text-center p-4 bg-sky-300">
                <Check size={24} className="mx-auto mb-2 text-surface-900" />
                <p className="text-3xl font-black text-surface-900">{servedToday}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-surface-900">Servis</p>
              </Card>
              <Card className="text-center p-4 bg-amber-300">
                <Activity size={24} className="mx-auto mb-2 text-surface-900" />
                <p className="text-2xl font-black text-surface-900 uppercase">
                  {activeQueue.status === 'open' ? 
                    <span>Ouverte</span> : 
                    <span>Fermée</span>
                  }
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider text-surface-900 mt-1">Statut</p>
              </Card>
              <Card className="text-center p-4 bg-violet-300">
                <Hash size={24} className="mx-auto mb-2 text-surface-900" />
                <p className="text-3xl font-black text-surface-900">{activeQueue.last_called_number || '—'}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-surface-900">Dernier n°</p>
              </Card>
            </div>
          )}
        </div>

        {/* ========= RIGHT: QUEUE MANAGEMENT ========= */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Queue Status Control */}
          {activeQueue && (
            <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-surface-900">
                    {activeQueue.services?.name || 'File'}
                  </h2>
                  <span className={`px-3 py-1 text-xs font-black uppercase rounded-lg border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    activeQueue.status === 'open' 
                      ? 'bg-emerald-300 text-surface-900' 
                      : 'bg-rose-300 text-surface-900'
                  }`}>
                    {activeQueue.status === 'open' ? '● Ouverte' : '● Fermée'}
                  </span>
                </div>
                <p className="text-sm font-bold text-surface-600 uppercase">Contrôle de la file d'attente</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={activeQueue.status === 'open' ? 'secondary' : 'primary'}
                  onClick={() => handleToggleStatus('open')}
                  icon={Play}
                  disabled={actionLoading || activeQueue.status === 'open'}
                >
                  Ouvrir
                </Button>
                <Button 
                  size="sm" 
                  className="bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={() => handleToggleStatus('closed')}
                  icon={Square}
                  disabled={actionLoading || activeQueue.status === 'closed'}
                >
                  Fermer
                </Button>
              </div>
            </Card>
          )}

          {/* Currently Serving — highlighted card */}
          {calledTicket && (
            <Card className="bg-amber-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <AlertTriangle size={24} className="text-surface-900" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-surface-900 uppercase tracking-widest">Au guichet</p>
                    <p className="text-3xl font-black text-surface-900 uppercase">Ticket #{calledTicket.number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black uppercase text-surface-900 flex items-center gap-1.5 justify-end">
                    <User2 size={16} />
                    {calledTicket.users 
                      ? `${calledTicket.users.first_name} ${calledTicket.users.last_name}` 
                      : `Client #${calledTicket.number}`}
                  </p>
                  <p className="text-xs font-bold text-surface-900">
                    Appelé à {calledTicket.called_at ? new Date(calledTicket.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => handleComplete(calledTicket.id)} 
                  icon={Check}
                  loading={actionLoading}
                >
                  Valider (Terminé)
                </Button>
                <Button 
                  className="flex-1" 
                  variant="secondary" 
                  onClick={() => handleMissed(calledTicket.id)}
                  icon={XCircle}
                  loading={actionLoading}
                >
                  Absent
                </Button>
              </div>
            </Card>
          )}

          {/* Call Next Button */}
          {activeQueue && (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleCallNext}
              disabled={activeQueue.status !== 'open' || waitingCount === 0 || actionLoading}
              loading={actionLoading}
              icon={Ticket}
            >
              {waitingCount > 0 ? `Appeler le suivant (${waitingCount} en attente)` : 'Personne en attente'}
            </Button>
          )}

          {/* Waiting List — scrollable */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-widest text-surface-400 mb-4 flex items-center gap-2">
              <Timer size={14} /> File d'attente
            </h3>

            <div className="max-h-[400px] overflow-y-auto -mx-2 px-2">
              {waitingTickets.length > 0 ? (
                <div className="space-y-2">
                  {waitingTickets.map((ticket, index) => (
                    <div 
                      key={ticket.id} 
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                        index === 0 ? 'bg-sky-300' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border-2 border-surface-900 ${
                          index === 0 ? 'bg-white text-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-surface-100 text-surface-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-lg font-black uppercase text-surface-900">Ticket #{ticket.number}</p>
                          <p className="text-xs font-bold uppercase text-surface-600">
                            {ticket.users 
                              ? `${ticket.users.first_name || ''} ${ticket.users.last_name || ''}`.trim() 
                              : `Client`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-surface-600">
                          {ticket.created_at 
                            ? new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </p>
                        {index === 0 && (
                          <span className="text-[10px] font-black text-surface-900 uppercase">Prochain</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-surface-400">
                  <Users size={24} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">La file d'attente est vide</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
