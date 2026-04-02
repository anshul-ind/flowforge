'use client';

import { useState, useEffect, useRef } from 'react';

interface MentionUser {
  id: string;
  name: string | null;
  email: string;
}

interface MentionAutocompleteProps {
  isOpen: boolean;
  position: { top: number; left: number };
  searchTerm: string;
  users: MentionUser[];
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
  onClose: () => void;
}

/**
 * Autocomplete dropdown for @mentions
 * Shows when user types @ in comment form
 */
export function MentionAutocomplete({
  isOpen,
  position,
  searchTerm,
  users,
  selectedIndex,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  if (!isOpen || users.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '200px',
      }}
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={`
            w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors
            flex items-center gap-2
            ${index === selectedIndex ? 'bg-blue-100' : ''}
          `}
        >
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {(user.name || user.email)[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {user.name || 'No Name'}
            </div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
