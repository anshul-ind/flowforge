'use client';

import Link from 'next/link';
import { Heart, Mail, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <footer className="bg-[#0F0F0F] text-[#BFBFBF] border-t border-[#2E2E2E]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand rounded-md flex items-center justify-center">
                <span className="text-background font-bold text-sm">FF</span>
              </div>
              <span className="font-semibold text-white">FlowForge</span>
            </div>
            <p className="text-sm text-[#8C8C8C]">
              Ship projects your team actually finishes.
            </p>
          </div>

          {/* Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-sm text-[#BFBFBF] hover:text-white',
                        'transition-colors duration-200'
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

        {/* Divider */}
        <div className="border-t border-[#2E2E2E] my-8" />

        {/* Bottom section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
          <p className="text-sm text-[#8C8C8C]">
            © {currentYear} FlowForge. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className={cn(
                    'w-5 h-5 text-[#BFBFBF] hover:text-white',
                    'transition-colors duration-200'
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
