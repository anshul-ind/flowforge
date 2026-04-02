import Link from 'next/link';

/**
 * Empty State Component
 * 
 * Displays when there's no data to show
 * Includes optional action button
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {/* Icon placeholder */}
      <div className="mb-4 text-5xl">📭</div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm">{description}</p>

      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
