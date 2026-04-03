import React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

/**
 * Canonical button component with unified style system
 * 
 * VARIANTS:
 * - primary: brand color, white text (default CTA)
 * - secondary: accent bg, accent-foreground text
 * - ghost: transparent, hover shows accent
 * - destructive: danger color, white text (destructive actions)
 * - outline: transparent with brand border
 * 
 * SIZES:
 * - sm: h-8, px-3, text-xs
 * - md: h-9, px-4, text-sm (default)
 * - lg: h-11, px-6, text-base
 * - icon: h-9, w-9 (square, no padding)
 */
export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand inline-flex items-center justify-center gap-2';

  const variantStyles = {
    primary:
      'bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:text-gray-600',
    secondary:
      'bg-white text-black border-2 border-black hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-500',
    ghost:
      'text-black hover:bg-white hover:text-black disabled:text-gray-400',
    destructive:
      'bg-danger text-white hover:bg-danger/90 disabled:bg-gray-400 disabled:text-gray-600',
    outline:
      'border-2 border-black text-black hover:bg-gray-100 disabled:border-gray-400 disabled:text-gray-400',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs rounded-md',
    md: 'h-9 px-4 text-sm rounded-md',
    lg: 'h-11 px-6 text-base rounded-md',
    icon: 'h-9 w-9 rounded-md p-0',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
