'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { createCommentAction } from '@/modules/comment/create-action';
import { updateCommentAction } from '@/modules/comment/update-action';
import { addMentionsAction } from '@/modules/comment/add-mentions-action';
import { extractMentionedUsernames } from '@/modules/comment/mention-parser';
import { MentionAutocomplete } from './mention-autocomplete';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface WorkspaceMember {
  id: string;
  name: string | null;
  email: string;
}

interface CommentFormProps {
  workspaceId: string;
  taskId: string;
  commentId?: string;
  initialContent?: string;
  workspaceMembers?: WorkspaceMember[];
  onSuccess?: () => void;
  onOptimistic?: (content: string) => void;
  onError?: () => void;
  isEditing?: boolean;
}

export function CommentForm({
  workspaceId,
  taskId,
  commentId,
  initialContent = '',
  workspaceMembers = [],
  onSuccess,
  onOptimistic,
  onError,
  isEditing = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);
  const [mentionAutocomplete, setMentionAutocomplete] = useState({
    isOpen: false,
    searchTerm: '',
    position: { top: 0, left: 0 },
    selectedIndex: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter workspace members for mention autocomplete
  const filteredMembers = mentionAutocomplete.searchTerm
    ? workspaceMembers.filter(
        (m) =>
          m.name?.toLowerCase().includes(mentionAutocomplete.searchTerm.toLowerCase()) ||
          m.email.toLowerCase().includes(mentionAutocomplete.searchTerm.toLowerCase())
      )
    : [];

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Detect @mention typing
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const beforeCursor = newContent.substring(0, cursorPos);
    const lastAtSign = beforeCursor.lastIndexOf('@');

    if (lastAtSign !== -1) {
      const afterAt = beforeCursor.substring(lastAtSign + 1);
      // Check if we're in a mention context (word characters after @)
      if (/^[\w.-]*$/.test(afterAt)) {
        const searchTerm = afterAt;
        const coords = getCaretCoordinates(textarea, cursorPos);

        setMentionAutocomplete({
          isOpen: true,
          searchTerm,
          position: {
            top: coords.top,
            left: coords.left,
          },
          selectedIndex: 0,
        });
      } else {
        setMentionAutocomplete((prev) => ({ ...prev, isOpen: false }));
      }
    } else {
      setMentionAutocomplete((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleMentionSelect = (member: WorkspaceMember) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const beforeCursor = content.substring(0, cursorPos);
    const lastAtSign = beforeCursor.lastIndexOf('@');

    if (lastAtSign !== -1) {
      const afterAt = beforeCursor.substring(lastAtSign + 1);
      // Replace everything after @ with the selected member's name
      const before = content.substring(0, lastAtSign + 1);
      const after = content.substring(cursorPos);
      const newContent = `${before}${member.name || member.email.split('@')[0]} ${after}`;

      setContent(newContent);
      setMentionAutocomplete({ isOpen: false, searchTerm: '', position: { top: 0, left: 0 }, selectedIndex: 0 });

      // Move cursor after the mention
      setTimeout(() => {
        const newPos = lastAtSign + 1 + (member.name || member.email.split('@')[0]).length + 1;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Call optimistic update hook before the action
    onOptimistic?.(content);

    startTransition(async () => {
      try {
        let result;

        if (isEditing && commentId) {
          result = await updateCommentAction({
            commentId,
            content,
          });
        } else {
          result = await createCommentAction({
            workspaceId,
            taskId,
            content,
          });
        }

        if (!result.success) {
          setError(result.message || 'Failed to save comment');
          onError?.();
          return;
        }

        // Parse and add mentions if comment was created
        if (result.data?.id && !isEditing) {
          await addMentionsAction({
            commentId: result.data.id,
            commentText: content,
          });
        }

        setContent('');
        setMentionAutocomplete({ isOpen: false, searchTerm: '', position: { top: 0, left: 0 }, selectedIndex: 0 });
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        onError?.();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-gray-200 rounded-lg p-4">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-3 py-2 text-sm font-medium ${
            !showPreview
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-3 py-2 text-sm font-medium ${
            showPreview
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Preview
        </button>
      </div>

      {showPreview ? (
        <div className="min-h-24 p-3 border border-gray-200 rounded bg-gray-50 prose prose-sm max-w-none">
          {content.trim() ? (
            <ReactMarkdown
              rehypePlugins={[rehypeSanitize]}
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="text-gray-700 text-sm my-2" {...props} />,
                a: ({ node, ...props }) => (
                  <a className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code: (props: any) => {
                  const { inline, children } = props;
                  return (
                    <code
                      className={`${
                        inline
                          ? 'bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono'
                          : 'bg-gray-900 text-gray-100 p-3 rounded-lg block my-2 text-xs font-mono overflow-x-auto'
                      }`}
                    >
                      {children}
                    </code>
                  );
                },
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
              {content}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic text-sm">Nothing to preview...</p>
          )}
        </div>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={isEditing ? 'Edit your comment... (supports Markdown, @mentions)' : 'Add a comment... (supports Markdown, @mentions)'}
            maxLength={5000}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            rows={4}
          />
          {/* Mention Autocomplete */}
          <MentionAutocomplete
            isOpen={mentionAutocomplete.isOpen && filteredMembers.length > 0}
            position={mentionAutocomplete.position}
            searchTerm={mentionAutocomplete.searchTerm}
            users={filteredMembers}
            selectedIndex={mentionAutocomplete.selectedIndex}
            onSelect={handleMentionSelect}
            onClose={() => setMentionAutocomplete((prev) => ({ ...prev, isOpen: false }))}
          />
        </>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{content.length}/5000</span>
        <button
          type="submit"
          disabled={!content.trim() || isPending}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving...' : isEditing ? 'Update' : 'Comment'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </form>
  );
}

/**
 * Get caret coordinates for positioning autocomplete
 */
function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  pos: number
): { top: number; left: number } {
  const div = document.createElement('div');
  const span = document.createElement('span');

  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';

  // Copy textarea styles
  const style = window.getComputedStyle(textarea);
  ['direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'].forEach((k) => {
    div.style[k as any] = style[k as any];
  });

  div.textContent = textarea.value.substring(0, pos);
  span.textContent = textarea.value.substring(pos) || '.';

  div.appendChild(span);
  document.body.appendChild(div);

  const rect = span.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();

  document.body.removeChild(div);

  return {
    top: textareaRect.top + (span.offsetTop - textarea.scrollTop) + 30,
    left: textareaRect.left + rect.left - textareaRect.left,
  };
}
