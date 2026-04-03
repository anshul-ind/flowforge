import { InputHTMLAttributes } from 'react';

/**
 * Input Component
 * 
 * Basic styled input field component
 */
export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 border-2 border-black rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black disabled:opacity-50 disabled:cursor-not-allowed ${
        className || ''
      }`}
      {...props}
    />
  );
}
