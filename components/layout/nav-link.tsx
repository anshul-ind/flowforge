'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type IconType = 'workspace' | 'projects' | 'members' | 'settings';

/**
 * Icon Component
 * Renders appropriate icon based on type
 */
function Icon({ type, className = 'w-5 h-5' }: { type: IconType; className?: string }) {
  const iconProps = { className, 'aria-hidden': true as const };

  switch (type) {
    case 'workspace':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m0 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375" />
        </svg>
      );
    case 'projects':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12a8.25 8.25 0 0 1 8.25-8.25H15a8.25 8.25 0 1 1 0 16.5h-.75A8.25 8.25 0 0 1 3.75 12Z" />
        </svg>
      );
    case 'members':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 7.121-3.46m-9.46-12.84a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0M15 19.128v-.003c0-.014-.002-.028-.004-.042a5.96 5.96 0 0 0-.016-.093 6.5 6.5 0 1 1 13 0c-.712 4.469-4.587 7.917-9.32 7.917a9.882 9.882 0 0 1-3.66-.684V19.128Z" />
        </svg>
      );
    case 'settings':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94m-.213 9.26c.033.566.585 1.003 1.155 1.003.57 0 1.122-.437 1.155-1.003M15.75 12.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Navigation Link Component
 * 
 * Renders an active/inactive nav link with icon
 * Uses usePathname to determine active state (client component required)
 * 
 * Hydration fix:
 * - Initially renders without activeState to match server render
 * - After client hydration, usePathname() is available and active state is computed
 * - Uses suppressHydrationWarning for aria-current since it may differ
 * 
 * Accessibility:
 * - Proper focus management via Link component
 * - Icons have aria-hidden to avoid duplication in screen readers
 * - Label clearly describes the link
 * - Active state visually and semantically clear
 */
export function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: IconType;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't compute active state until after hydration to prevent mismatch
  const isActive = mounted ? (pathname === href || pathname.startsWith(href + '/')) : false;

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
      suppressHydrationWarning
      {...(isActive && { 'aria-current': 'page' as const })}
    >
      <Icon type={icon} className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
}
