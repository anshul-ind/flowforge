'use client';

import { useState } from 'react';

const EMOJI_QUICK_ACCESS = ['👍', '❤️', '😂', '🔥', '😮', '😢', '👏', '🎉'];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Emoji picker for reactions
 * Shows common emojis and search capability
 */
export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />

      {/* Picker */}
      <div className="fixed bottom-16 left-4 right-4 max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 z-51">
        <div className="p-3 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search emoji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="p-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {(searchTerm ? [] : EMOJI_QUICK_ACCESS).map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 text-lg hover:bg-gray-100 rounded flex items-center justify-center cursor-pointer"
              title={emoji}
            >
              {emoji}
            </button>
          ))}

          {/* Custom emoji if search term is a single emoji-like character */}
          {searchTerm && searchTerm.length <= 2 && (
            <button
              onClick={() => handleEmojiClick(searchTerm)}
              className="w-8 h-8 text-lg hover:bg-gray-100 rounded flex items-center justify-center cursor-pointer col-span-8"
            >
              {searchTerm}
            </button>
          )}
        </div>

        <div className="p-2 border-t border-gray-200 text-xs text-gray-600 text-center bg-gray-50">
          Type an emoji or select from quick access
        </div>
      </div>
    </div>
  );
}
