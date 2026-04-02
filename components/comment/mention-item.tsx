'use client';

/**
 * Visual display of @mentions in a comment
 * Shows who was mentioned
 */
interface MentionUser {
  id: string;
  name: string | null;
  email: string;
}

interface MentionItemProps {
  mentions: MentionUser[];
}

export function MentionItem({ mentions }: MentionItemProps) {
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
