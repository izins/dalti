import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../api/client';
import { PageSpinner } from '../ui/Spinner';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { Ticket, Calendar, Building2, Search, Filter, Trash2, ArrowLeftRight, Info, Users, Layers, Timer, Zap, Activity, MapPin, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Input, Select } from '../ui/Input';
import { useSocket } from '../../context/SocketContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [longPressTimeout, setLongPressTimeout] = useState(null);
  const [pressingId, setPressingId] = useState(null);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const { socket } = useSocket();

  const fetchHistory = React.useCallback((silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      ticketsAPI.mine(), 
      ticketsAPI.history()
    ])
      .then(([mineData, histData]) => {
        const mine = Array.isArray(mineData?.tickets) ? mineData.tickets : (Array.isArray(mineData) ? mineData : []);
        const hist = Array.isArray(histData?.tickets) ? histData.tickets : (Array.isArray(histData) ? histData : []);
        
        const combined = [...mine, ...hist].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        
        setTickets(combined);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch history error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchHistory(true);
    socket.on('queue_update', handleUpdate);
    return () => socket.off('queue_update', handleUpdate);
  }, [socket, fetchHistory]);

  const filtered = tickets.filter(ticket => {
    const q = Array.isArray(ticket.queues) ? ticket.queues[0] : ticket.queues;
    const serviceName = q?.services?.name || ticket.service_name || '';
    
    const matchesSearch = 
      String(ticket.number || '').includes(search) || 
      serviceName.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && ticket.status === filter;
  });

  const handleCancel = async (id) => {
    if (!confirm('Voulez-vous vraiment annuler ce ticket ?')) return;
    try {
      await ticketsAPI.cancel(id);
      fetchHistory();
    } catch (err) {
      alert('Erreur lors de l\'annulation');
    }
  };

  const startPress = (ticket) => {
    if (ticket.status !== 'waiting' && ticket.status !== 'called') return;
    setPressingId(ticket.id);
    const timeout = setTimeout(() => {
      handleCancel(ticket.id);
      setPressingId(null);
    }, 800);
    setLongPressTimeout(timeout);
  };

  const endPress = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
    setPressingId(null);
  };

  const handleExchangeRedirect = () => {
    navigate('/exchanges');
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-6 lg:px-8 bg-[#FDFBF7] min-h-screen">
      <PageHeader 
        title="Historique des tickets" 
        subtitle="Retrouvez tous vos tickets passés et en cours."
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="w-full sm:w-72">
          <Input 
            icon={Search} 
            placeholder="Rechercher un ticket..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select icon={Filter} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="waiting">En attente</option>
            <option value="completed">Terminés</option>
            <option value="missed">Manqués</option>
            <option value="cancelled">Annulés</option>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(ticket => (
          <Card 
            key={ticket.id} 
            hover 
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 cursor-pointer transition-all ${pressingId === ticket.id ? 'scale-[0.98] bg-rose-300 border-4 border-surface-900' : ''}`}
            onClick={() => !pressingId && setSelectedTicketId(ticket.id)}
            onMouseDown={() => startPress(ticket)}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={() => startPress(ticket)}
            onTouchEnd={endPress}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-300 border-4 border-surface-900 flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Ticket size={24} className={`text-surface-900 ${ticket.status === 'waiting' ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-3xl font-black text-surface-900 tracking-tight">#{ticket.number}</h3>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="text-sm font-black uppercase text-surface-600 tracking-widest">
                  {ticket.queues?.services?.name || ticket.service_name || 'Service'}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm font-bold text-surface-600">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 size={16} className="text-surface-900" /> 
                    {ticket.queues?.structures?.name || 'Structure principale'}
                  </span>
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar size={16} className="text-surface-900" /> 
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                 {ticket.status === 'waiting' && (
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-black text-surface-600 uppercase">Appuyez pour détails</span>
                       <span className="text-[10px] font-black text-rose-500 uppercase">Long pour annuler</span>
                    </div>
                 )}
                 {ticket.qr_image && (
                   <div className="w-16 h-16 bg-white p-1 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <img src={ticket.qr_image} alt="QR" className="w-full h-full object-contain" />
                   </div>
                 )}
              </div>
              
              {ticket.status === 'waiting' && (
                <Button 
                  size="sm" 
                  variant="accent" 
                  icon={ArrowLeftRight}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExchangeRedirect();
                  }}
                >
                  Échanger
                </Button>
              )}
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Ticket size={48} className="text-surface-900 mx-auto mb-4" />
            <p className="text-surface-900 font-black text-xl uppercase">Aucun ticket trouvé.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!selectedTicketId} 
        onClose={() => setSelectedTicketId(null)}
        title="Détails du Ticket"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-8">
             {/* Header with QR and Status */}
             <div className="flex flex-col md:flex-row gap-8 items-center md:items-start bg-emerald-50 p-6 rounded-[2rem] border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative shrink-0">
                  <div className="w-40 h-40 bg-white p-3 rounded-[1.5rem] border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                     {selectedTicket.qr_image ? (
                       <img src={selectedTicket.qr_image} alt="QR" className="w-full h-full object-contain" />
                     ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center text-surface-900">
                          <Ticket size={48} />
                          <p className="text-[10px] mt-2 font-black uppercase">QR NON DISPONIBLE</p>
                       </div>
                     )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-300 border-2 border-surface-900 text-surface-900 text-xs font-black px-4 py-1.5 rounded-full uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                    Ticket #{selectedTicket.number}
                  </div>
                </div>

                <div className="flex-1 w-full space-y-4">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={selectedTicket.status} />
                        <span className="text-xs font-black text-surface-600 uppercase tracking-wider">
                           ID: {selectedTicket.id.slice(0, 8)}...
                        </span>
                      </div>
                      <h2 className="text-3xl font-black text-surface-900 leading-tight uppercase tracking-tight">
                        {selectedTicket.queues?.services?.name || selectedTicket.service_name || 'Service Standard'}
                      </h2>
                      <p className="flex items-center gap-1.5 text-surface-700 font-bold mt-1 uppercase">
                         <Building2 size={20} className="text-surface-900" />
                         {selectedTicket.queues?.structures?.name || 'Structure Principale'}
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-sky-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-surface-900">
                            <Calendar size={20} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-surface-600 uppercase leading-none">Date</p>
                            <p className="text-base font-black text-surface-900">
                               {new Date(selectedTicket.created_at).toLocaleDateString()}
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-rose-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-surface-900">
                            <Clock size={20} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-surface-600 uppercase leading-none">Heure</p>
                            <p className="text-base font-black text-surface-900">
                               {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Live Stats */}
             <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'En attente', value: (Array.isArray(selectedTicket.queue_stats) ? selectedTicket.queue_stats[0] : selectedTicket.queue_stats)?.waiting_count ?? 0, icon: Users, color: 'text-surface-900', bg: 'bg-emerald-300' },
                  { label: 'Traités', value: (Array.isArray(selectedTicket.queue_stats) ? selectedTicket.queue_stats[0] : selectedTicket.queue_stats)?.served_count ?? 0, icon: Zap, color: 'text-surface-900', bg: 'bg-amber-300' },
                  { label: 'Attente moy.', value: `${(Array.isArray(selectedTicket.queue_stats) ? selectedTicket.queue_stats[0] : selectedTicket.queue_stats)?.avg_wait_time ?? 0}m`, icon: Timer, color: 'text-surface-900', bg: 'bg-sky-300' }
                ].map((stat, i) => (
                  <div key={i} className={`relative overflow-hidden ${stat.bg} p-4 rounded-[1.5rem] border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1`}>
                     <stat.icon size={24} className={`${stat.color} mb-3`} />
                     <p className="text-[10px] font-black text-surface-900 uppercase tracking-widest">{stat.label}</p>
                     <p className="text-2xl font-black text-surface-900">{stat.value}</p>
                  </div>
                ))}
             </div>

             {/* Status Timeline */}
             <div className="space-y-4">
                 <h3 className="text-sm font-black text-surface-900 uppercase tracking-widest flex items-center gap-2">
                   <Activity size={20} className="text-surface-900" />
                   Progression du ticket
                </h3>
                <div className="relative pl-2">
                   {/* Track Line */}
                   <div className="absolute left-7 top-0 bottom-0 w-1 bg-surface-900" />
                   
                   <div className="space-y-6 relative">
                      {[
                        { status: 'waiting', label: 'Ticket validé', time: selectedTicket.created_at, desc: 'Votre demande est en file d\'attente' },
                        { status: 'called', label: 'Appel au guichet', time: selectedTicket.called_at, desc: 'Votre numéro est appelé' },
                        { status: 'completed', label: 'Service terminé', time: selectedTicket.completed_at, desc: 'Merci de votre visite' }
                      ].map((step, i) => {
                        const isCompleted = selectedTicket.status === step.status || 
                                           (step.status === 'waiting' && ['called', 'completed'].includes(selectedTicket.status)) ||
                                           (step.status === 'called' && selectedTicket.status === 'completed');
                        const isCurrent = selectedTicket.status === step.status;
                        const hasTime = step.time && step.time !== '00:00:00+00:00' && !step.time.startsWith('1970');

                        return (
                          <div key={i} className={`flex gap-4 items-start ${!isCompleted ? 'opacity-50' : ''}`}>
                             <div className={`w-10 h-10 rounded-xl border-2 border-surface-900 flex items-center justify-center shrink-0 z-10 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                               isCompleted ? 'bg-emerald-300 text-surface-900' : 'bg-white text-surface-300'
                             }`}>
                                {isCompleted ? <CheckCircle2 size={20} /> : <div className="w-2.5 h-2.5 rounded-full bg-surface-300" />}
                             </div>
                             <div className="flex-1 pt-1.5">
                                <div className="flex justify-between items-center mb-0.5">
                                   <p className={`text-sm font-black uppercase tracking-wider ${isCurrent ? 'text-sky-500' : 'text-surface-900'}`}>{step.label}</p>
                                   {hasTime && <span className="text-[10px] font-black uppercase bg-white border border-surface-900 px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                </div>
                                <p className="text-xs text-surface-600 font-bold">{step.desc}</p>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
             </div>

             {/* Footer Actions */}
             <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t-4 border-surface-900 border-dashed">
                {selectedTicket.status === 'waiting' && (
                  <Button 
                    className="w-full" 
                    variant="danger" 
                    icon={Trash2} 
                    onClick={() => {
                      handleCancel(selectedTicket.id);
                      setSelectedTicketId(null);
                    }}
                  >
                    Annuler le ticket
                  </Button>
                )}
                <Button className="w-full" variant="secondary" onClick={() => setSelectedTicketId(null)}>
                   Fermer les détails
                </Button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
