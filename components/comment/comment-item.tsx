'use client';

import { Comment } from '@/lib/generated/prisma';
import { deleteCommentAction } from '@/modules/comment/delete-action';
import { getReactionsAction } from '@/modules/comment/get-reactions-action';
import { getMentionsAction } from '@/modules/comment/get-mentions-action';
import { useState, useTransition, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { CommentForm } from './comment-form';
import type { WorkspaceRole } from '@/lib/generated/prisma';
import { ReactionList, Reaction } from './reaction-list';

/**
 * Visual display of @mentions in a comment
 */
function MentionDisplay({
  mentions,
}: {
  mentions: Array<{ id: string; name: string | null; email: string }>;
}) {
  if (mentions.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {mentions.map((user) => (
        <span
          key={user.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200"
          title={user.email}
        >
          <span className="font-medium">@{user.name || user.email.split('@')[0]}</span>
        </span>
      ))}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment & {
    author: { id: string; name: string | null; email: string };
  };
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  workspaceId: string;
  onCommentUpdated?: () => void;
  onCommentDeleted?: () => void;
  isOptimistic?: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
  workspaceId,
  onCommentUpdated,
  onCommentDeleted,
  isOptimistic = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoadingReactions, setIsLoadingReactions] = useState(false);
  const [mentions, setMentions] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [isLoadingMentions, setIsLoadingMentions] = useState(false);

  const isAuthor = comment.authorId === currentUserId;
  const canEdit = isAuthor || currentUserRole === 'MANAGER' || currentUserRole === 'OWNER';
  const canDelete = isAuthor || currentUserRole === 'MANAGER' || currentUserRole === 'OWNER';
  const isDeleted = (comment as any).deletedAt !== null;

  // Load reactions and mentions
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingReactions(true);
      setIsLoadingMentions(true);
      try {
        const [reactionsResult, mentionsResult] = await Promise.all([
          getReactionsAction(workspaceId, comment.id),
          getMentionsAction(comment.id),
        ]);

        if (reactionsResult.success) {
          setReactions(reactionsResult.data || []);
        }

        if (mentionsResult.success) {
          setMentions(mentionsResult.data || []);
        }
      } catch (error) {
        console.error('Failed to load comment data:', error);
      } finally {
        setIsLoadingReactions(false);
        setIsLoadingMentions(false);
      }
    };

    loadData();
  }, [comment.id, workspaceId]);

  // Show deleted placeholder
  if (isDeleted) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 opacity-60 bg-gray-50">
        <p className="text-gray-500 italic text-sm">This comment was deleted</p>
      </div>
    );
  }

  // Show deleted placeholder - check if task is soft-deleted instead
  // Comments don't have soft delete in this version
  if (!comment) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;

    setError(null);
    setIsDeleting(async () => {
      try {
        const result = await deleteCommentAction({
          commentId: comment.id,
        });

        if (!result.success) {
          setError(result.message || 'Failed to delete comment');
          return;
        }

        onCommentDeleted?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  if (isEditing) {
    return (
      <div className="space-y-2 border border-gray-200 rounded-lg p-4">
        <CommentForm
          workspaceId={workspaceId}
          taskId={comment.taskId}
          commentId={comment.id}
          initialContent={comment.body}
          isEditing={true}
          onSuccess={() => {
            setIsEditing(false);
            setError(null);
            onCommentUpdated?.();
          }}
        />
        <button
          onClick={() => {
            setIsEditing(false);
            setError(null);
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 space-y-3 ${isOptimistic ? 'opacity-75 bg-gray-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm text-gray-900">{comment.author.name || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{comment.author.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOptimistic && <span className="text-xs text-gray-500 italic">Sending...</span>}
          <span className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}
          </span>
          {(comment as any).editedAt && (
            <span className="text-xs text-gray-500 italic">(edited)</span>
          )}
        </div>
      </div>

      <div className="prose prose-sm max-w-none overflow-hidden">
        <ReactMarkdown
          rehypePlugins={[rehypeSanitize]}
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom styling for markdown elements
            p: ({ node, ...props }) => <p className="text-gray-700 text-sm my-2" {...props} />,
            a: ({ node, ...props }) => (
              <a className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer" {...props} />
            ),
            code: ({ node, inline, children, ...props }: any) => (
              <code
                className={`${
                  inline
                    ? 'bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono'
                    : 'bg-gray-900 text-gray-100 p-3 rounded-lg block my-2 text-xs font-mono overflow-x-auto'
                }`}
                {...props}
              >
                {children}
              </code>
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-2" {...props} />
            ),
            ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-700 text-sm my-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-700 text-sm my-2" {...props} />,
            li: ({ node, ...props }) => <li className="text-gray-700 text-sm" {...props} />,
            h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-gray-900 my-2" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-gray-900 my-2" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-base font-bold text-gray-900 my-2" {...props} />,
          }}
        >
          {comment.body}
        </ReactMarkdown>
      </div>

      {/* Reactions */}
      {!isLoadingReactions && (
        <ReactionList
          commentId={comment.id}
          reactions={reactions}
          currentUserId={currentUserId}
          onReactionToggled={async () => {
            // Reload reactions after toggle
            const result = await getReactionsAction(workspaceId, comment.id);
            if (result.success) {
              setReactions(result.data || []);
            }
          }}
        />
      )}

      {/* Mentions */}
      {!isLoadingMentions && <MentionDisplay mentions={mentions} />}

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-4 text-sm">
        {canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            disabled={isOptimistic}
            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting || isOptimistic}
            className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
