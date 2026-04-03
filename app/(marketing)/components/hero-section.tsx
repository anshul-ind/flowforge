'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarGroup } from '@/components/ui/avatar'

export function HeroSection() {
  const prefersReduced = useReducedMotion()
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0,
        duration: prefersReduced ? 0 : 0.6,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReduced ? 0 : 0.5,
      },
    },
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-12 md:pt-40 md:pb-20 bg-white">
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Headline - Large, Bold, Serif */}
        <motion.h1
          variants={itemVariants}
          className={cn(
            'font-display font-bold mb-6',
            'text-5xl md:text-6xl lg:text-7xl',
            'text-primary leading-tight tracking-tight'
          )}
        >
          Deliver projects your <br className="hidden sm:inline" />
          team actually ships
        </motion.h1>

        {/* Subheadline - Clean, Professional */}
        <motion.p
          variants={itemVariants}
          className={cn(
            'text-center text-secondary mb-10 md:mb-12',
            'text-lg md:text-xl max-w-2xl mx-auto'
          )}
        >
          Keep teams aligned, focused, and shipping on time. Real-time collaboration, RBAC, approvals, and impact metrics—built for delivery excellence.
        </motion.p>

        {/* CTA Buttons Section - Cleaner, Professional */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16 md:mb-24"
        >
          {/* <Link
            href="/sign-up?intent=team"
            className={cn(
              'px-8 py-3 rounded-lg font-semibold text-grey',
              'bg-primary hover:bg-primary/90 transition-colors duration-200',
              'text-base inline-flex items-center justify-center gap-2'
            )}
          >
            ★ Get Started for Free
          </Link> */}
           <Link
            href="/sign-up"
            className={cn(
              'px-8 py-3 rounded-lg font-semibold text-white',
              'bg-black hover:bg-gray-900 transition-colors duration-200',
              'text-base inline-flex items-center justify-center gap-2'
            )}
          >
            Get Started <span className="ml-1"></span>
          </Link>
          <Link
            href="/sign-up?intent=personal"
            className={cn(
              'px-8 py-3 rounded-lg font-semibold',
              'bg-surface-raised border-2 border-primary text-primary',
              'hover:bg-surface transition-colors duration-200',
              'text-base inline-flex items-center justify-center gap-2'
            )}
          >
            Explore the Platform
          </Link>
         
        </motion.div>

        {/* Marquee Text Animation */}
        <motion.div
          variants={itemVariants}
          className="relative mt-16 md:mt-24 w-screen -mx-[50vw] left-[50%]"
        >
          {/* Marquee Line 1 - Left to Right */}
          <div className="mb-8 overflow-hidden w-screen">
            <div className="marquee-left-to-right whitespace-nowrap">
              <span className="inline-block text-4xl md:text-5xl lg:text-6xl font-bold text-black px-8">
                FlowForge Daily • To Manage Task • And Work • In Join Room Securely • & share project with manager • submit for approval •
              </span>
            </div>
          </div>

          {/* Marquee Line 2 - Right to Left */}
          <div className="overflow-hidden w-screen">
            <div className="marquee-right-to-left whitespace-nowrap">
              <span className="inline-block text-4xl md:text-5xl lg:text-6xl font-bold text-black px-8">
                FlowForge Daily • To Manage Task • And Work • In Join Room Securely • & share project with manager • submit for approval •
              </span>
            </div>
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center mt-16 md:mt-20"
        >
          <div className="flex items-center gap-3 mb-3">
            <AvatarGroup
              avatars={[
                { userId: 'user-1', initials: 'SC', size: 'sm' },
                { userId: 'user-2', initials: 'MJ', size: 'sm' },
                { userId: 'user-3', initials: 'EW', size: 'sm' },
                { userId: 'user-4', initials: 'AR', size: 'sm' },
              ]}
              size="sm"
            />
          </div>
          <p className="text-sm text-secondary text-center">
            Trusted by 500+ teams delivering on schedule
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
