/**
 * Parse @mentions from comment text
 * Extracts @username patterns and returns the raw text with mentions
 * 
 * Usage:
 * const { usernames, mentionedUserIds } = await parseMentions(
 *   "Hey @john @jane thanks!",
 *   workspace.members
 * );
 */

interface WorkspaceMember {
  id: string;
  name: string | null;
  email: string;
}

/**
 * Extract mention usernames from text
 * Returns both the parsed usernames and their corresponding user IDs
 */
export function parseMentions(
  text: string,
  workspaceMembers: WorkspaceMember[]
): {
  usernames: string[];
  mentionedUserIds: string[];
  highlightedText: string;
} {
  // Match @username pattern (word characters, hyphens, dots)
  const mentionPattern = /@([\w.-]+)/g;
  const usernames: string[] = [];
  const mentionedUserIds: string[] = [];
  const uniqueIds = new Set<string>();

  let match;
  const highlightedText = text.replace(mentionPattern, (fullMatch, username) => {
    // Find user by name or email prefix
    const member = workspaceMembers.find(
      (m) =>
        m.name?.toLowerCase() === username.toLowerCase() ||
        m.email.split('@')[0].toLowerCase() === username.toLowerCase()
    );

    if (member) {
      usernames.push(username);
      uniqueIds.add(member.id);
      // Return the mention as a highlighted version (we'll style this in the display)
      return `<span class="mention" data-user-id="${member.id}">@${username}</span>`;
    }

    return fullMatch;
  });

  return {
    usernames,
    mentionedUserIds: Array.from(uniqueIds),
    highlightedText,
  };
}

/**
 * Extract just the username list from text
 */
export function extractMentionedUsernames(text: string): string[] {
  const mentionPattern = /@([\w.-]+)/g;
  const usernames: string[] = [];

  let match;
  while ((match = mentionPattern.exec(text)) !== null) {
    usernames.push(match[1]);
  }

  return [...new Set(usernames)]; // Remove duplicates
}

/**
 * Replace mention usernames with highlighted HTML
 * Used for display in comment view
 */
export function highlightMentions(
  text: string,
  mentionedUsers: WorkspaceMember[]
): string {
  const mentionPattern = /@([\w.-]+)/g;

  return text.replace(mentionPattern, (fullMatch, username) => {
    const user = mentionedUsers.find(
      (u) =>
        u.name?.toLowerCase() === username.toLowerCase() ||
        u.email.split('@')[0].toLowerCase() === username.toLowerCase()
    );

    if (user) {
      return `<span class="mention mention-user" data-user-id="${user.id}" title="${user.name || user.email}">@${username}</span>`;
    }

    return fullMatch;
  });
}
