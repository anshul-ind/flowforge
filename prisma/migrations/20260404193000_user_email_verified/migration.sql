-- Phase 7–8: email verification timestamp (password + OAuth flows).

ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);

UPDATE "User"
SET "emailVerified" = "createdAt"
WHERE "passwordHash" IS NOT NULL;
