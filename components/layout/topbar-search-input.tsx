'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TopbarSearchInputProps {
  workspaceId: string;
}

/**
 * Topbar Search Input
 * Simple search input that navigates to the search page
 */
export function TopbarSearchInput({ workspaceId }: TopbarSearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/workspace/${workspaceId}/search?q=${encodeURIComponent(query)}`);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-sm">
      <input
        type="text"
        placeholder="Search (Cmd+K)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
    </form>
  );
}
