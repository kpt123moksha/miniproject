CREATE OR REPLACE VIEW complaint_overview AS
SELECT c.id AS complaint_id, c.title, c.severity, c.risk_score, c.risk_level,
       c.status, c.location_text, c.created_at,
       citizen.name AS citizen_name,
       worker.name AS worker_name,
       t.deadline, t.task_status
FROM complaints c
JOIN users citizen ON citizen.id = c.citizen_id
LEFT JOIN cleaning_tasks t ON t.complaint_id = c.id
LEFT JOIN users worker ON worker.id = t.worker_id;

CREATE OR REPLACE VIEW authority_dashboard_summary AS
SELECT COUNT(*) AS total_complaints,
       COUNT(*) FILTER (WHERE status IN ('Submitted','Assigned','Cleaning in Progress')) AS pending_complaints,
       COUNT(*) FILTER (WHERE status = 'Cleaning Completed') AS completed_complaints,
       COUNT(*) FILTER (WHERE risk_level IN ('High','Critical')) AS high_risk_complaints
FROM complaints;

CREATE OR REPLACE VIEW overdue_cleaning_tasks AS
SELECT t.id AS task_id, c.id AS complaint_id, c.title,
       w.name AS worker_name, t.deadline, t.task_status
FROM cleaning_tasks t
JOIN complaints c ON c.id = t.complaint_id
JOIN users w ON w.id = t.worker_id
WHERE t.deadline < NOW() AND t.task_status <> 'Cleaning Completed';
