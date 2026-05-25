import React from 'react';
import { AlertCircle } from 'lucide-react';

export function Input({ label, error, helper, icon: Icon, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-black uppercase tracking-wider text-surface-900">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        )}
        <input
          className={`w-full h-12 rounded-xl border-2 bg-white text-surface-900 text-sm font-bold placeholder:text-surface-400 placeholder:font-medium outline-none transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 focus:-translate-x-0.5 ${Icon ? 'pl-11 pr-4' : 'px-4'} ${error ? 'border-danger focus:border-danger' : 'border-surface-900 focus:border-primary-400'}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      {helper && !error && <p className="text-xs text-surface-400">{helper}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-black uppercase tracking-wider text-surface-900">{label}</label>}
      <select
        className={`w-full h-12 rounded-xl border-2 bg-white text-surface-900 text-sm font-bold px-4 outline-none transition-all duration-200 appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 focus:-translate-x-0.5 ${error ? 'border-danger focus:border-danger' : 'border-surface-900 focus:border-primary-400'}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, helper, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-black uppercase tracking-wider text-surface-900">{label}</label>}
      <textarea
        className={`w-full rounded-xl border-2 bg-white text-surface-900 text-sm font-bold p-4 outline-none transition-all duration-200 resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 focus:-translate-x-0.5 ${error ? 'border-danger focus:border-danger' : 'border-surface-900 focus:border-primary-400'}`}
        rows={4}
        {...props}
      />
      {error && <p className="text-xs text-danger flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      {helper && !error && <p className="text-xs text-surface-400">{helper}</p>}
    </div>
  );
}
