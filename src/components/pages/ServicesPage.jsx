import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueue } from '../../context/QueueContext';
import { Search, MapPin, Building2, Stethoscope, Landmark, Mail as MailIcon, GraduationCap, ChevronRight, Clock, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { Input } from '../ui/Input';
import Card from '../ui/Card';

const iconMap = {
  hospital: Stethoscope,
  municipality: Building2,
  bank: Landmark,
  post: MailIcon,
  university: GraduationCap,
};

export default function ServicesPage() {
  const { services, queues } = useQueue();
  const [search, setSearch] = useState('');



  const filtered = services.filter(s => 
    (s?.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (s?.nameAr || '').includes(search)
  );

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-6 lg:px-8 bg-[#FDFBF7] min-h-screen">
      <PageHeader
        title="Services disponibles"
        subtitle="Trouvez le service dont vous avez besoin et réservez votre place."
        action={
          <div className="w-full sm:w-72">
            <Input 
              icon={Search} 
              placeholder="Rechercher un service..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service, i) => {
          const Icon = iconMap[service.id] || Building2;
          const waiting = service.total_waiting || 0;

          const colors = [
            'bg-emerald-300 text-surface-900 border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'bg-sky-300 text-surface-900 border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'bg-violet-300 text-surface-900 border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'bg-amber-300 text-surface-900 border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'bg-rose-300 text-surface-900 border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          ];

          return (
            <Link to={`/services/${service.id}`} key={service.id}>
              <Card hover className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${colors[i % colors.length]} flex items-center justify-center shrink-0`}>
                    <Icon size={26} />
                  </div>
                  {service.is_popular && <Badge variant="primary">Populaire</Badge>}
                </div>
                
                <h3 className="text-2xl font-black text-surface-900 mb-1 uppercase tracking-tight">{service.name}</h3>
                <p className="text-sm font-bold text-surface-600 mb-6" dir="rtl">{service.nameAr}</p>
                
                <div className="mt-auto pt-6 border-t-4 border-surface-900 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-surface-900">
                      <Users size={14} className="text-emerald-500" />
                      {waiting} <span className="hidden sm:inline">en attente</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-surface-900">
                      <Clock size={16} className="text-sky-500" />
                      ~{service.avgTime || 10} min
                    </span>
                  </div>
                  <ChevronRight size={24} className="text-surface-900" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-surface-500">Aucun service trouvé pour "{search}"</p>
        </div>
      )}
    </div>
  );
}
