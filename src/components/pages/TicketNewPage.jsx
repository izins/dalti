import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueue } from '../../context/QueueContext';
import { structuresAPI, ticketsAPI } from '../../api/client';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { PageSpinner } from '../ui/Spinner';
import { CheckCircle2, Building2, CreditCard, ChevronRight, MapPin, Clock, AlertCircle } from 'lucide-react';

export default function TicketNewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { services, addToast, fetchInitialData } = useQueue();
  
  const [structures, setStructures] = useState([]);
  const [step, setStep] = useState(1);
  const [selectedStruct, setSelectedStruct] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [structServices, setStructServices] = useState([]);
  const [error, setError] = useState(null);

  // Stable refs to avoid re-render loops
  const servicesRef = useRef(services);
  servicesRef.current = services;
  const initDoneRef = useRef(false);

  // URL params — read once
  const urlStructId = searchParams.get('structure');
  const urlServiceId = searchParams.get('service');

  // Fetch services for a specific structure
  const fetchStructureServices = useCallback(async (structureId) => {
    try {
      const res = await structuresAPI.getServices(structureId);
      const raw = res.services || res;
      const fetched = Array.isArray(raw) ? raw : [];
      // Merge with global services to keep icons/extra data
      const currentServices = servicesRef.current;
      const merged = fetched.map(s => {
        const ctx = currentServices.find(x => x.id === s.id);
        return ctx ? { ...s, ...ctx } : s;
      });
      setStructServices(merged);
      return merged;
    } catch (e) {
      console.error('Failed to fetch structure services:', e);
      setStructServices([]);
      return [];
    }
  }, []); // No deps — uses ref for services

  // INIT: runs once on mount
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const init = async () => {
      try {
        // 1. Fetch all structures
        const data = await structuresAPI.list();
        const structs = Array.isArray(data?.structures) 
          ? data.structures 
          : (Array.isArray(data) ? data : []);
        setStructures(structs);

        // 2. Resolve URL params
        let preStruct = null;
        let preSvc = null;

        if (urlStructId) {
          preStruct = structs.find(x => x.id === urlStructId) || null;
        }
        if (urlServiceId) {
          // Try from context first, then from raw lookup
          const currentServices = servicesRef.current;
          preSvc = currentServices.find(x => x.id === urlServiceId) || null;
        }

        // 3. Route to correct step
        if (preStruct && preSvc) {
          setSelectedStruct(preStruct);
          setSelectedService(preSvc);
          const svcList = await fetchStructureServices(preStruct.id);
          if (svcList.find(x => x.id === preSvc.id)) {
            setStep(3);
          } else {
            setSelectedService(null);
            setStep(2);
          }
        } else if (preStruct) {
          setSelectedStruct(preStruct);
          await fetchStructureServices(preStruct.id);
          setStep(2);
        } else if (preSvc) {
          setSelectedService(preSvc);
          setStep(1);
        }
      } catch (e) {
        console.error('Init error:', e);
        setError("Impossible de charger les données. Veuillez rafraîchir la page.");
      } finally {
        setInitialLoading(false);
      }
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // No dependencies — runs exactly once. Uses refs for dynamic data.

  // Handle structure selection
  const handleStructureSelect = async (struct) => {
    setSelectedStruct(struct);
    setError(null);
    const svcList = await fetchStructureServices(struct.id);

    // Check if we already have a selected service that's available here
    if (selectedService && svcList.find(x => x.id === selectedService.id)) {
      setStep(3);
      return;
    }

    // Fallback: if service was in URL but context wasn't ready during init,
    // check if that service is available at this structure
    if (!selectedService && urlServiceId) {
      const matchedSvc = svcList.find(x => x.id === urlServiceId);
      if (matchedSvc) {
        setSelectedService(matchedSvc);
        setStep(3);
        return;
      }
    }

    // No matching service — user needs to pick one
    if (selectedService) setSelectedService(null);
    setStep(2);
  };

  // Handle service selection
  const handleServiceSelect = (srv) => {
    setSelectedService(srv);
    setError(null);
    setStep(3);
  };

  // Handle confirm — call API directly, not through QueueContext
  const handleConfirm = async () => {
    if (!selectedStruct || !selectedService) {
      setError("Structure et service requis.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Direct API call: ticketsAPI.take(structureId, serviceId)
      const response = await ticketsAPI.take(selectedStruct.id, selectedService.id);
      const ticket = response.ticket || response;
      
      if (ticket && ticket.id) {
        addToast(`Ticket #${ticket.number} généré avec succès !`, 'success');
        // Refresh global queue data in background
        try { fetchInitialData(); } catch (_) {}
        navigate('/history');
      } else {
        setError("Réponse inattendue du serveur. Veuillez réessayer.");
      }
    } catch (err) {
      console.error('Failed to take ticket:', err);
      const msg = err?.error || err?.message || "Échec de la génération du ticket.";
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Structure' },
    { num: 2, title: 'Service' },
    { num: 3, title: 'Confirmation' },
  ];

  if (initialLoading) return <PageSpinner />;

  return (
    <div className="pt-24 pb-32 max-w-3xl mx-auto px-6 bg-[#FDFBF7] min-h-screen">
      <PageHeader title="Prendre un ticket" subtitle="Réservez votre place en 3 étapes simples." />

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-surface-200 -z-10 rounded-full border-2 border-surface-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-amber-300 -z-10 rounded-full transition-all duration-300 border-2 border-surface-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        
        {steps.map(s => (
          <div key={s.num} className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border-4 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors ${
              step >= s.num ? 'bg-amber-300 text-surface-900' : 'bg-white text-surface-400'
            }`}>
              {step > s.num ? <CheckCircle2 size={24} className="text-surface-900" /> : s.num}
            </div>
            <span className={`text-xs font-black uppercase tracking-widest ${step >= s.num ? 'text-surface-900' : 'text-surface-400'}`}>{s.title}</span>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-surface-900 text-sm font-black uppercase flex items-center gap-3">
          <AlertCircle size={24} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Structure */}
      {step === 1 && (
        <div className="animate-fade-in space-y-6">
          <h3 className="text-2xl font-black text-surface-900 mb-6 uppercase tracking-tight">Choisissez une structure</h3>
          {selectedService && (
            <div className="mb-6 p-4 rounded-xl bg-sky-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm font-black text-surface-900 uppercase flex items-center gap-3">
              <CreditCard size={20} className="shrink-0" />
              <span>Service pré-sélectionné : <strong className="text-white bg-surface-900 px-2 py-0.5 rounded">{selectedService.name}</strong> — Choisissez une structure.</span>
            </div>
          )}
          {structures.length === 0 ? (
            <div className="py-12 text-center font-black text-xl text-surface-400 uppercase">Aucune structure disponible.</div>
          ) : structures.map(struct => (
            <Card 
              key={struct.id} 
              hover 
              onClick={() => handleStructureSelect(struct)}
              className="bg-white hover:-translate-y-1 transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-surface-900">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-surface-900 uppercase">{struct.name}</h4>
                    <p className="text-sm font-bold text-surface-600 flex items-center gap-1.5 mt-1 uppercase">
                      <MapPin size={16} /> {struct.commune}, {struct.wilaya}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-amber-300 rounded-xl border-2 border-surface-900 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <ChevronRight className="text-surface-900 stroke-[3px]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Service */}
      {step === 2 && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-surface-900 uppercase tracking-tight">Choisissez un service</h3>
            <button onClick={() => { setSelectedStruct(null); setStep(1); }} className="text-sm text-surface-900 bg-amber-300 px-3 py-1.5 rounded-lg border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black uppercase hover:-translate-y-0.5 transition-transform">
              ← Changer
            </button>
          </div>
          
          {selectedStruct && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm font-black text-surface-900 uppercase flex items-center gap-3">
              <Building2 size={20} className="shrink-0" />
              <span>Structure : <strong className="text-white bg-surface-900 px-2 py-0.5 rounded">{selectedStruct.name}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {structServices.length > 0 ? structServices.map(srv => (
              <Card 
                key={srv.id} 
                hover 
                onClick={() => handleServiceSelect(srv)}
                className="bg-white hover:-translate-y-1 transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl w-14 h-14 bg-sky-300 rounded-xl border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                    {srv.icon || '⚙️'}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-surface-900 uppercase">{srv.name}</h4>
                    <p className="text-xs font-bold text-surface-600 mt-1 uppercase" dir="rtl">{srv.nameAr || srv.name_ar}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t-2 border-dashed border-surface-900 flex items-center gap-2 text-sm font-black text-surface-900 uppercase tracking-widest">
                  <Clock size={16} /> ~{srv.avgTime || srv.avg_time || 10} min
                </div>
              </Card>
            )) : (
              <div className="col-span-full py-12 text-center font-black text-xl text-surface-400 uppercase">
                Aucun service disponible pour cette structure.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="animate-fade-in space-y-8">
          <h3 className="text-2xl font-black text-surface-900 mb-4 uppercase tracking-tight">Résumé de votre réservation</h3>
          
          <Card className="bg-white">
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <Building2 size={24} className="text-surface-900" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-surface-900 bg-emerald-100 px-2 py-0.5 rounded border border-surface-900 uppercase tracking-widest font-black mb-1">Structure</p>
                    <button onClick={() => { setSelectedStruct(null); setStep(1); }} className="text-xs text-surface-900 font-black uppercase hover:underline">Modifier</button>
                  </div>
                  <p className="text-2xl font-black text-surface-900 uppercase">{selectedStruct?.name}</p>
                  <p className="text-sm font-bold text-surface-600 uppercase">{selectedStruct?.commune}, {selectedStruct?.wilaya}</p>
                </div>
              </div>
              
              <div className="w-1 h-10 bg-surface-900 ml-6 -my-6 rounded" />
              
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-sky-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <CreditCard size={24} className="text-surface-900" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-surface-900 bg-sky-100 px-2 py-0.5 rounded border border-surface-900 uppercase tracking-widest font-black mb-1">Service</p>
                    <button onClick={() => setStep(2)} className="text-xs text-surface-900 font-black uppercase hover:underline">Modifier</button>
                  </div>
                  <p className="text-2xl font-black text-surface-900 uppercase">{selectedService?.name}</p>
                  <p className="text-sm font-bold text-surface-600 uppercase">Temps estimé : ~{selectedService?.avgTime || selectedService?.avg_time || 10} min</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="p-5 rounded-xl bg-amber-300 border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-surface-900 text-sm font-black uppercase flex gap-4">
            <Clock size={24} className="shrink-0" />
            <p>Une fois le ticket généré, vous pourrez suivre l'avancement de la file en temps réel depuis votre tableau de bord.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button variant="secondary" onClick={() => setStep(2)} className="w-full sm:w-1/3">Retour</Button>
            <Button onClick={handleConfirm} loading={loading} className="w-full sm:w-2/3" size="lg">
              Confirmer la réservation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
