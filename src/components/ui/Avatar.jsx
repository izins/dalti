import React from 'react';
import { User } from 'lucide-react';

const avatarSizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export default function Avatar({ name, image, size = 'md', className = '' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  if (image) {
    return (
      <img
        src={image}
        alt={name || 'Avatar'}
        className={`${avatarSizes[size]} rounded-full object-cover border-2 border-surface-200 ${className}`}
      />
    );
  }

  if (initials) {
    return (
      <div className={`${avatarSizes[size]} rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${avatarSizes[size]} rounded-full bg-surface-100 text-surface-400 flex items-center justify-center ${className}`}>
      <User size={size === 'sm' ? 14 : size === 'md' ? 16 : 22} />
    </div>
  );
}
