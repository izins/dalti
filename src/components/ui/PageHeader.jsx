import React from 'react';

export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 ${className}`}>
      <div>
        <h1 className="text-4xl font-black uppercase text-surface-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-surface-600 font-bold mt-2">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
