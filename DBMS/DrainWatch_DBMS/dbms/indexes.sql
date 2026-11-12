CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_risk_score ON complaints(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tasks_worker_id ON cleaning_tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_status ON cleaning_tasks(deadline, task_status);
CREATE INDEX IF NOT EXISTS idx_history_complaint_changed_at
    ON complaint_status_history(complaint_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_evidence_complaint_id ON cleaning_evidence(complaint_id);

-- Performance exercise: compare plan before/after indexes.
EXPLAIN ANALYZE
SELECT id, title, risk_score
FROM complaints
WHERE risk_score >= 60
ORDER BY risk_score DESC;
