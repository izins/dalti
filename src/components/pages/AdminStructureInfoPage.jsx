import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { structuresAPI, queuesAPI } from '../../api/client';
import { Navigate, Link } from 'react-router-dom';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { PageSpinner } from '../ui/Spinner';
import { 
  Building2, MapPin, Navigation, ArrowLeft, Clock,
  Hash, Users, Phone, Mail, Globe, Activity
} from 'lucide-react';

export default function AdminStructureInfoPage() {
  const { user } = useAuth();
  const { mainStructure } = useQueue();

  const [structure, setStructure] = useState(null);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const structId = user?.structure_id || mainStructure?.id;

  const fetchStructureData = useCallback(async () => {
    let sid = structId;
    
    // Fallback if structId isn't loaded yet
    if (!sid) {
      try {
        const res = await structuresAPI.list();
        const structs = res.structures || res;
        if (Array.isArray(structs) && structs.length > 0) {
          sid = structs[0].id;
        }
      } catch {}
    }
    
    if (!sid) { 
      setLoading(false); 
      return; 
    }

    try {
      const [structRes, queuesRes] = await Promise.all([
        structuresAPI.get(sid),
        queuesAPI.forStructure(sid)
      ]);

      setStructure(structRes.structure || structRes);
      
      const qs = queuesRes.queues || queuesRes;
      setQueues(Array.isArray(qs) ? qs : []);

    } catch (err) {
      console.error('Failed to fetch structure info:', err);
      setError('Impossible de charger les informations de la structure.');
    } finally {
      setLoading(false);
    }
  }, [structId]);

  useEffect(() => {
    fetchStructureData();
  }, [fetchStructureData]);

  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  if (loading) return <PageSpinner />;

  if (error || !structure) {
    return (
      <div className="pt-24 pb-32 max-w-5xl mx-auto px-6 text-center">
        <Card className="py-16">
          <Building2 size={48} className="mx-auto mb-4 text-surface-300" />
          <h2 className="text-xl font-bold text-surface-900 mb-2">Structure introuvable</h2>
          <p className="text-surface-500 mb-6">{error || "Les informations de votre structure ne sont pas disponibles."}</p>
          <Link to="/admin">
            <Button variant="primary">Retour au guichet</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 max-w-5xl mx-auto px-6 bg-[#FDFBF7] min-h-screen">
      <PageHeader 
        title="Informations Structure" 
        subtitle="Détails et configuration de votre établissement"
        action={
          <Link to="/admin">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Retour au guichet
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-sky-300">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-surface-900 shrink-0">
                <Building2 size={40} />
              </div>
              <div>
                <h2 className="text-4xl font-black text-surface-900 uppercase tracking-tight leading-none mb-3">{structure.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-4 py-1.5 bg-white border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-surface-900 text-xs font-black uppercase tracking-widest rounded-lg">
                    {structure.type === 'hospital' ? 'Hôpital' : 
                     structure.type === 'bank' ? 'Banque' : 
                     structure.type === 'telecom' ? 'Télécom' : structure.type}
                  </span>
                  <span className="text-sm font-black text-surface-900 uppercase flex items-center gap-1.5 bg-white/50 px-3 py-1 rounded-lg border-2 border-surface-900">
                    <MapPin size={16} /> {structure.wilaya}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t-4 border-surface-900 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-xl border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black text-surface-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Navigation size={16} /> Adresse
                </p>
                <p className="text-base font-bold text-surface-900">
                  {structure.address || 'Non spécifiée'}
                </p>
              </div>
              
              {structure.latitude && structure.longitude && (
                <div className="bg-white p-4 rounded-xl border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs font-black text-surface-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Globe size={16} /> Coordonnées GPS
                  </p>
                  <p className="text-base font-bold text-surface-900">
                    {structure.latitude.toFixed(4)}, {structure.longitude.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Queues & Services */}
          <h3 className="text-2xl font-black text-surface-900 uppercase mt-12 mb-6 flex items-center gap-3">
            <Activity size={28} className="text-surface-900" />
            Services & Files d'attente
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {queues.length > 0 ? (
              queues.map(queue => (
                <Card key={queue.id} className="p-5 bg-white hover:-translate-y-1 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-xl text-surface-900 uppercase">{queue.services?.name || 'Service'}</h4>
                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      queue.status === 'open' 
                        ? 'bg-emerald-300 text-surface-900' 
                        : 'bg-rose-300 text-surface-900'
                    }`}>
                      {queue.status === 'open' ? 'Ouverte' : 'Fermée'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                    <div className="bg-amber-300 p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                      <Users size={20} className="mx-auto mb-2 text-surface-900" />
                      <p className="font-black text-3xl text-surface-900">{queue.waiting_count || 0}</p>
                      <p className="text-[10px] font-black text-surface-900 uppercase mt-1">En attente</p>
                    </div>
                    <div className="bg-violet-300 p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                      <Hash size={20} className="mx-auto mb-2 text-surface-900" />
                      <p className="font-black text-3xl text-surface-900">{queue.last_called_number || '—'}</p>
                      <p className="text-[10px] font-black text-surface-900 uppercase mt-1">Dernier n°</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-[2rem] border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-surface-900 font-black uppercase text-xl">Aucun service configuré</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-emerald-300">
            <h3 className="text-sm font-black uppercase tracking-widest text-surface-900 mb-6 bg-white inline-block px-3 py-1 rounded-lg border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-10 h-10 rounded-xl bg-surface-900 flex items-center justify-center text-white shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-surface-600 uppercase">Téléphone</p>
                  <p className="text-base font-black text-surface-900">{structure.phone || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-10 h-10 rounded-xl bg-surface-900 flex items-center justify-center text-white shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-surface-600 uppercase">Email</p>
                  <p className="text-base font-black text-surface-900 break-all">{structure.email || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-rose-300">
            <h3 className="text-sm font-black uppercase tracking-widest text-surface-900 mb-6 flex items-center gap-2 bg-white inline-block px-3 py-1 rounded-lg border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Clock size={16} className="inline-block -mt-0.5" /> Horaires d'ouverture
            </h3>
            
            <div className="bg-white p-4 rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {structure.opening_hours ? (
                <div className="space-y-3 text-sm">
                  {Object.entries(structure.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center py-2 border-b-2 border-dashed border-surface-200 last:border-0 last:pb-0">
                      <span className="font-bold text-surface-600 uppercase">{day}</span>
                      <span className="font-black text-surface-900">{hours || 'Fermé'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-surface-200">
                    <span className="font-bold text-surface-600 uppercase">Dim - Jeu</span>
                    <span className="font-black text-surface-900">08:00 - 16:30</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-bold text-surface-600 uppercase">Ven - Sam</span>
                    <span className="font-black text-surface-900">Fermé</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
