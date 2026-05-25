import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../MapView';
import { Search, MapPin, Building2, Filter, Layers } from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { structuresAPI } from '../../api/client';
import { Input, Select } from '../ui/Input';
import Card from '../ui/Card';
import Button from '../ui/Button';

const WILAYAS = ['Béjaïa', 'Alger', 'Oran', 'Constantine', 'Sétif'];

// Structure type labels for filter
const TYPE_LABELS = {
  poste: '📮 Poste',
  banque: '🏦 Banque',
  hopital: '🏥 Hôpital',
  hospital: '🏥 Hôpital',
  mairie: '🏛️ Mairie',
  municipality: '🏛️ Mairie',
  universite: '🎓 Université',
  university: '🎓 Université',
};

export default function MapPage() {
  const navigate = useNavigate();
  const { allStructures } = useQueue();
  const [search, setSearch] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [highlightId, setHighlightId] = useState(null);
  const [structureServicesMap, setStructureServicesMap] = useState({});

  // Fetch services for all structures to show real badges
  useEffect(() => {
    if (allStructures.length === 0) return;

    const fetchAllServices = async () => {
      const newMap = {};
      // Fetch services for each structure (batched)
      await Promise.allSettled(
        allStructures.map(async (struct) => {
          try {
            const res = await structuresAPI.getServices(struct.id);
            const svcs = res.services || res;
            newMap[struct.id] = Array.isArray(svcs) ? svcs : [];
          } catch {
            newMap[struct.id] = [];
          }
        })
      );
      setStructureServicesMap(newMap);
    };

    fetchAllServices();
  }, [allStructures]);

  // Extract unique structure types for the filter dropdown
  const structureTypes = useMemo(() => {
    const types = new Set();
    allStructures.forEach(s => {
      if (s.type) types.add(s.type.toLowerCase());
    });
    return Array.from(types);
  }, [allStructures]);

  const handleStructureSelect = React.useCallback((structureId) => {
    navigate(`/ticket/new?structure=${structureId}`);
  }, [navigate]);

  const filtered = useMemo(() => {
    return allStructures.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
        (s.commune || '').toLowerCase().includes(search.toLowerCase());
      const matchesWilaya = wilaya ? s.wilaya === wilaya : true;
      const matchesType = typeFilter ? (s.type || '').toLowerCase() === typeFilter : true;
      return matchesSearch && matchesWilaya && matchesType;
    });
  }, [allStructures, search, wilaya, typeFilter]);

  return (
    <div className="flex flex-col lg:flex-row h-screen pt-[72px] bg-[#FDFBF7]">
      {/* Sidebar */}
      <div className="w-full lg:w-96 bg-white border-r-4 border-surface-900 flex flex-col h-[50vh] lg:h-full z-10 shrink-0">
        <div className="p-6 border-b-4 border-surface-900 bg-sky-300">
          <h1 className="text-2xl font-black text-surface-900 mb-6 uppercase tracking-tight">Trouver une structure</h1>
          <div className="space-y-3">
            <Input 
              icon={Search} 
              placeholder="Rechercher (ex: Poste centrale...)" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select icon={Filter} value={wilaya} onChange={e => setWilaya(e.target.value)}>
                <option value="">Toutes les wilayas</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </Select>
              <Select icon={Layers} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Tous les types</option>
                {structureTypes.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map(struct => {
            const svcs = structureServicesMap[struct.id] || [];
            return (
              <Card 
                hover 
                key={struct.id} 
                padding={false} 
                className="p-5 bg-white border-2 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform cursor-pointer" 
                onClick={() => {
                  setHighlightId(struct.id);
                  navigate(`/ticket/new?structure=${struct.id}`);
                }}
                onMouseEnter={() => setHighlightId(struct.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-black text-lg text-surface-900 uppercase">{struct.name}</h3>
                  {struct.type && (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-300 text-surface-900 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 ml-2">
                      {struct.type}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-surface-600 flex items-center gap-1.5 mb-4 uppercase">
                  <MapPin size={14} /> {struct.commune}, {struct.wilaya}
                </p>
                <div className="flex flex-wrap gap-2">
                  {svcs.length > 0 ? svcs.map(svc => (
                    <span key={svc.id} className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-amber-300 text-surface-900 border-2 border-surface-900">
                      {svc.name}
                    </span>
                  )) : (
                    <span className="text-[10px] font-bold text-surface-500 italic uppercase">Chargement des services...</span>
                  )}
                </div>
                {struct.total_waiting > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-surface-900 bg-rose-200 inline-block px-2 py-1 rounded border-2 border-surface-900">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    {struct.total_waiting} en attente
                  </div>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-base font-black text-surface-500 text-center py-12 uppercase tracking-widest">Aucune structure trouvée.</p>
          )}
        </div>
      </div>

      <div className="flex-1 h-[50vh] lg:h-full relative bg-surface-100">
        <MapView onTakeTicket={handleStructureSelect} structures={filtered} highlightId={highlightId} />
      </div>
    </div>
  );
}
