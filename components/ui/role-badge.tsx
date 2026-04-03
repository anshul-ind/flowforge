'use client';

import { cn } from '@/lib/utils';

type WorkspaceRole = 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';

interface RoleBadgeProps {
  role: WorkspaceRole;
  size?: 'sm' | 'md';
  className?: string;
}

const roleMap: Record<
  WorkspaceRole,
  { bg: string; text: string; label: string }
> = {
  OWNER: {
    bg: 'bg-role-owner-bg',
    text: 'text-role-owner-text',
    label: 'Owner',
  },
  MANAGER: {
    bg: 'bg-role-manager-bg',
    text: 'text-role-manager-text',
    label: 'Manager',
  },
  MEMBER: {
    bg: 'bg-role-member-bg',
    text: 'text-role-member-text',
    label: 'Member',
  },
  VIEWER: {
    bg: 'bg-role-viewer-bg',
    text: 'text-role-viewer-text',
    label: 'Viewer',
  },
};

export function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
  const config = roleMap[role];

  return (
    <span
      className={cn(
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        'rounded-sm font-medium inline-flex items-center',
        className
      )}
    >
      {config.label}
    </span>
  );
}
