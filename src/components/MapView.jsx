import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { structuresAPI } from '../api/client';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Color mapping for structure types
const TYPE_COLORS = {
  poste: '#2563eb',
  banque: '#059669',
  hopital: '#dc2626',
  hospital: '#dc2626',
  mairie: '#7c3aed',
  municipality: '#7c3aed',
  universite: '#d97706',
  university: '#d97706',
};

const DEFAULT_COLOR = '#6366f1';

// Custom SVG marker icon by type
const createCustomIcon = (type) => {
  const color = TYPE_COLORS[type?.toLowerCase()] || DEFAULT_COLOR;
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="${color}" stroke-width="1.5"/></svg>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Blue pulsing dot for user location
const createUserIcon = () => {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:50%;background:rgba(59,130,246,0.3);display:flex;align-items:center;justify-content:center;animation:pulse 2s infinite"><div style="width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 0 8px rgba(59,130,246,.5)"></div></div>`,
    className: 'user-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

export default function MapView({ onTakeTicket, structures: propStructures, highlightId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const initialFitDone = useRef(false);
  const [localStructures, setLocalStructures] = useState([]);
  
  const structures = propStructures || localStructures;

  // Fetch structures if none provided via props
  useEffect(() => {
    if (!propStructures) {
      structuresAPI.list().then(data => {
        const list = Array.isArray(data?.structures) ? data.structures : (Array.isArray(data) ? data : []);
        setLocalStructures(list);
      }).catch(() => {});
    }
  }, [propStructures]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
    }).setView([36.75, 5.06], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Request user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const userLatLng = [latitude, longitude];
          
          // Add user marker
          if (userMarkerRef.current) userMarkerRef.current.remove();
          userMarkerRef.current = L.marker(userLatLng, { icon: createUserIcon(), zIndexOffset: 1000 })
            .bindPopup('<div class="p-2 text-center text-sm font-semibold">📍 Vous êtes ici</div>', { className: 'custom-popup', closeButton: false })
            .addTo(map);

          // Fly to user location
          map.flyTo(userLatLng, 15, { duration: 1.5 });
        },
        () => {
          // Geolocation denied or failed — stay on default view
          console.log('Geolocation not available, using default view');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    // Fix map size when container resizes
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      delete window._mapTakeTicket;
    };
  }, []);

  // Update markers when structures change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing structure markers (not user marker)
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Global handler for popup button clicks
    window._mapTakeTicket = (id) => {
      if (onTakeTicket) onTakeTicket(id);
    };

    const validStructures = structures.filter(s => {
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    validStructures.forEach(struct => {
      const lat = parseFloat(struct.latitude);
      const lng = parseFloat(struct.longitude);

      const marker = L.marker([lat, lng], { icon: createCustomIcon(struct.type) })
        .bindPopup(`
          <div style="min-width:200px;max-width:280px;padding:12px">
            <h3 style="font-weight:700;font-size:14px;margin:0 0 4px;color:#1e293b">${struct.name}</h3>
            <p style="font-size:11px;color:#94a3b8;margin:0 0 2px;text-transform:capitalize">${struct.type || 'Structure'}</p>
            <p style="font-size:11px;color:#94a3b8;margin:0 0 10px">📍 ${struct.commune || ''}, ${struct.wilaya || ''}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:10px">
              <span style="font-size:11px;color:#94a3b8">En attente</span>
              <span style="font-size:13px;font-weight:700;color:#3b82f6">${struct.total_waiting || 0}</span>
            </div>
            <button onclick="window._mapTakeTicket('${struct.id}')" style="width:100%;background:#3b82f6;color:white;border:none;padding:8px 12px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">
              Prendre un ticket
            </button>
          </div>
        `, {
          className: 'custom-popup',
          closeButton: true,
          maxWidth: 300,
          autoPan: true,
          autoPanPadding: [30, 30],
        });
      
      marker.addTo(map);
      markersRef.current.push(marker);

      if (highlightId && struct.id === highlightId) {
        marker.openPopup();
        map.flyTo([lat, lng], 16, { duration: 0.5 });
      }
    });

    // Only auto-fit on first load, not on every filter change
    if (!initialFitDone.current && markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15));
      initialFitDone.current = true;
    }

    return () => {
      delete window._mapTakeTicket;
    };
  }, [structures, onTakeTicket, highlightId]);

  return (
    <>
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 14px;
          box-shadow: 0 8px 24px -4px rgba(0,0,0,.12);
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          line-height: 1.4;
        }
        .custom-popup .leaflet-popup-close-button {
          top: 6px !important;
          right: 6px !important;
          color: #94a3b8 !important;
          font-size: 18px !important;
        }
        .custom-marker, .user-marker {
          background: none !important;
          border: none !important;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.5; }
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full z-0" />
    </>
  );
}
