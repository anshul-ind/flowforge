'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import logo1 from '@/public/assets/logo1.png'

/** Resolved URL for `<img src>` (Next static import). */
export const flowforgeLogoSrc = logo1.src

type Variant = 'onDark' | 'onLight'

function logoImgClass(variant: Variant, className?: string) {
  return cn(
    'h-full w-auto max-w-none object-contain object-left',
    variant === 'onDark' && 'brightness-0 invert',
    className
  )
}

/**
 * Full wordmark for navbars. `onLight` = natural black logo on light bg; `onDark` = inverted for #171717 rails.
 */
export function FlowForgeNavbarLogo({
  href,
  className,
  variant = 'onLight',
}: {
  href: string
  className?: string
  variant?: Variant
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex min-w-0 shrink-0 items-center rounded-lg py-1 pr-1 transition-colors',
        variant === 'onDark' ? 'hover:bg-white/5' : 'hover:bg-gray-100',
        className
      )}
    >
      <img
        src={flowforgeLogoSrc}
        alt="FlowForge"
        width={220}
        height={56}
        className={cn(
          'h-7 w-auto max-w-[10rem] object-contain object-left sm:h-8 sm:max-w-[11rem]',
          variant === 'onDark' && 'brightness-0 invert'
        )}
      />
    </Link>
  )
}

/**
 * Compact mark: left portion of the wordmark artwork (icon) via overflow clip.
 */
export function FlowForgeMark({
  className,
  variant = 'onDark',
}: {
  className?: string
  variant?: Variant
}) {
  return (
    <span
      className={cn(
        'inline-flex h-9 max-h-9 w-9 shrink-0 items-center justify-start overflow-hidden',
        className
      )}
    >
      <img
        src={flowforgeLogoSrc}
        alt=""
        width={200}
        height={56}
        className={logoImgClass(variant, 'min-h-0')}
      />
    </span>
  )
}

type FlowForgeBrandLockupProps = {
  href?: string
  className?: string
  variant?: Variant
  tagline?: string
  wordmarkExpanded?: boolean
  onNavigate?: () => void
  presentation?: 'default' | 'imageLockup'
}

export function FlowForgeBrandLockup({
  href = '/',
  className,
  variant = 'onDark',
  tagline = 'Project management',
  wordmarkExpanded = true,
  onNavigate,
  presentation = 'default',
}: FlowForgeBrandLockupProps) {
  if (presentation === 'imageLockup') {
    const inner = wordmarkExpanded ? (
      <img
        src={flowforgeLogoSrc}
        alt="FlowForge"
        width={280}
        height={64}
        className={cn(
          'h-7 w-auto max-w-[min(12.5rem,100%)] object-contain object-left sm:h-8',
          variant === 'onDark' && 'brightness-0 invert'
        )}
      />
    ) : (
      <FlowForgeMark variant={variant} className="h-9 w-9" />
    )

    const wrapClass = cn(
      'flex min-w-0 items-center rounded-lg transition-colors',
      variant === 'onDark' ? 'hover:bg-white/5' : 'hover:bg-neutral-100',
      wordmarkExpanded ? 'px-2 py-0.5' : 'justify-center px-0 py-0.5',
      className
    )

    if (href) {
      return (
        <Link href={href} className={wrapClass} onClick={onNavigate}>
          {inner}
        </Link>
      )
    }
    return <div className={wrapClass}>{inner}</div>
  }

  const inner = (
    <>
      <FlowForgeMark variant={variant} className="h-10 w-10" />
      <div
        className={cn(
          'min-w-0 flex-1 overflow-hidden transition-all duration-200 ease-out',
          wordmarkExpanded
            ? 'max-w-[11rem] opacity-100'
            : 'max-w-0 opacity-0 md:pointer-events-none md:sr-only'
        )}
      >
        <span
          className={cn(
            'block truncate text-lg font-bold leading-tight tracking-tight',
            variant === 'onDark' ? 'text-white' : 'text-neutral-900'
          )}
        >
          FlowForge
        </span>
        {tagline ? (
          <span
            className={cn(
              'block truncate text-xs',
              variant === 'onDark' ? 'text-neutral-400' : 'text-neutral-500'
            )}
          >
            {tagline}
          </span>
        ) : null}
      </div>
    </>
  )

  const wrapClass = cn(
    'flex min-w-0 items-center gap-3 rounded-lg transition-colors',
    variant === 'onDark' ? 'hover:bg-white/5' : 'hover:bg-neutral-100',
    wordmarkExpanded ? 'px-2' : 'justify-center px-0',
    className
  )

  if (href) {
    return (
      <Link href={href} className={wrapClass} onClick={onNavigate}>
        {inner}
      </Link>
    )
  }

  return <div className={wrapClass}>{inner}</div>
}
