'use client';

import Link from 'next/link';
import { Heart, Mail, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlowForgeMark } from '@/components/brand/flowforge-brand';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Security', href: '#' },
        { label: 'Roadmap', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'API Docs', href: '#' },
        { label: 'Status', href: '#' },
        { label: 'Support', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Cookie Policy', href: '#' },
        { label: 'DPA', href: '#' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Code, href: '#', label: 'GitHub' },
    { icon: Mail, href: '#', label: 'Twitter' },
    { icon: Heart, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="border-t border-gray-200 bg-gray-50 text-gray-600">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <FlowForgeMark variant="onLight" className="h-8 w-8" />
              <span className="font-semibold text-gray-900">FlowForge</span>
            </div>
            <p className="text-sm text-gray-600">
              Ship projects your team actually finishes.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-900">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900'
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="my-8 border-t border-gray-200" />

        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          <p className="text-sm text-gray-500">
            © {currentYear} FlowForge. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className={cn(
                    'h-5 w-5 text-gray-500 transition-colors duration-200 hover:text-gray-900'
                  )}
                >
                  <Icon size={20} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
