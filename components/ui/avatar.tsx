'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  userId?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasRing?: boolean;
}

const sizeMap = {
  xs: 'w-5 h-5 text-xs',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
  '2xl': 'w-16 h-16 text-lg',
};

// Deterministic color hash from userId
const avatarColors = [
  '#1A1A1A',
  '#333333',
  '#555555',
  '#777777',
  '#999999',
  '#BBBBBB',
  '#5C5C5C',
  '#404040',
];

function getAvatarColor(id?: string) {
  if (!id) return avatarColors[0];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}

export function Avatar({
  src,
  alt = 'Avatar',
  initials = '?',
  userId,
  className,
  size = 'md',
  hasRing = false,
}: AvatarProps) {
  const bgColor = useMemo(() => getAvatarColor(userId), [userId]);

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          sizeMap[size],
          'rounded-full object-cover flex-shrink-0',
          hasRing && 'ring-1 ring-border',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeMap[size],
        'rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white',
        hasRing && 'ring-1 ring-border',
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: AvatarProps[];
  maxVisible?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function AvatarGroup({
  avatars,
  maxVisible = 3,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, maxVisible);
  const hidden = avatars.length - maxVisible;

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((avatar, idx) => (
        <div key={idx} style={{ marginLeft: idx > 0 ? '-8px' : 0 }}>
          <Avatar {...avatar} size={size} hasRing />
        </div>
      ))}
      {hidden > 0 && (
        <div
          className={cn(
            sizeMap[size],
            'rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold text-xs flex-shrink-0',
            'ring-1 ring-border',
            'ml-[-8px]'
          )}
        >
          +{hidden}
        </div>
      )}
    </div>
  );
}
