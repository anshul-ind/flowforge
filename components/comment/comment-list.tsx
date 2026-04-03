'use client';

import { Comment } from '@/lib/generated/prisma';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';
import { CommentRepository } from '@/modules/comment/repository';
import { TenantContext } from '@/lib/tenant/tenant-context';

interface CommentsListProps {
  taskId: string;
  currentUserId: string;
  currentUserRole: 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  tenant: TenantContext;
}

export function CommentsList({
  taskId,
  currentUserId,
  currentUserRole,
  tenant,
}: CommentsListProps) {
  const [comments, setComments] = useState<
    (Comment & { author: { id: string; name: string | null; email: string } })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingOptimisticIdRef = useRef<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      setError(null);
      const repo = new CommentRepository(tenant);
      const loaded = await repo.getTaskComments(taskId);
      setComments(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [taskId, tenant]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleOptimisticComment = useCallback(
    (content: string) => {
      // Create optimistic comment
      const tempId = `optimistic-${Date.now()}`;
      pendingOptimisticIdRef.current = tempId;

      const optimisticComment: Comment & {
        author: { id: string; name: string | null; email: string };
      } = {
        id: tempId,
        taskId,
        authorId: currentUserId,
        workspaceId: tenant.workspaceId,
        projectId: null,
        body: content,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: currentUserId,
          name: 'You',
          email: 'loading...',
        },
      };

      // Add optimistic comment to list
      setComments((prev) => [...prev, optimisticComment]);
    },
    [taskId, currentUserId, tenant.workspaceId]
  );

  const handleCommentSuccess = useCallback(() => {
    // Clear optimistic ID and reload comments from server
    pendingOptimisticIdRef.current = null;
    loadComments();
  }, [loadComments]);

  const handleCommentError = useCallback(() => {
    // Remove optimistic comment on error
    if (pendingOptimisticIdRef.current) {
      setComments((prev) =>
        prev.filter((c) => c.id !== pendingOptimisticIdRef.current)
      );
      pendingOptimisticIdRef.current = null;
    }
  }, []);

  if (isLoading) {
    return <div className="text-gray-500">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Comments ({comments.length})</h3>

      {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded">{error}</div>}

      <CommentForm
        taskId={taskId}
        onSuccess={handleCommentSuccess}
        onOptimistic={handleOptimisticComment}
        onError={handleCommentError}
      />

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              workspaceId={tenant.workspaceId}
              onCommentUpdated={handleCommentSuccess}
              onCommentDeleted={handleCommentSuccess}
              isOptimistic={comment.id.startsWith('optimistic-')}
            />
          ))
        )}
      </div>
    </div>
  );
}
