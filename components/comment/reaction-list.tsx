'use client';

import { useState, useTransition } from 'react';
import { toggleReactionAction } from '@/modules/comment/toggle-reaction-action';
import { EmojiPicker } from './emoji-picker';

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
  hasUserReacted: boolean;
}

interface ReactionListProps {
  commentId: string;
  reactions: Reaction[];
  currentUserId?: string;
  onReactionToggled?: () => void;
}

/**
 * Shows grouped reactions for a comment
 * Clicking a reaction toggles user's participation
 */
export function ReactionList({
  commentId,
  reactions,
  currentUserId,
  onReactionToggled,
}: ReactionListProps) {
  const [isPending, startTransition] = useTransition();
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleToggleReaction = (emoji: string) => {
    startTransition(async () => {
      try {
        const result = await toggleReactionAction({
          commentId,
          emoji,
        });

        if (result.success) {
          onReactionToggled?.();
        }
      } catch (error) {
        console.error('Failed to toggle reaction:', error);
      }
    });
  };

  if (reactions.length === 0 && !showEmojiPicker) {
    return (
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => setShowEmojiPicker(true)}
          disabled={isPending}
          className={`
            inline-flex items-center justify-center w-6 h-6 text-xs rounded-full
            border border-gray-300 hover:border-gray-400 hover:bg-gray-100
            transition-all duration-200
            ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title="Add reaction"
        >
          <span className="text-sm">+</span>
        </button>
      </div>
    );
  }

  // Sort by count (highest first)
  const sortedReactions = [...reactions].sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-wrap gap-1 mt-2 mb-2 relative">
      {sortedReactions.map((reaction) => (
        <div key={reaction.emoji} className="relative group">
          <button
            onClick={() => handleToggleReaction(reaction.emoji)}
            disabled={isPending}
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full
              transition-all duration-200 border
              ${
                reaction.hasUserReacted
                  ? 'bg-blue-100 border-blue-300 text-blue-900'
                  : 'bg-gray-100 border-gray-300 hover:border-gray-400 hover:bg-gray-200'
              }
              ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={`${reaction.count} reaction${reaction.count !== 1 ? 's' : ''}`}
          >
            <span className="text-sm">{reaction.emoji}</span>
            <span className="text-xs font-medium">{reaction.count}</span>
          </button>

          {/* Tooltip showing who reacted */}
          {hoveredEmoji === reaction.emoji && reaction.userIds.length > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10">
              {reaction.count === 1
                ? 'You reacted'
                : `${reaction.count} people reacted`}
            </div>
          )}

          {/* Hover trigger area for tooltip */}
          <div
            className="absolute inset-0 rounded-full"
            onMouseEnter={() => setHoveredEmoji(reaction.emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
          />
        </div>
      ))}

      {/* Add reaction button */}
      <button
        onClick={() => setShowEmojiPicker(true)}
        disabled={isPending}
        className={`
          inline-flex items-center justify-center w-6 h-6 text-xs rounded-full
          border border-gray-300 hover:border-gray-400 hover:bg-gray-100
          transition-all duration-200
          ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Add reaction"
      >
        <span className="text-sm">+</span>
      </button>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={(emoji) => {
            handleToggleReaction(emoji);
            setShowEmojiPicker(false);
          }}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
}
