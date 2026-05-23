import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { adminAPI, structuresAPI } from '../../api/client';
import { Navigate, Link } from 'react-router-dom';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { PageSpinner } from '../ui/Spinner';
import { 
  ArrowLeft, Clock, Check, XCircle, PhoneCall, Ban,
  Filter, ChevronDown, User2, Hash, Calendar, Activity, Download
} from 'lucide-react';

const STATUS_STYLES = {
  completed: { bg: 'bg-emerald-300', border: 'border-surface-900', text: 'text-surface-900', label: 'Terminé', icon: Check },
  missed: { bg: 'bg-rose-300', border: 'border-surface-900', text: 'text-surface-900', label: 'Absent', icon: XCircle },
  called: { bg: 'bg-amber-300', border: 'border-surface-900', text: 'text-surface-900', label: 'Appelé', icon: PhoneCall },
  cancelled: { bg: 'bg-surface-200', border: 'border-surface-900', text: 'text-surface-900', label: 'Annulé', icon: Ban },
};

const ACTION_LABELS = {
  called: { label: 'Appelé', color: 'text-surface-900' },
  completed: { label: 'Validé', color: 'text-surface-900' },
  missed: { label: 'Marqué absent', color: 'text-surface-900' },
};

export default function AdminHistoryPage() {
  const { user } = useAuth();
  const { mainStructure } = useQueue();

  const [tickets, setTickets] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterQueue, setFilterQueue] = useState('all');
  const [expandedTicket, setExpandedTicket] = useState(null);

  const structId = user?.structure_id || mainStructure?.id;

  const fetchHistory = useCallback(async () => {
    let sid = structId;
    if (!sid) {
      try {
        const res = await structuresAPI.list();
        const structs = res.structures || res;
        if (Array.isArray(structs) && structs.length > 0) {
          sid = structs[0].id;
        }
      } catch {}
    }
    if (!sid) { setLoading(false); return; }

    try {
      const res = await adminAPI.history(sid);
      setTickets(res.tickets || []);
      setActions(res.actions || []);
    } catch (err) {
      console.error('Failed to fetch admin history:', err);
    } finally {
      setLoading(false);
    }
  }, [structId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  // Get unique queue/service names for filter
  const queueNames = [...new Set(tickets.map(t => t.queues?.services?.name).filter(Boolean))];

  // Filter tickets
  const filtered = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterQueue !== 'all' && t.queues?.services?.name !== filterQueue) return false;
    return true;
  });

  // Get actions for a specific ticket
  const getTicketActions = (ticketId) => actions.filter(a => a.ticket_id === ticketId);

  const formatTime = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  const exportToCSV = () => {
    if (filtered.length === 0) return;
    
    const headers = ['ID Ticket', 'Numéro', 'Service', 'Statut', 'Client', 'Créé à', 'Appelé à', 'Terminé à', 'Attente réelle (min)'];
    
    const csvContent = [
      headers.join(','),
      ...filtered.map(t => {
        const clientName = t.users ? `${t.users.first_name || ''} ${t.users.last_name || ''}`.trim() : 'Client';
        const serviceName = t.queues?.services?.name || 'Service';
        
        return [
          t.id,
          t.number,
          `"${serviceName}"`,
          t.status,
          `"${clientName}"`,
          t.created_at || '',
          t.called_at || '',
          t.completed_at || '',
          t.actual_wait_time || 0
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historique_dalti_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="pt-24 pb-32 max-w-5xl mx-auto px-6 bg-[#FDFBF7] min-h-screen">
      <PageHeader 
        title="Historique Admin" 
        subtitle="Toutes les actions effectuées sur les tickets"
        action={
          <div className="flex gap-2">
            <Button 
              variant="primary" 
              size="sm" 
              icon={Download} 
              onClick={exportToCSV}
              disabled={filtered.length === 0}
            >
              Exporter CSV
            </Button>
            <Link to="/admin">
              <Button variant="secondary" size="sm" icon={ArrowLeft}>
                Retour
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-surface-900 bg-white text-sm font-black uppercase text-surface-900 cursor-pointer focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <option value="all">Tous les statuts</option>
            <option value="completed">✅ Terminés</option>
            <option value="missed">❌ Absents</option>
            <option value="called">📞 Appelés</option>
            <option value="cancelled">🚫 Annulés</option>
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-900 pointer-events-none stroke-[3px]" />
        </div>

        {/* Queue/service filter */}
        <div className="relative">
          <select
            value={filterQueue}
            onChange={e => setFilterQueue(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-surface-900 bg-white text-sm font-black uppercase text-surface-900 cursor-pointer focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <option value="all">Toutes les files</option>
            {queueNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-900 pointer-events-none stroke-[3px]" />
        </div>

        {/* Count */}
        <div className="flex items-center gap-2 text-sm font-black text-surface-900 uppercase ml-auto">
          <Filter size={16} />
          <span>{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Ticket List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16 bg-white border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Activity size={48} className="mx-auto mb-4 text-surface-900" />
          <p className="text-surface-900 font-black text-xl uppercase">Aucun ticket trouvé</p>
          <p className="text-sm font-bold text-surface-600 mt-2 uppercase">Les tickets traités apparaîtront ici</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => {
            const style = STATUS_STYLES[ticket.status] || STATUS_STYLES.cancelled;
            const StatusIcon = style.icon;
            const ticketActions = getTicketActions(ticket.id);
            const isExpanded = expandedTicket === ticket.id;

            return (
              <Card 
                key={ticket.id} 
                className={`${style.bg} cursor-pointer transition-all hover:-translate-y-1`}
                onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
              >
                {/* Main row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center bg-white ${style.text}`}>
                      <StatusIcon size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg text-surface-900 uppercase">Ticket #{ticket.number}</span>
                        <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase ${style.text} bg-white border-2 border-surface-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                          {style.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs font-bold text-surface-900 uppercase">
                        <span className="flex items-center gap-1.5">
                          <User2 size={14} />
                          {ticket.users 
                            ? `${ticket.users.first_name || ''} ${ticket.users.last_name || ''}`.trim()
                            : 'Client'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Hash size={14} />
                          {ticket.queues?.services?.name || 'Service'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-surface-900 uppercase flex items-center gap-1.5 justify-end">
                      <Calendar size={16} />
                      {formatDate(ticket.created_at)}
                    </p>
                    <p className="text-xs font-bold text-surface-900 flex items-center gap-1 justify-end mt-1 uppercase">
                      <Clock size={14} />
                      {formatTime(ticket.created_at)}
                      {ticket.actual_wait_time > 0 && (
                        <span className="ml-2 bg-white px-2 py-0.5 rounded border border-surface-900">• {ticket.actual_wait_time} min</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Expanded: Admin Actions Timeline */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t-4 border-surface-900">
                    <h4 className="text-sm font-black uppercase tracking-widest text-surface-900 mb-4 bg-white inline-block px-3 py-1 rounded-lg border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      Actions administrateur
                    </h4>
                    {ticketActions.length > 0 ? (
                      <div className="space-y-3">
                        {ticketActions.map((action, i) => {
                          const actionStyle = ACTION_LABELS[action.action] || { label: action.action, color: 'text-surface-900' };
                          return (
                            <div key={action.id || i} className="flex items-center gap-3 text-sm bg-white p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <div className="w-3 h-3 rounded-full bg-surface-900 shrink-0" />
                              <span className={`font-black uppercase ${actionStyle.color}`}>{actionStyle.label}</span>
                              <span className="font-bold text-surface-600 uppercase">par</span>
                              <span className="font-black text-surface-900 uppercase">
                                {action.users 
                                  ? `${action.users.first_name || ''} ${action.users.last_name || ''}`.trim()
                                  : 'Admin'}
                              </span>
                              <span className="text-xs font-black text-surface-900 bg-surface-200 px-2 py-1 rounded border border-surface-900 ml-auto">
                                {formatTime(action.created_at)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-surface-900 uppercase bg-white p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">Aucune action enregistrée</p>
                    )}

                    {/* Extra ticket details */}
                    <div className="mt-6 pt-6 border-t-2 border-dashed border-surface-900 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="bg-white p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-bold text-surface-600 uppercase block mb-1">Créé à</span>
                        <span className="font-black text-lg text-surface-900">{formatTime(ticket.created_at)}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-bold text-surface-600 uppercase block mb-1">Appelé à</span>
                        <span className="font-black text-lg text-surface-900">{formatTime(ticket.called_at)}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-bold text-surface-600 uppercase block mb-1">Terminé à</span>
                        <span className="font-black text-lg text-surface-900">{formatTime(ticket.completed_at)}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-bold text-surface-600 uppercase block mb-1">Attente réelle</span>
                        <span className="font-black text-lg text-surface-900">
                          {ticket.actual_wait_time ? `${ticket.actual_wait_time} min` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
