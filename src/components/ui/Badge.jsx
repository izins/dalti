import React from 'react';

const variants = {
  default: 'bg-surface-200 text-surface-900',
  primary: 'bg-emerald-300 text-surface-900',
  success: 'bg-green-300 text-surface-900',
  warning: 'bg-amber-300 text-surface-900',
  danger: 'bg-rose-300 text-surface-900',
  info: 'bg-sky-300 text-surface-900',
};

const statusMap = {
  waiting: { label: 'En attente', style: 'bg-amber-300 text-surface-900' },
  serving: { label: 'En cours', style: 'bg-sky-300 text-surface-900' },
  completed: { label: 'Terminé', style: 'bg-emerald-300 text-surface-900' },
  done: { label: 'Terminé', style: 'bg-emerald-300 text-surface-900' },
  missed: { label: 'Manqué', style: 'bg-rose-300 text-surface-900' },
  cancelled: { label: 'Annulé', style: 'bg-surface-300 text-surface-900' },
  pending: { label: 'En attente', style: 'bg-amber-300 text-surface-900' },
  accepted: { label: 'Accepté', style: 'bg-emerald-300 text-surface-900' },
  rejected: { label: 'Refusé', style: 'bg-rose-300 text-surface-900' },
};

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const config = statusMap[status] || statusMap.waiting;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${config.style} ${className}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-80 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
      {config.label}
    </span>
  );
}

export default Badge;
