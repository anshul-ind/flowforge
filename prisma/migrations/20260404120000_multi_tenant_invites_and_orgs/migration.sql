-- Phase 2: organizations, scoped memberships, secure invites (token hash), Invite lifecycle.
-- Requires pgcrypto for SHA-256 when migrating legacy WorkspaceInvite rows.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AlterEnum: workspace-level task-only collaborator role
ALTER TYPE "WorkspaceRole" ADD VALUE 'TASK_ASSIGNEE';

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ORG_ADMIN', 'ORG_MANAGER', 'MEMBER', 'TASK_ASSIGNEE');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('NONE', 'SUPER_ADMIN');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'INVITE_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE 'MEMBERSHIP_CREATED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "platformRole" "PlatformRole" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "projectId" TEXT,
    "taskId" TEXT,
    "orgRole" "OrgRole",
    "workspaceRole" "WorkspaceRole",
    "invitedByUserId" TEXT NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- AlterTable: workspace -> organization (backfilled below)
ALTER TABLE "Workspace" ADD COLUMN "organizationId" TEXT;

-- One organization per existing workspace (deterministic mapping for migration)
CREATE TEMP TABLE "_workspace_org_map" AS
SELECT
    w."id" AS "workspaceId",
    gen_random_uuid()::text AS "organizationId"
FROM "Workspace" w;

INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt", "createdById")
SELECT
    m."organizationId",
    w."name",
    'org-' || w."id",
    w."createdAt",
    w."updatedAt",
    w."createdById"
FROM "Workspace" w
JOIN "_workspace_org_map" m ON m."workspaceId" = w."id";

UPDATE "Workspace" w
SET "organizationId" = m."organizationId"
FROM "_workspace_org_map" m
WHERE m."workspaceId" = w."id";

ALTER TABLE "Workspace" ALTER COLUMN "organizationId" SET NOT NULL;

-- OrganizationMember from workspace memberships (1 org per workspace in this migration)
INSERT INTO "OrganizationMember" ("id", "role", "status", "joinedAt", "userId", "organizationId")
SELECT
    gen_random_uuid()::text,
    CASE wm."role"::text
        WHEN 'OWNER' THEN 'ORG_ADMIN'::"OrgRole"
        WHEN 'MANAGER' THEN 'ORG_MANAGER'::"OrgRole"
        WHEN 'VIEWER' THEN 'MEMBER'::"OrgRole"
        WHEN 'TASK_ASSIGNEE' THEN 'TASK_ASSIGNEE'::"OrgRole"
        ELSE 'MEMBER'::"OrgRole"
    END,
    wm."status",
    wm."joinedAt",
    wm."userId",
    w."organizationId"
FROM "WorkspaceMember" wm
JOIN "Workspace" w ON w."id" = wm."workspaceId";

INSERT INTO "TaskAssignee" ("id", "assignedAt", "taskId", "userId")
SELECT
    gen_random_uuid()::text,
    t."createdAt",
    t."id",
    t."assigneeId"
FROM "Task" t
WHERE t."assigneeId" IS NOT NULL;

-- Migrate invites: raw token -> SHA-256 hex; drop legacy table
INSERT INTO "Invite" (
    "id",
    "email",
    "tokenHash",
    "status",
    "expiresAt",
    "acceptedAt",
    "revokedAt",
    "createdAt",
    "metadata",
    "organizationId",
    "workspaceId",
    "projectId",
    "taskId",
    "orgRole",
    "workspaceRole",
    "invitedByUserId"
)
SELECT
    wi."id",
    COALESCE(wi."email", ''),
    encode(digest(wi."token", 'sha256'), 'hex'),
    CASE
        WHEN wi."acceptedAt" IS NOT NULL THEN 'ACCEPTED'::"InviteStatus"
        WHEN wi."expiresAt" < NOW() THEN 'EXPIRED'::"InviteStatus"
        ELSE 'PENDING'::"InviteStatus"
    END,
    wi."expiresAt",
    wi."acceptedAt",
    NULL,
    wi."createdAt",
    NULL,
    w."organizationId",
    wi."workspaceId",
    NULL,
    NULL,
    NULL,
    wi."role",
    wi."invitedById"
FROM "WorkspaceInvite" wi
JOIN "Workspace" w ON w."id" = wi."workspaceId";

DROP TABLE "WorkspaceInvite";

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

CREATE INDEX "Organization_createdById_idx" ON "Organization"("createdById");

CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

CREATE INDEX "OrganizationMember_organizationId_role_idx" ON "OrganizationMember"("organizationId", "role");

CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

CREATE UNIQUE INDEX "ProjectMember_userId_projectId_key" ON "ProjectMember"("userId", "projectId");

CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

CREATE INDEX "TaskAssignee_taskId_idx" ON "TaskAssignee"("taskId");

CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

CREATE INDEX "Invite_organizationId_idx" ON "Invite"("organizationId");

CREATE INDEX "Invite_workspaceId_idx" ON "Invite"("workspaceId");

CREATE INDEX "Invite_projectId_idx" ON "Invite"("projectId");

CREATE INDEX "Invite_taskId_idx" ON "Invite"("taskId");

CREATE INDEX "Invite_email_idx" ON "Invite"("email");

CREATE INDEX "Invite_status_idx" ON "Invite"("status");

CREATE INDEX "Invite_expiresAt_idx" ON "Invite"("expiresAt");

CREATE INDEX "Invite_invitedByUserId_idx" ON "Invite"("invitedByUserId");

CREATE INDEX "Workspace_organizationId_idx" ON "Workspace"("organizationId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invite" ADD CONSTRAINT "Invite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invite" ADD CONSTRAINT "Invite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invite" ADD CONSTRAINT "Invite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invite" ADD CONSTRAINT "Invite_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
