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
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        className || ''
      }`}
      {...props}
    />
  );
}
