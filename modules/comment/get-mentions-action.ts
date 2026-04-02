'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function getMentionsAction(commentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, data: null, message: 'Unauthorized' };
    }

    // Get mentions for the specified comment
    const mentions = await prisma.mention.findMany({
      where: { commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Filter out null users (shouldn't happen due to cascade delete, but defensive programming)
    const safeMentions = mentions
      .filter((mention) => mention.user !== null)
      .map((mention) => ({
        id: mention.user!.id,
        name: mention.user!.name,
        email: mention.user!.email,
      }));

    return {
      success: true,
      data: safeMentions,
    };
  } catch (error) {
    console.error('Error getting mentions:', error);
    return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to get mentions' };
  }
}
