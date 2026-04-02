'use client';

import { CommandPalette } from './command-palette';

/**
 * Command Palette Wrapper
 * This is used to wrap the CommandPalette client component
 * in a client context for use in server components
 */
export function CommandPaletteProvider({ workspaceId }: { workspaceId: string }) {
  return <CommandPalette workspaceId={workspaceId} />;
}
