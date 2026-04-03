'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Building2, UserPlus, ArrowRight, Check } from 'lucide-react';

/**
 * Onboarding Page - PHASE 5 SECTION E
 * 
 * Multi-step onboarding wizard (3 steps):
 * 1. User type selection (Explore / Team / Join)
 * 2. Intent-specific setup (workspace form, invite code, or skip)
 * 3. Confirmation and redirect to dashboard
 * 
 * Shown after successful sign-up, before accessing workspace.
 */
export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoadingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full h-96 rounded-2xl border border-border bg-surface-raised animate-pulse" />
    </div>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIntent, setSelectedIntent] = useState<'personal' | 'team' | 'join' | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load step from URL params on mount
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      setCurrentStep(parseInt(stepParam));
    }
  }, [searchParams]);

  const steps = [
    { number: 0, label: 'Intent', complete: selectedIntent !== null },
    { number: 1, label: 'Setup', complete: false },
    { number: 2, label: 'Done', complete: false },
  ];

  const handleIntentSelect = (intent: 'personal' | 'team' | 'join') => {
    setSelectedIntent(intent);
    setCurrentStep(1);
  };

  const handleSubmitSetup = async () => {
    setIsLoading(true);
    // Simulate setup
    await new Promise(r => setTimeout(r, 1000));
    setCurrentStep(2);
    setIsLoading(false);
  };

  const handleComplete = () => {
    router.push('/workspace');
  };

  const pathOptions = [
    {
      id: 'personal',
      icon: Eye,
      label: 'Try it yourself',
      description: 'Explore the product with a personal workspace.',
      highlighted: false,
    },
    {
      id: 'team',
      icon: Building2,
      label: 'For your team',
      description: 'Create an organization workspace and invite your team.',
      highlighted: true,
      badge: 'Most popular',
    },
    {
      id: 'join',
      icon: UserPlus,
      label: 'Got an invite?',
      description: 'Join your company\'s existing workspace.',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div
        className={`w-full max-w-md rounded-2xl border border-border bg-surface-raised p-8 shadow-lg ${
          currentStep === 1 ? 'overflow-auto max-h-[90vh]' : ''
        }`}
      >
        {/* Progress Dots */}
        <div className="flex justify-center gap-3 mb-8">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => step.number < currentStep && setCurrentStep(step.number)}
              className={`h-2 rounded-full transition-all ${
                step.number === currentStep
                  ? 'w-8 bg-brand'
                  : step.number < currentStep
                  ? 'w-2 bg-success'
                  : 'w-2 bg-border'
              }`}
              aria-label={`Step ${step.number + 1}: ${step.label}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Intent Selection */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-semibold text-primary mb-2">What brings you here?</h1>
                <p className="text-sm text-secondary">Choose how you'd like to use FlowForge</p>
              </div>

              <div className="space-y-3">
                {pathOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleIntentSelect(option.id as any)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                        option.highlighted
                          ? 'border-brand bg-accent hover:shadow-md'
                          : 'border-border bg-surface hover:border-border-strong hover:shadow-sm'
                      }`}
                      whileHover={{ translateY: -2 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={18} className={option.highlighted ? 'text-brand' : 'text-secondary'} />
                            <h3 className={`font-semibold text-sm ${
                              option.highlighted ? 'text-brand' : 'text-primary'
                            }`}>
                              {option.label}
                            </h3>
                          </div>
                          <p className="text-xs text-muted">{option.description}</p>
                        </div>
                        {option.badge && (
                          <div className="text-xs font-semibold px-2 py-1 bg-brand/10 text-brand rounded-full whitespace-nowrap">
                            {option.badge}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 1: Setup */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                {selectedIntent === 'team' && (
                  <>
                    <h2 className="text-xl font-semibold text-primary mb-2">Set up your workspace</h2>
                    <p className="text-sm text-secondary">Create your team's workspace</p>
                  </>
                )}
                {selectedIntent === 'join' && (
                  <>
                    <h2 className="text-xl font-semibold text-primary mb-2">Join a workspace</h2>
                    <p className="text-sm text-secondary">Enter your invite code or paste the link</p>
                  </>
                )}
                {selectedIntent === 'personal' && (
                  <>
                    <h2 className="text-xl font-semibold text-primary mb-2">All set!</h2>
                    <p className="text-sm text-secondary">You're ready to explore FlowForge</p>
                  </>
                )}
              </div>

              {selectedIntent === 'team' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Workspace name
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="Acme Inc."
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-xs text-muted">
                      You'll become the owner of this workspace and can invite team members after setup.
                    </p>
                  </div>
                </div>
              )}

              {selectedIntent === 'join' && (
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Paste invite link or code..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              )}

              {selectedIntent === 'personal' && (
                <div className="p-4 bg-accent rounded-lg text-center">
                  <p className="text-sm text-secondary">
                    Explore all features in your personal workspace. You can create or join team workspaces anytime.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setSelectedIntent(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-secondary border border-border rounded-lg hover:bg-surface transition-colors"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitSetup}
                  disabled={
                    isLoading ||
                    (selectedIntent === 'team' && !workspaceName) ||
                    (selectedIntent === 'join' && !inviteCode)
                  }
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-hover disabled:bg-muted disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Setting up...' : 'Continue'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Complete */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center"
              >
                <Check size={32} className="text-success" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-semibold text-primary mb-2">You're in!</h2>
                <p className="text-sm text-secondary">
                  {selectedIntent === 'team'
                    ? `Workspace "${workspaceName}" is ready. Start by inviting your team.`
                    : selectedIntent === 'join'
                    ? "You've successfully joined the workspace."
                    : 'Personal workspace created. Explore at your pace.'}
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-3 text-base font-medium text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
              >
                Go to dashboard <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
