'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function SubmitButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const isDisabled = pending || disabled;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default:
      'bg-brand text-background hover:bg-brand-hover disabled:opacity-70',
    outline:
      'border border-border text-primary hover:bg-accent disabled:opacity-70',
    ghost: 'text-primary hover:bg-accent disabled:opacity-70',
  };

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={cn(
        'rounded-md font-medium transition-all duration-200',
        'flex items-center justify-center gap-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
