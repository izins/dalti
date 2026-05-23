import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueue } from '../../context/QueueContext';
import { structuresAPI } from '../../api/client';
import { ArrowLeft, Clock, MapPin, Building2, Users, ArrowRight } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { PageSpinner } from '../ui/Spinner';
import MapView from '../MapView';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const { services, queues } = useQueue();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  const service = services.find(s => s.id === id);
  const queue = queues[id];
  const waiting = queue?.people?.filter(p => p.status === 'waiting').length || 0;

  useEffect(() => {
    // In a real app, we would fetch structures specifically for this service:
    // structuresAPI.forService(id).then(...)
    structuresAPI.list().then(data => {
      setStructures(Array.isArray(data?.structures) ? data.structures : (Array.isArray(data) ? data : []));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (!service) return <PageSpinner />;

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-6 lg:px-8 bg-[#FDFBF7] min-h-screen">
      <Link to="/services" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-surface-900 hover:translate-x-[-4px] transition-transform mb-8">
        <ArrowLeft size={16} /> Retour aux services
      </Link>

      <PageHeader
        title={service.name}
        subtitle={service.nameAr}
        action={
          <Link to={`/ticket/new?service=${service.id}`}>
            <Button size="lg" icon={ArrowRight}>Prendre un ticket</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Info & Structures */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card>
            <h3 className="text-2xl font-black uppercase tracking-tight text-surface-900 mb-4">À propos de ce service</h3>
            <p className="text-surface-700 font-bold leading-relaxed mb-6">
              Ce service concerne toutes les opérations liées à "{service.name}". Le temps d'attente estimé par personne est de {service.avgTime || 10} minutes. 
              Veuillez vous assurer d'avoir tous les documents nécessaires avant de prendre votre ticket.
            </p>
            <div className="flex gap-6 py-4 border-t-4 border-surface-900">
              <div>
                <p className="text-xs text-surface-600 uppercase tracking-wider font-black mb-1">En attente globale</p>
                <p className="text-3xl font-black text-surface-900 flex items-center gap-2">
                  <Users size={24} className="text-emerald-500" /> {waiting}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-600 uppercase tracking-wider font-black mb-1">Temps moyen</p>
                <p className="text-3xl font-black text-surface-900 flex items-center gap-2">
                  <Clock size={24} className="text-sky-500" /> {service.avgTime || 10}m
                </p>
              </div>
            </div>
          </Card>

          <div>
            <h3 className="text-3xl font-black uppercase tracking-tight text-surface-900 mb-6">Structures disponibles</h3>
            {loading ? <PageSpinner /> : (
              <div className="grid gap-4">
                {structures.map(struct => (
                  <Card key={struct.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-lg text-surface-900 flex items-center gap-2 uppercase">
                        <Building2 size={20} className="text-amber-500" />
                        {struct.name}
                      </h4>
                      <p className="text-sm font-bold text-surface-600 flex items-center gap-1.5 mt-1">
                        <MapPin size={16} /> {struct.address}, {struct.commune}, {struct.wilaya}
                      </p>
                    </div>
                    <Link to={`/ticket/new?structure=${struct.id}&service=${service.id}`}>
                      <Button variant="secondary" size="sm">Sélectionner</Button>
                    </Link>
                  </Card>
                ))}
                {structures.length === 0 && (
                  <p className="text-surface-500">Aucune structure ne propose ce service pour le moment.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Map View of structures for this service */}
        <div className="lg:col-span-1">
          <Card padding={false} className="overflow-hidden h-[400px] lg:h-[600px] sticky top-24">
            {/* Reusing MapView - assuming it can be adapted to show specific structures in a real app */}
            <MapView />
          </Card>
        </div>
      </div>
    </div>
  );
}
