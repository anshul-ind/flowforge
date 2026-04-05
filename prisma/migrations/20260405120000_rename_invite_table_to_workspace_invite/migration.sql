-- Align physical table name with Prisma model `WorkspaceInvite` (default @@map).
-- Databases that applied 20260404120000 have table "Invite"; Prisma expects "WorkspaceInvite" without @@map.
-- Databases that already use "WorkspaceInvite" are unchanged.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Invite'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'WorkspaceInvite'
  ) THEN
    ALTER TABLE "Invite" RENAME TO "WorkspaceInvite";
  END IF;
END $$;
