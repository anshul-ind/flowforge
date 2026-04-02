/**
 * App Shell Layout
 * 
 * Main container for all authenticated pages
 * Wraps content with sidebar, topbar, and consistent styling
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar will be added here via layout composition */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar will be added here via layout composition */}
        <main className="flex flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

/**
 * Flex Row Container
 * Useful for layout composition
 */
export function FlexRow({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-row ${className}`}>{children}</div>;
}

/**
 * Flex Column Container
 * Useful for layout composition
 */
export function FlexCol({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col ${className}`}>{children}</div>;
}

/**
 * Main Content Container
 * Wraps page content with consistent padding
 */
export function MainContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-auto bg-gray-50 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
