'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { Lock, Users, CheckCircle, Bell, BarChart3, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    title: 'Workspace Isolation',
    description: 'Keep projects completely separate with dedicated workspaces. Perfect for agencies, teams, and enterprises.',
    icon: Lock,
  },
  {
    title: 'Role-Based Access',
    description: 'Control exactly who can do what with Owner, Manager, Member, and Viewer roles. Fine-grained permissions included.',
    icon: Users,
  },
  {
    title: 'Approval Workflows',
    description: 'Required approvals for project creation, task completion, and status changes. Never miss critical decisions.',
    icon: CheckCircle,
  },
  {
    title: 'Real-Time Notifications',
    description: 'Stay informed with instant notifications for approvals, task updates, comments, and team activity.',
    icon: Bell,
  },
  {
    title: 'Analytics Dashboard',
    description: 'Track completion rates, team velocity, and project health with real-time analytics and custom reports.',
    icon: BarChart3,
  },
  {
    title: 'Global Search',
    description: 'Find any project, task, or comment instantly across the entire workspace with powerful full-text search.',
    icon: Search,
  },
]

export function FeaturesSection() {
  const prefersReduced = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: prefersReduced ? 0 : 0.4,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReduced ? 0 : 0.5 },
    },
  }

  return (
    <section className="py-20 md:py-32 bg-surface">
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
            Everything a delivery team needs
          </h2>
          <p className="text-secondary max-w-2xl mx-auto">
            Built specifically for teams that need to ship projects on schedule. From permissions to analytics, we've got you covered.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className={cn(
                  'p-8 rounded-xl',
                  'border bg-background',
                  'hover:shadow-lg hover:border-strong',
                  'transition-all duration-300',
                  'group cursor-pointer'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-12 h-12 rounded-lg mb-4',
                  'bg-brand/10 flex items-center justify-center',
                  'group-hover:bg-brand/20',
                  'transition-colors duration-300'
                )}>
                  <Icon className="w-6 h-6 text-brand" />
                </div>

                {/* Title */}
                <h3 className={cn(
                  'font-display font-semibold text-lg',
                  'text-primary mb-2'
                )}>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
