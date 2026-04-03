'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'Features', href: '#features' },
    { label: 'Resources', href: '#resources' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 bg-black backdrop-blur-none border-b border-gray-800',
        'h-16 flex items-center shadow-none'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          {!isMobile && (
            <span className="font-bold text-white text-base sm:text-lg tracking-tight">
              FlowForge
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 lg:gap-12">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium text-white',
                'hover:text-gray-300 transition-colors duration-200'
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {/* Desktop Auth Links */}
          <div className="hidden sm:flex items-center gap-3 lg:gap-4">
            <a
              href="/sign-in"
              className={cn(
                'px-4 py-2 text-sm font-medium',
                'text-white hover:text-gray-300',
                'transition-colors duration-200'
              )}
            >
              Log in
            </a>
            <Link
              href="/sign-up"
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium',
                'bg-black text-white',
                'hover:bg-gray-800 transition-colors duration-200 shadow-sm'
              )}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'md:hidden p-2 rounded-lg',
              'hover:bg-white/20 transition-colors duration-200'
            )}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-16 left-0 right-0 bg-black border-b border-gray-800',
            'md:hidden'
          )}
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'block text-sm font-medium text-white hover:text-gray-300',
                  'transition-colors duration-200 py-2'
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="border-t border-gray-800 pt-4 space-y-2">
              <a
                href="/sign-in"
                className={cn(
                  'block px-4 py-2 rounded-lg text-sm font-medium',
                  'text-white hover:bg-gray-900',
                  'transition-colors duration-200'
                )}
                onClick={() => setIsOpen(false)}
              >
                Log in
              </a>
              <Link
                href="/sign-up"
                className={cn(
                  'block px-4 py-2 rounded-md text-sm font-medium',
                  'bg-black text-white hover:bg-gray-800',
                  'transition-colors duration-200 text-center'
                )}
                onClick={() => setIsOpen(false)}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
