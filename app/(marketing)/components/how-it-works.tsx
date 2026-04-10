'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { AirVent, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  {
    number: '01',
    title: 'Create Your Workspace',
    description: 'Set up workspaces for different clients, departments, or projects. Invite team members and assign roles.',
    icon: AirVent,
  },
  {
    number: '02',
    title: 'Organize Your Work',
    description: 'Create projects, break them into tasks, add approvals, and keep everyone aligned with comments and updates.',
    icon: Users,
  },
  {
    number: '03',
    title: 'Ship On Schedule',
    description: 'Track progress in real-time, run approvals, get notifications, and meet deadlines with built-in analytics.',
    icon: Zap,
  },
]

export function HowItWorksSection() {
  const prefersReduced = useReducedMotion()

  return (
    <section id="resources" className="scroll-mt-20 py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: prefersReduced ? 0 : 0.5 }}
        >
          <h2 className={cn(
            'font-display font-bold text-3xl md:text-4xl',
            'text-primary mb-4'
          )}>
            How it works
          </h2>
          <p className="text-secondary max-w-2xl mx-auto">
            Get up and running in minutes, deliver on schedule every time.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
          {/* Timeline line (hidden on mobile) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-brand/5 via-brand/20 to-brand/5" />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{
                  duration: prefersReduced ? 0 : 0.5,
                  delay: prefersReduced ? 0 : index * 0.1,
                }}
                className="relative"
              >
                {/* Number badge */}
                <div className="flex justify-center mb-6 relative z-10">
                  <div className={cn(
                    'w-16 h-16 rounded-full',
                    'flex items-center justify-center',
                    'bg-gradient-to-br from-brand/20 to-accent/10',
                    'border-2 border-brand',
                    'text-brand font-display font-bold text-xl'
                  )}>
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="bg-surface rounded-xl border p-6 text-center">
                  <div className={cn(
                    'w-12 h-12 rounded-lg mx-auto mb-4',
                    'bg-brand/10 flex items-center justify-center'
                  )}>
                    <Icon className="w-6 h-6 text-brand" />
                  </div>

                  <h3 className={cn(
                    'font-display font-semibold text-lg',
                    'text-primary mb-2'
                  )}>
                    {step.title}
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
