-- Prevent concurrent double-submit from creating two PENDING approval rows for the same task.
CREATE UNIQUE INDEX IF NOT EXISTS "ApprovalRequest_one_pending_per_task_idx"
ON "ApprovalRequest" ("taskId")
WHERE status = 'PENDING';
