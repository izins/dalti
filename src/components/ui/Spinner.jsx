import React from 'react';

const sizes = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`${sizes[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin ${className}`} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-surface-400 font-medium">Chargement...</p>
      </div>
    </div>
  );
}
