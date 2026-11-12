-- Example 1: Assign a worker and update complaint status atomically.
-- Replace IDs with valid values in your database.
BEGIN;
INSERT INTO cleaning_tasks (complaint_id, worker_id, assigned_by, deadline, task_status)
VALUES (1, 3, 2, NOW() + INTERVAL '2 days', 'Assigned')
ON CONFLICT (complaint_id) DO UPDATE
SET worker_id = EXCLUDED.worker_id,
    assigned_by = EXCLUDED.assigned_by,
    deadline = EXCLUDED.deadline,
    task_status = 'Assigned',
    updated_at = NOW();

UPDATE complaints SET status = 'Assigned', updated_at = NOW() WHERE id = 1;
INSERT INTO complaint_status_history
(complaint_id, changed_by, old_status, new_status, remarks)
VALUES (1, 2, 'Submitted', 'Assigned', 'Worker assigned in transaction');
COMMIT;

-- Example 2: Demonstrate ROLLBACK safely (no permanent change).
BEGIN;
UPDATE complaints SET status = 'Rejected' WHERE id = 1;
ROLLBACK;

-- Example 3: A transaction with a savepoint.
BEGIN;
UPDATE complaints SET risk_score = LEAST(100, risk_score + 5) WHERE id = 1;
SAVEPOINT before_note;
UPDATE complaints SET verification_remarks = 'Temporary demonstration note' WHERE id = 1;
ROLLBACK TO SAVEPOINT before_note;
COMMIT;
