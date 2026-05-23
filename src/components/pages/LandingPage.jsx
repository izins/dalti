import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQueue, FALLBACK_SERVICES } from '../../context/QueueContext';
import { useSocket } from '../../context/SocketContext';
import { ArrowRight, Ticket, Clock, MapPin, Building2, Stethoscope, Landmark, Mail as MailIcon, GraduationCap, Users, Zap, Shield, CheckCircle, Star, Quote, ChevronRight, MessageSquare, Bot, Send } from 'lucide-react';
import { structuresAPI } from '../../api/client';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Badge } from '../ui/Badge';

const iconMap = {
  hospital: Stethoscope,
  municipality: Building2,
  bank: Landmark,
  post: MailIcon,
  university: GraduationCap,
};

export default function LandingPage() {
  const { services, queues, userTicket, allStructures } = useQueue();
  const { user } = useAuth();
  const { socket } = useSocket();

  const activeTicket = userTicket;
  const globalWaiting = services.reduce((sum, s) => sum + (s.total_waiting || 0), 0);

  const [selectedStructureId, setSelectedStructureId] = useState(null);
  const [structureServices, setStructureServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Dynamic platform stats
  const [platformStats, setPlatformStats] = useState(null);

  useEffect(() => {
    structuresAPI.stats()
      .then(res => setPlatformStats(res.stats || res))
      .catch(() => setPlatformStats(null));
  }, []);

  useEffect(() => {
    if (!selectedStructureId) { setStructureServices([]); return; }
    setLoadingServices(true);
    structuresAPI.getServices(selectedStructureId)
      .then(res => {
        const svcs = res.services || res;
        setStructureServices(Array.isArray(svcs) ? svcs : []);
      })
      .catch(() => setStructureServices([]))
      .finally(() => setLoadingServices(false));
  }, [selectedStructureId]);

  return (
    <div className="flex flex-col">

      {/* ============ HERO ============ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#FDFBF7] border-b-8 border-surface-900">
        <div className="absolute top-10 right-20 w-64 h-64 bg-amber-300 rounded-full border-4 border-surface-900 opacity-50 mix-blend-multiply pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-sky-300 rounded-[3rem] border-4 border-surface-900 opacity-50 mix-blend-multiply pointer-events-none transform rotate-12" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-32 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-200 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-8 transform -rotate-1">
                <Zap size={14} className="text-surface-900" />
                <span className="text-surface-900 text-xs font-black tracking-wide uppercase">
                  Gestion intelligente des files d'attente
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-surface-900 tracking-tight leading-[1.1] mb-6 uppercase">
                Fini l'attente.<br/>
                <span className="text-accent-500 inline-block transform -rotate-1">
                  Réservez votre place.
                </span>
              </h1>

              <p className="text-xl text-surface-700 font-medium leading-relaxed mb-10 max-w-md">
                Prenez votre ticket virtuel, suivez votre position en temps réel, et arrivez exactement quand c'est votre tour.
              </p>

              <div className="flex flex-wrap gap-4">
                {!user ? (
                  <Link to="/register">
                    <button className="flex items-center gap-2 px-6 py-3 bg-accent-400 hover:bg-accent-500 text-surface-900 border-4 border-surface-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-lg font-black uppercase tracking-wide">
                      S'inscrire gratuitement <ArrowRight size={20} />
                    </button>
                  </Link>
                ) : (
                  <Link to={activeTicket ? "/history" : "/services"}>
                    <button className="flex items-center gap-2 px-6 py-3 bg-accent-400 hover:bg-accent-500 text-surface-900 border-4 border-surface-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-lg font-black uppercase tracking-wide">
                      {activeTicket ? 'Suivre mon ticket' : 'Prendre un ticket'} <ArrowRight size={20} />
                    </button>
                  </Link>
                )}
                <Link to="/map">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-surface-50 text-surface-900 border-4 border-surface-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-lg font-black uppercase tracking-wide">
                    Structures ouvertes
                  </button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex justify-end">
              <div className="relative w-[480px] transform rotate-1 hover:rotate-0 transition-transform duration-300">
                {/* Visual Representation of Queue Flow */}
                <div className="bg-white rounded-3xl p-8 border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-bl-full border-b-4 border-l-4 border-surface-900 -mr-4 -mt-4" />
                  
                  <div className="flex justify-between items-center mb-8 relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-400 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                           <Clock size={24} className="text-surface-900" />
                        </div>
                        <div>
                           <p className="font-bold text-surface-900 text-lg">
                             {activeTicket ? 'Votre Ticket' : "Temps d'attente"}
                           </p>
                           <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">
                             {activeTicket ? activeTicket.queues?.structures?.name : "Centre d'Alger Centre"}
                           </p>
                        </div>
                     </div>
                     <Badge variant={activeTicket ? "primary" : "success"} className="px-3 py-1">
                       {activeTicket ? activeTicket.status : 'Direct'}
                     </Badge>
                  </div>
                  
                   <div className="space-y-4 relative z-10">
                      {(() => {
                        let items = [];
                        if (activeTicket) {
                           const q = Array.isArray(activeTicket.queues) ? activeTicket.queues[0] : activeTicket.queues;
                           const current = q?.last_called_number || 0;
                           const myNum = activeTicket.number;
                           
                           items = [
                             { num: current, status: 'serving', label: 'En cours', color: 'text-primary-600' },
                             { num: Math.min(myNum - 1, current + 1) === myNum ? current : Math.min(myNum - 1, current + 1), 
                               status: 'waiting', 
                               label: 'Suivant', 
                               color: 'text-surface-900' 
                             },
                             { num: myNum, status: 'you', label: 'Votre tour', color: 'text-accent-600' }
                           ];
                           
                           if (items[1].num === items[0].num || items[1].num === items[2].num) {
                              items.splice(1, 1);
                           }
                        } else {
                           const popularSvc = services.find(s => s.total_waiting > 0) || (services.length > 0 ? services[0] : {id: '1', total_waiting: 0});
                           const q = Object.values(queues).find(q => q.service?.id === popularSvc?.id);
                           const current = q?.currentNumber || 124;
                           
                           items = [
                             { num: current, status: 'serving', label: 'En cours', color: 'text-primary-600' },
                             { num: current + 1, status: 'waiting', label: 'Suivant', color: 'text-surface-900' },
                             { num: current + 4, status: 'you', label: 'Projection', color: 'text-accent-600' }
                           ];
                        }

                        return items.map((item, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 rounded-xl transition-all border-2 border-surface-900 ${item.status === 'you' ? 'bg-accent-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-[1.02] transform -rotate-1' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                             <div className="flex items-center gap-4">
                                <div className={`text-2xl font-black ${item.color}`}>
                                   #{item.num}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-surface-400 uppercase tracking-tighter">{item.label}</p>
                                </div>
                             </div>
                             {item.status === 'you' ? (
                                <div className="flex flex-col items-end">
                                   <span className="text-xs font-black text-accent-600 bg-accent-100 px-2 py-0.5 rounded-full mb-1">
                                      {activeTicket ? 'VOUS' : 'PROJECTION'}
                                   </span>
                                   <span className="text-xs text-surface-400 font-medium">
                                      ~{activeTicket?.estimated_time || 15} min
                                   </span>
                                </div>
                             ) : (
                                <span className="text-xs font-bold text-surface-400">
                                   {item.status === 'serving' ? 'Guichet' : 'Attente'}
                                </span>
                             )}
                          </div>
                        ));
                      })()}
                   </div>
                </div>

                <div className="mt-6 flex items-center justify-between bg-white rounded-2xl px-5 py-4 border-4 border-surface-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 hover:rotate-0 transition-transform">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                         <Zap size={18} className="text-surface-900" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-surface-500 uppercase tracking-wider">Économie</p>
                         <p className="text-sm font-black text-surface-900">25 min / visite</p>
                      </div>
                   </div>
                   <div className="text-right border-l-2 border-surface-200 pl-4">
                      <p className="text-[10px] font-black text-surface-500 uppercase tracking-wider">Actifs</p>
                      <p className="text-sm font-black text-primary-600">{globalWaiting > 0 ? globalWaiting : 48}+</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 relative">
            <div className="absolute top-0 right-10 w-16 h-16 bg-rose-200 rounded-full border-4 border-surface-900 -z-10 animate-ping" />
            <p className="text-sm font-black text-primary-600 uppercase tracking-widest mb-3 bg-white inline-block px-4 py-1 border-2 border-surface-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">Simple & Rapide</p>
            <h2 className="text-4xl lg:text-5xl font-black text-surface-900 tracking-tight uppercase">
              Gagnez du temps<br/>au quotidien
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '1',
                title: 'Trouvez un service',
                desc: 'Recherchez les banques, postes ou administrations proches de vous.',
                icon: MapPin,
                color: 'bg-emerald-300',
              },
              {
                step: '2',
                title: 'Réservez votre place',
                desc: 'Prenez votre ticket virtuel instantanément depuis votre smartphone.',
                icon: Zap,
                color: 'bg-amber-300',
              },
              {
                step: '3',
                title: 'Soyez notifié',
                desc: 'Suivez l\'avancement en temps réel et recevez une alerte à votre tour.',
                icon: Clock,
                color: 'bg-violet-300',
              },
            ].map((item, i) => (
              <div key={i} className="relative p-8 rounded-3xl border-4 border-surface-900 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all group">
                <span className="text-8xl font-black text-surface-50 absolute top-2 right-4 -z-10 group-hover:text-surface-100 transition-colors">
                  {item.step}
                </span>
                <div className={`w-14 h-14 rounded-2xl ${item.color} border-4 border-surface-900 flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform group-hover:rotate-12 transition-transform`}>
                  <item.icon size={26} className="text-surface-900" />
                </div>
                <h3 className="text-xl font-black text-surface-900 mb-3 uppercase tracking-tight">{item.title}</h3>
                <p className="text-sm font-medium text-surface-700 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ POPULAR SERVICES ============ */}
      <section className="py-24 lg:py-32 bg-amber-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16 relative">
            <div className="absolute -top-10 left-1/2 w-24 h-24 bg-sky-200 rounded-[2rem] border-4 border-surface-900 -z-10 transform -rotate-12" />
            <div>
              <p className="text-sm font-black text-primary-600 uppercase tracking-widest mb-3 bg-white inline-block px-4 py-1 border-2 border-surface-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-1">Top Services</p>
              <h2 className="text-4xl lg:text-5xl font-black text-surface-900 tracking-tight uppercase">
                Services les<br/>plus demandés
              </h2>
            </div>
            <Link to="/services" className="inline-block">
              <button className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-primary-100 text-surface-900 border-4 border-surface-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-black uppercase tracking-wide">
                Voir tout <ArrowRight size={18} />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(services.length > 0 ? services : FALLBACK_SERVICES).slice(0, 6).map((service, i) => {
              const Icon = iconMap[service.id] || Building2;
              const waiting = service.total_waiting || 0;

              const colors = [
                'bg-emerald-300',
                'bg-sky-300',
                'bg-rose-300',
                'bg-amber-300',
                'bg-violet-300',
              ];

              return (
                <Link to={`/services/${service.id}`} key={service.id} className="group block">
                  <div className="h-full bg-white p-6 rounded-3xl border-4 border-surface-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                    <div className="flex items-start gap-5">
                      <div className={`w-14 h-14 rounded-2xl ${colors[i % colors.length]} border-4 border-surface-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform`}>
                        <Icon size={26} className="text-surface-900" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-surface-900 text-lg uppercase tracking-tight truncate">{service.name}</h3>
                          {service.is_popular && <span className="bg-primary-400 text-surface-900 text-[10px] font-black uppercase px-2 py-0.5 border-2 border-surface-900 rounded-full">Top</span>}
                        </div>
                        <p className="text-sm font-bold text-surface-500 mb-4 font-arabic" dir="rtl">{service.nameAr}</p>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-xs font-black text-surface-900 bg-surface-100 px-2 py-1 rounded-lg border-2 border-surface-900">
                            <Users size={14} className="text-surface-900" />
                            {waiting} en attente
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-black text-surface-900 bg-amber-100 px-2 py-1 rounded-lg border-2 border-surface-900">
                            <Clock size={14} className="text-surface-900" />
                            ~{service.avgTime || 10} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="py-24 lg:py-32 bg-rose-50 border-y-8 border-surface-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 relative">
             <div className="absolute top-10 left-0 w-12 h-12 bg-amber-300 rounded-full border-4 border-surface-900 -z-10" />
            <p className="text-sm font-black text-primary-600 uppercase tracking-widest mb-3 bg-white inline-block px-4 py-1 border-2 border-surface-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">En chiffres</p>
            <h2 className="text-4xl lg:text-5xl font-black text-surface-900 tracking-tight uppercase">
              DALTI en<br/>temps réel
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: platformStats?.total_services ?? services.length, label: 'Services disponibles', icon: Zap, color: 'bg-emerald-300' },
              { value: platformStats?.total_waiting ?? globalWaiting, label: 'Personnes en attente', icon: Users, color: 'bg-amber-300' },
              { value: platformStats?.avg_wait_time ? `${platformStats.avg_wait_time}m` : '—', label: 'Attente moyenne', icon: Clock, color: 'bg-sky-300' },
              { value: platformStats?.served_today ?? 0, label: 'Servis aujourd\'hui', icon: CheckCircle, color: 'bg-violet-300' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-3xl bg-white border-4 border-surface-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all group">
                <div className={`w-14 h-14 rounded-2xl ${stat.color} border-4 border-surface-900 flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform`}>
                  <stat.icon size={26} className="text-surface-900" />
                </div>
                <p className="text-4xl lg:text-5xl font-black text-surface-900 mb-1 tracking-tighter">{stat.value}</p>
                <p className="text-sm font-bold text-surface-600 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-24 lg:py-32 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 relative">
            <div className="absolute -top-6 right-20 w-16 h-16 bg-sky-200 rounded-[2rem] border-4 border-surface-900 -z-10 transform rotate-12" />
            <p className="text-sm font-black text-primary-600 uppercase tracking-widest mb-3 bg-white inline-block px-4 py-1 border-2 border-surface-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-2">Témoignages</p>
            <h2 className="text-4xl lg:text-5xl font-black text-surface-900 tracking-tight uppercase">
              Ce que disent nos<br/>utilisateurs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Amira B.', role: 'Étudiante, Béjaïa', rating: 5, text: "J'ai économisé tellement de temps ! Avant je passais 2h à la poste, maintenant je prends mon ticket depuis la fac et j'arrive pile à mon tour.", avatar: 'AB', color: 'bg-emerald-300' },
              { name: 'Karim M.', role: 'Commerçant, Alger', rating: 5, text: "Solution géniale pour les virements bancaires. Je gère mes passages en banque entre deux clients. L'appli est fluide et les notifications marchent bien.", avatar: 'KM', color: 'bg-amber-300' },
              { name: 'Fatima Z.', role: 'Mère de famille, Oran', rating: 4, text: "Plus besoin de faire la queue avec les enfants ! Je prends le ticket à distance et on y va quand c'est presque notre tour. Très pratique.", avatar: 'FZ', color: 'bg-rose-300' },
            ].map((review, i) => (
              <div key={i} className="relative bg-white rounded-3xl p-8 border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all group">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full border-4 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Quote size={20} className="text-surface-900 fill-surface-900" />
                </div>
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={18} className={s < review.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'} />
                  ))}
                </div>
                <p className="text-base font-medium text-surface-700 leading-relaxed mb-8 relative z-10 italic">"{review.text}"</p>
                <div className="flex items-center gap-4 pt-4 border-t-4 border-surface-900">
                  <div className={`w-12 h-12 rounded-xl ${review.color} border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-surface-900 text-sm font-black`}>
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-base font-black text-surface-900 uppercase tracking-tight">{review.name}</p>
                    <p className="text-xs font-bold text-surface-500 uppercase">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STRUCTURES BROWSER ============ */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-sm font-black text-primary-600 uppercase tracking-widest mb-3 bg-rose-200 inline-block px-4 py-1 border-2 border-surface-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">Structures</p>
              <h2 className="text-4xl lg:text-5xl font-black text-surface-900 tracking-tight uppercase">
                Parcourir par<br/>structure
              </h2>
              <p className="text-surface-600 font-medium mt-4 max-w-lg">Sélectionnez un établissement pour découvrir les services disponibles et prendre un ticket.</p>
            </div>
            <Link to="/map" className="inline-block">
              <button className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-emerald-100 text-surface-900 border-4 border-surface-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-black uppercase tracking-wide">
                Voir la carte <ArrowRight size={18} />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Structure List */}
            <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {(allStructures.length > 0 ? allStructures : [
                { id: 'f1', name: 'Algérie Poste - Centre Ville', type: 'poste', commune: 'Béjaïa', wilaya: 'Béjaïa' },
                { id: 'f2', name: 'BADR Banque', type: 'banque', commune: 'Béjaïa', wilaya: 'Béjaïa' },
                { id: 'f3', name: 'BNA Banque', type: 'banque', commune: 'Béjaïa', wilaya: 'Béjaïa' },
              ]).map(struct => {
                const isSelected = selectedStructureId === struct.id;
                const StructIcon = struct.type === 'poste' ? MailIcon : struct.type === 'banque' ? Landmark : Building2;
                return (
                  <button
                    key={struct.id}
                    onClick={() => setSelectedStructureId(isSelected ? null : struct.id)}
                    className={`w-full text-left p-4 rounded-2xl border-4 transition-all flex items-center gap-4 group ${
                      isSelected
                        ? 'border-surface-900 bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1'
                        : 'border-surface-900 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                      isSelected ? 'bg-white text-surface-900' : 'bg-surface-100 text-surface-900 group-hover:bg-amber-100'
                    }`}>
                      <StructIcon size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-surface-900 uppercase truncate">{struct.name}</p>
                      <p className="text-xs font-bold text-surface-600 flex items-center gap-1 mt-1 uppercase">
                        <MapPin size={12} /> {struct.commune || ''}{struct.wilaya ? `, ${struct.wilaya}` : ''}
                      </p>
                    </div>
                    <ChevronRight size={20} className={`shrink-0 transition-transform ${isSelected ? 'rotate-90 text-surface-900' : 'text-surface-900'}`} />
                  </button>
                );
              })}
            </div>

            {/* Services Panel */}
            <div className="lg:col-span-3">
              {!selectedStructureId ? (
                <div className="h-full flex flex-col items-center justify-center bg-[#FDFBF7] rounded-3xl border-4 border-surface-900 border-dashed p-12 text-center min-h-[360px]">
                  <div className="w-20 h-20 rounded-2xl bg-white border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6 transform -rotate-3">
                    <Building2 size={36} className="text-surface-900" />
                  </div>
                  <p className="text-2xl font-black text-surface-900 uppercase mb-2">Sélectionnez une structure</p>
                  <p className="text-sm font-medium text-surface-600 max-w-sm">Cliquez sur un établissement à gauche pour voir les services qu'il propose.</p>
                </div>
              ) : loadingServices ? (
                <div className="h-full flex items-center justify-center bg-amber-50 rounded-3xl border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[360px]">
                  <div className="animate-spin w-12 h-12 border-4 border-surface-900 border-t-amber-400 rounded-full" />
                </div>
              ) : (
                <div className="bg-amber-50 rounded-3xl border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 min-h-[360px]">
                  <p className="text-sm font-black text-surface-900 bg-white inline-block px-3 py-1 border-2 border-surface-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest mb-6 transform -rotate-1">
                    {structureServices.length} service{structureServices.length !== 1 ? 's' : ''} disponible{structureServices.length !== 1 ? 's' : ''}
                  </p>
                  {structureServices.length === 0 ? (
                    <p className="text-base font-bold text-surface-500 py-12 text-center">Aucun service trouvé pour cette structure.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {structureServices.map(svc => (
                        <Link
                          key={svc.id}
                          to={`/ticket/new?structure=${selectedStructureId}&service=${svc.id}`}
                          className="flex items-center gap-4 bg-white p-5 rounded-2xl border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-violet-200 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 group-hover:bg-violet-300 group-hover:rotate-12 transition-transform">
                            <Ticket size={22} className="text-surface-900" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-black text-surface-900 uppercase truncate mb-0.5">{svc.name}</p>
                            <p className="text-xs font-bold text-surface-500 truncate">{svc.description || 'Prendre un ticket'}</p>
                          </div>
                          <ArrowRight size={20} className="text-surface-900 group-hover:translate-x-1 transition-transform shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CHATBOT CTA ============ */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-amber-300 border-4 border-surface-900 rounded-[3rem] p-8 lg:p-16 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-300 overflow-hidden">
            
            {/* Playful background shapes */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-rose-400 rounded-full border-4 border-surface-900 opacity-50 mix-blend-multiply pointer-events-none animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-400 rounded-full border-4 border-surface-900 opacity-50 mix-blend-multiply pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
              
              {/* Left — Text */}
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-8 transform -rotate-2 hover:rotate-0 transition-transform">
                  <Zap size={18} className="text-amber-500 fill-amber-500" />
                  <span className="text-surface-900 font-bold uppercase tracking-wider text-xs">
                    Assistant Magique
                  </span>
                </div>
                
                <h2 className="text-4xl lg:text-5xl font-black text-surface-900 tracking-tight leading-[1.1] mb-6">
                  Besoin d'un coup de main ? <br/>
                  <span className="text-rose-500">Demandez à DALTI !</span>
                </h2>
                
                <p className="text-xl text-surface-800 font-medium mb-8 leading-relaxed">
                  Notre robot intelligent comprend le français et la derja ! Dites-lui ce que vous cherchez, il s'occupe de tout.
                </p>
                
                <div className="flex flex-col gap-4 mb-10">
                  {[
                    { text: 'Trouve le guichet le plus rapide', color: 'bg-emerald-300' },
                    { text: 'Prend votre ticket tout seul', color: 'bg-violet-300' },
                    { text: 'Parle français et derja (عربية)', color: 'bg-sky-300' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full ${item.color} border-2 border-surface-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                        <CheckCircle size={16} className="text-surface-900" />
                      </div>
                      <span className="font-bold text-surface-900">{item.text}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/chatbot" className="inline-block group">
                  <button className="flex items-center gap-3 px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white border-4 border-surface-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 transition-all text-lg font-black uppercase tracking-wide">
                    <MessageSquare size={24} className="fill-white" />
                    Parler au Robot
                  </button>
                </Link>
              </div>
              
              {/* Right — Chat Preview (Playful Version) */}
              <div className="hidden lg:block relative">
                {/* Floating elements */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-white border-4 border-surface-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-12 flex items-center justify-center z-20 animate-bounce">
                  <span className="text-xl">✨</span>
                </div>
                
                <div className="relative bg-white rounded-3xl border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  {/* Chat header */}
                  <div className="bg-primary-400 px-6 py-5 border-b-4 border-surface-900 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Bot size={28} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-black text-surface-900 text-lg uppercase tracking-tight">Robot DALTI</p>
                      <p className="text-xs font-bold text-surface-800 bg-white/50 inline-block px-2 py-0.5 rounded-full border border-surface-900">En ligne</p>
                    </div>
                  </div>
                  
                  {/* Chat messages preview */}
                  <div className="px-6 py-6 space-y-6 bg-[#FDFBF7] min-h-[300px]">
                    {/* Bot message */}
                    <div className="flex items-end gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-300 border-2 border-surface-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Bot size={16} className="text-surface-900" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-bl-none px-5 py-3 border-2 border-surface-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-w-[85%]">
                        <p className="text-sm font-bold text-surface-900">Merhba! 👋 Comment je peux t'aider ?</p>
                      </div>
                    </div>
                    
                    {/* User message */}
                    <div className="flex items-end gap-3 flex-row-reverse">
                      <div className="bg-accent-400 rounded-2xl rounded-br-none px-5 py-3 border-2 border-surface-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-w-[85%]">
                        <p className="text-sm font-bold text-surface-900">خصني نسحب دراهم في وهران</p>
                      </div>
                    </div>
                    
                    {/* Bot response */}
                    <div className="flex items-end gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-300 border-2 border-surface-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Bot size={16} className="text-surface-900" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-bl-none px-5 py-3 border-2 border-surface-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-w-[85%]">
                        <p className="text-sm font-bold text-surface-900 leading-relaxed">
                          J'ai trouvé ! ✨<br/>
                          🏢 <span className="bg-amber-200 px-1 rounded border border-surface-900">Poste Oran Centre</span><br/>
                          ⏱️ ~8 min d'attente<br/>
                          Je te prends un ticket ?
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fake input bar */}
                  <div className="px-5 py-4 bg-white border-t-4 border-surface-900 flex items-center gap-3">
                    <div className="flex-1 bg-surface-100 border-2 border-surface-300 rounded-xl px-4 py-3">
                      <span className="text-sm font-bold text-surface-400">Écris un message...</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-surface-200 border-2 border-surface-300 flex items-center justify-center">
                      <Send size={20} className="text-surface-400" />
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-primary-300 border-4 border-surface-900 rounded-[3rem] p-12 lg:p-20 text-center relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden group">
            
            <div className="absolute top-0 right-0 p-8 transform translate-x-1/2 -translate-y-1/2 group-hover:rotate-12 transition-transform duration-500">
              <Star size={120} className="text-accent-400 fill-accent-400 opacity-50" />
            </div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl lg:text-6xl font-black text-surface-900 tracking-tight mb-6 uppercase">
                Prêt à sauter la file ?
              </h2>
              <p className="text-xl lg:text-2xl text-surface-800 font-medium mb-10">
                Rejoins DALTI et arrête de perdre ton temps dans les salles d'attente.
              </p>
              
              <div className="flex flex-wrap justify-center gap-6">
                {!user && (
                  <Link to="/register" className="inline-block">
                    <button className="px-8 py-4 bg-accent-400 hover:bg-accent-500 text-surface-900 border-4 border-surface-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all text-xl font-black uppercase tracking-wide">
                      C'est parti ! 🚀
                    </button>
                  </Link>
                )}
                <Link to="/map" className="inline-block">
                  <button className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-surface-50 text-surface-900 border-4 border-surface-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all text-xl font-black uppercase tracking-wide">
                    <MapPin size={24} />
                    Voir la carte
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
