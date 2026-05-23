import React from 'react';

export default function Card({ children, className = '', padding = true, hover = false, ...props }) {
  return (
    <div
      className={`bg-white border-4 border-surface-900 rounded-[2rem] ${padding ? 'p-6 md:p-8' : ''} ${hover ? 'hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200 cursor-pointer shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-4 border-b-4 border-surface-900 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`pt-4 border-t-4 border-surface-900 mt-4 ${className}`}>
      {children}
    </div>
  );
}
