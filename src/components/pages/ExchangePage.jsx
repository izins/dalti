import React, { useState, useEffect } from 'react';
import { exchangesAPI } from '../../api/client';
import { useQueue } from '../../context/QueueContext';
import { PageSpinner } from '../ui/Spinner';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ArrowLeftRight, Check, X, Clock, User, Zap, Info } from 'lucide-react';
import { StatusBadge } from '../ui/Badge';

export default function ExchangePage() {
  const [exchanges, setExchanges] = useState({ incoming: [], outgoing: [] });
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useQueue();

  const fetchData = async () => {
    try {
      const [exData, partData] = await Promise.all([
        exchangesAPI.mine(),
        exchangesAPI.discover()
      ]);
      setExchanges({ 
        incoming: exData.incoming || [], 
        outgoing: exData.outgoing || [] 
      });
      setPartners(partData.partners || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id, action) => {
    try {
      if (action === 'accept') await exchangesAPI.accept(id);
      else await exchangesAPI.reject(id);
      addToast(`Demande ${action === 'accept' ? 'acceptée' : 'refusée'} avec succès.`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.error || 'Erreur lors de l\'action', 'error');
    }
  };

  const handlePropose = async (targetTicketId, myTicketId) => {
    try {
      await exchangesAPI.propose(myTicketId, targetTicketId);
      addToast('Demande d\'échange envoyée !', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Erreur lors de la demande d\'échange', 'error');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-6 lg:px-8 bg-[#FDFBF7] min-h-screen">
      <PageHeader 
        title="Échange de tickets" 
        subtitle="Trouvez des partenaires et gérez vos propositions d'échanges."
      />

      {/* Discovery Section (New) */}
      <div className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-300 flex items-center justify-center border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Zap size={24} className="text-surface-900" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-surface-900 uppercase tracking-tight">Découvrir des partenaires</h2>
            <p className="text-sm text-surface-600 font-bold uppercase tracking-widest mt-1">Personnes prêtes à échanger.</p>
          </div>
        </div>

        {partners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map(partner => (
              <Card key={partner.id} className="p-5 flex items-center justify-between bg-white border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <User size={20} className="text-surface-900" />
                  </div>
                  <div>
                    <p className="text-base font-black text-surface-900 uppercase">{partner.users?.first_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                       <p className="text-[10px] font-black text-surface-900 bg-sky-300 border border-surface-900 px-2 py-0.5 rounded uppercase tracking-widest shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                         Ticket #{partner.number}
                       </p>
                       <span className="text-[10px] text-surface-500 font-black uppercase tracking-widest bg-surface-100 border border-surface-200 px-2 py-0.5 rounded">Pos {partner.position}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handlePropose(partner.id, partner.my_ticket_id)}
                  className="w-12 h-12 rounded-xl bg-surface-900 text-white flex items-center justify-center border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-800 hover:-translate-y-1 transition-transform shrink-0"
                >
                  <ArrowLeftRight size={20} />
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-[2rem] border-4 border-surface-900 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Info className="mx-auto text-surface-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-surface-900 font-black text-xl uppercase mb-2">Aucun partenaire trouvé</p>
            <p className="text-sm font-bold text-surface-500 uppercase tracking-widest">Les partenaires apparaissent quand d'autres personnes sont dans la même file.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Incoming */}
        <div>
          <h3 className="text-2xl font-black text-surface-900 mb-6 flex items-center gap-4 uppercase tracking-tight">
            Demandes reçues
            <span className="bg-sky-300 text-surface-900 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm px-3 py-1 rounded-lg">{exchanges.incoming.length}</span>
          </h3>
          <div className="space-y-6">
            {exchanges.incoming.map(ex => (
              <Card key={ex.id} hover className="bg-white border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                       <ArrowLeftRight size={20} className="text-surface-900" />
                    </div>
                    <div>
                      <p className="text-base font-black text-surface-900 uppercase">Proposition reçue</p>
                      <p className="text-xs font-bold text-surface-600 mt-1 uppercase tracking-widest">#{ex.target_ticket_id} ↔ #{ex.owner_ticket_id}</p>
                    </div>
                  </div>
                  <StatusBadge status={ex.status} />
                </div>
                {ex.status === 'pending' && (
                  <div className="flex gap-4 pt-4 border-t-2 border-dashed border-surface-900">
                    <button onClick={() => handleAction(ex.id, 'reject')} className="flex-1 py-3 bg-white border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl font-black text-surface-900 uppercase tracking-widest hover:bg-rose-300 transition-colors flex items-center justify-center gap-2">
                      <X size={18} /> Refuser
                    </button>
                    <button onClick={() => handleAction(ex.id, 'accept')} className="flex-1 py-3 bg-emerald-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl font-black text-surface-900 uppercase tracking-widest hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                      <Check size={18} /> Accepter
                    </button>
                  </div>
                )}
              </Card>
            ))}
            {exchanges.incoming.length === 0 && (
              <div className="p-8 text-center rounded-2xl border-4 border-surface-900 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-black text-surface-500 uppercase tracking-widest">Aucune demande reçue</p>
              </div>
            )}
          </div>
        </div>

        {/* Outgoing */}
        <div>
          <h3 className="text-2xl font-black text-surface-900 mb-6 flex items-center gap-4 uppercase tracking-tight">
            Demandes envoyées
            <span className="bg-surface-200 text-surface-900 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm px-3 py-1 rounded-lg">{exchanges.outgoing.length}</span>
          </h3>
          <div className="space-y-6">
            {exchanges.outgoing.map(ex => (
              <Card key={ex.id} hover className="bg-white border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-100 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                       <Clock size={20} className="text-surface-900" />
                    </div>
                    <div>
                      <p className="text-base font-black text-surface-900 uppercase">En attente</p>
                      <p className="text-xs font-bold text-surface-600 mt-1 uppercase tracking-widest">#{ex.owner_ticket_id} ↔ #{ex.target_ticket_id}</p>
                    </div>
                  </div>
                  <StatusBadge status={ex.status} />
                </div>
              </Card>
            ))}
            {exchanges.outgoing.length === 0 && (
              <div className="p-8 text-center rounded-2xl border-4 border-surface-900 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-black text-surface-500 uppercase tracking-widest">Aucune demande envoyée</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
