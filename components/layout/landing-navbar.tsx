'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlowForgeNavbarLogo } from '@/components/brand/flowforge-brand'

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'Features', href: '#features' },
    { label: 'Resources', href: '#resources' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center border-b border-gray-200 bg-white shadow-none">
      <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <FlowForgeNavbarLogo href="/" variant="onLight" />
        </div>

        <div className="hidden items-center gap-8 md:flex lg:gap-12">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-gray-900'
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-3 sm:flex lg:gap-4">
            <a
              href="/sign-in"
              className={cn(
                'px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-gray-900'
              )}
            >
              Log in
            </a>
            <Link
              href="/sign-up"
              className={cn(
                'rounded-lg bg-neutral-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-neutral-800'
              )}
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn('rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100 md:hidden')}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6 text-gray-800" /> : <Menu className="h-6 w-6 text-gray-800" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-16 border-b border-gray-200 bg-white md:hidden">
          <div className="container mx-auto space-y-4 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'block py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-gray-900'
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <a
                href="/sign-in"
                className={cn(
                  'block rounded-lg px-4 py-2 text-sm font-medium text-gray-800 transition-colors duration-200 hover:bg-gray-50'
                )}
                onClick={() => setIsOpen(false)}
              >
                Log in
              </a>
              <Link
                href="/sign-up"
                className={cn(
                  'block rounded-lg bg-neutral-900 px-4 py-2 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-neutral-800'
                )}
                onClick={() => setIsOpen(false)}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  )
}
