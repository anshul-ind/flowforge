'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'

export function QuoteSection() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="py-20 md:py-32 bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: prefersReduced ? 0 : 0.6 }}
          className="text-center"
        >
          {/* Star rating */}
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-xl">⭐</span>
            ))}
          </div>

          {/* Quote */}
          <blockquote className={cn(
            'font-display font-bold text-2xl md:text-3xl lg:text-4xl',
            'text-primary mb-8',
            'italic leading-relaxed'
          )}>
            "FlowForge transformed how our teams deliver projects. We went from chaos to 95% on-time delivery in just 3 months."
          </blockquote>

          {/* Attribution */}
          <div className="flex flex-col items-center gap-3">
            <Avatar userId="sarah-chen" initials="SC" size="md" />
            <div>
              <p className="font-semibold text-primary">Sarah Chen</p>
              <p className="text-sm text-secondary">VP of Project Management, TechFlow Inc.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
