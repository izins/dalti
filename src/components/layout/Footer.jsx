import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-white border-t-4 border-surface-900 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-surface-900" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-surface-900 font-black text-2xl">D</span>
              </div>
              <span className="font-black text-2xl text-surface-900 tracking-tight uppercase">DALTI</span>
            </div>
            <p className="text-sm font-bold leading-relaxed text-surface-700 max-w-xs">
              Gestion intelligente des files d'attente pour les services publics algériens.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-xs font-black text-surface-900 uppercase tracking-widest mb-6">Produit</h4>
            <ul className="space-y-3">
              {[
                { label: 'Services', to: '/services' },
                { label: 'Carte interactive', to: '/map' },
                { label: 'Prendre un ticket', to: '/ticket/new' },
                { label: 'Historique', to: '/history' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm font-bold text-surface-600 hover:text-sky-500 hover:underline underline-offset-4 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Société */}
          <div>
            <h4 className="text-xs font-black text-surface-900 uppercase tracking-widest mb-6">Société</h4>
            <ul className="space-y-3">
              {['À propos', 'Confidentialité', 'Conditions', 'Accessibilité'].map(l => (
                <li key={l}>
                  <span className="text-sm font-bold text-surface-600 hover:text-sky-500 hover:underline underline-offset-4 transition-colors cursor-pointer">{l}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-black text-surface-900 uppercase tracking-widest mb-6">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm font-bold text-surface-700">
                <MapPin size={18} className="text-surface-900 shrink-0 mt-0.5" strokeWidth={2.5} />
                Béjaïa, Algérie
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-surface-700">
                <Mail size={18} className="text-surface-900 shrink-0" strokeWidth={2.5} />
                contact@dalti.dz
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-surface-700">
                <Phone size={18} className="text-surface-900 shrink-0" strokeWidth={2.5} />
                +213 34 XX XX XX
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t-4 border-surface-900 bg-emerald-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-black uppercase text-surface-900 flex items-center gap-2">
            © {year} DALTI — Fait avec <Heart size={14} className="text-rose-500 fill-rose-500" /> à Béjaïa
          </p>
          <p className="text-xs font-black uppercase tracking-widest text-surface-900">Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}
