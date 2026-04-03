'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CTABanner() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: prefersReduced ? 0 : 0.6 }}
          className={cn(
            'rounded-2xl border',
            'bg-gradient-to-br from-brand/10 to-accent/10',
            'p-12 md:p-16',
            'text-center'
          )}
        >
          {/* Eyebrow */}
          <p className="text-sm font-semibold text-brand mb-4 uppercase tracking-wide">
            Ready to ship on schedule?
          </p>

          {/* Heading */}
          <h2 className={cn(
            'font-display font-bold text-3xl md:text-4xl',
            'text-primary mb-4'
          )}>
            Start delivering projects your team finishes
          </h2>

          {/* Description */}
          <p className="text-secondary max-w-2xl mx-auto mb-8">
            Join 500+ teams using FlowForge to ship on schedule. No credit card required, free forever plan available.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className={cn(
                'px-8 py-3 rounded-lg font-medium',
                'bg-brand text-background',
                'hover:bg-brand-hover',
                'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
                'transition-all duration-200',
                'flex items-center gap-2'
              )}
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              className={cn(
                'px-8 py-3 rounded-lg font-medium',
                'border bg-surface',
                'text-primary hover:bg-surface-raised',
                'focus:outline-none focus:ring-2 focus:ring-brand',
                'transition-all duration-200'
              )}
            >
              Schedule a demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 pt-12 border-t flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">500+</p>
              <p className="text-sm text-secondary">Teams using FlowForge</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">95%</p>
              <p className="text-sm text-secondary">On-time delivery rate</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">2.5h</p>
              <p className="text-sm text-secondary">Avg. setup time</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
