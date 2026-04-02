/**
 * Skeleton Component
 * 
 * Animated placeholder for loading states
 * Use className to control size and shape
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 rounded-lg animate-pulse ${className}`}
      aria-busy="true"
      aria-hidden="true"
    />
  );
}
