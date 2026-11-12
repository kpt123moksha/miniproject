-- 1. Show all complaints with citizen names.
SELECT c.id, c.title, u.name AS citizen, c.severity, c.status, c.created_at
FROM complaints c JOIN users u ON u.id = c.citizen_id
ORDER BY c.created_at DESC;

-- 2. Show complaints with assigned worker (LEFT JOIN includes unassigned complaints).
SELECT c.id, c.title, w.name AS worker, t.deadline, t.task_status
FROM complaints c
LEFT JOIN cleaning_tasks t ON t.complaint_id = c.id
LEFT JOIN users w ON w.id = t.worker_id
ORDER BY c.id;

-- 3. Count complaints by status.
SELECT status, COUNT(*) AS complaint_count
FROM complaints GROUP BY status ORDER BY complaint_count DESC;

-- 4. Count complaints by risk level.
SELECT risk_level, COUNT(*) AS total
FROM complaints GROUP BY risk_level;

-- 5. Find high and critical risk complaints.
SELECT id, title, risk_score, risk_level
FROM complaints WHERE risk_level IN ('High', 'Critical')
ORDER BY risk_score DESC;

-- 6. Find complaints not yet assigned to a worker (subquery).
SELECT id, title FROM complaints
WHERE id NOT IN (SELECT complaint_id FROM cleaning_tasks);

-- 7. Find workers with more than zero assigned tasks (GROUP BY/HAVING).
SELECT u.id, u.name, COUNT(t.id) AS task_count
FROM users u JOIN cleaning_tasks t ON t.worker_id = u.id
WHERE u.role = 'worker'
GROUP BY u.id, u.name HAVING COUNT(t.id) > 0;

-- 8. Average, minimum and maximum risk score.
SELECT AVG(risk_score) AS average_risk,
       MIN(risk_score) AS minimum_risk,
       MAX(risk_score) AS maximum_risk
FROM complaints;

-- 9. Complaints reported in the last 7 days.
SELECT * FROM complaints
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 10. Overdue tasks.
SELECT t.id, c.title, w.name AS worker, t.deadline
FROM cleaning_tasks t
JOIN complaints c ON c.id = t.complaint_id
JOIN users w ON w.id = t.worker_id
WHERE t.deadline < NOW() AND t.task_status <> 'Cleaning Completed';

-- 11. Citizens who have submitted at least two complaints (correlated count).
SELECT u.id, u.name
FROM users u
WHERE u.role = 'citizen'
AND (SELECT COUNT(*) FROM complaints c WHERE c.citizen_id = u.id) >= 2;

-- 12. Evidence uploaded for each complaint.
SELECT c.id, c.title, e.evidence_type, e.photo_url, e.created_at
FROM complaints c LEFT JOIN cleaning_evidence e ON e.complaint_id = c.id
ORDER BY c.id, e.created_at;

-- 13. Status history for a selected complaint (replace 1 with complaint ID).
SELECT h.old_status, h.new_status, h.remarks, h.changed_at, u.name AS changed_by
FROM complaint_status_history h
LEFT JOIN users u ON u.id = h.changed_by
WHERE h.complaint_id = 1 ORDER BY h.changed_at;

-- 14. Rank complaints by risk score using a window function.
SELECT id, title, risk_score,
       RANK() OVER (ORDER BY risk_score DESC) AS risk_rank
FROM complaints;

-- 15. Rainfall observations by date.
SELECT DATE(recorded_at) AS observation_date,
       COUNT(*) AS readings,
       AVG(rainfall_mm) AS average_rainfall,
       MAX(rainfall_mm) AS maximum_rainfall
FROM rainfall_observations
GROUP BY DATE(recorded_at)
ORDER BY observation_date DESC;

-- 16. Count tasks per worker, including workers with no tasks.
SELECT u.id, u.name, COUNT(t.id) AS total_tasks
FROM users u LEFT JOIN cleaning_tasks t ON t.worker_id = u.id
WHERE u.role = 'worker'
GROUP BY u.id, u.name ORDER BY total_tasks DESC;

-- 17. Find complaints whose risk score is above the overall average.
SELECT id, title, risk_score
FROM complaints
WHERE risk_score > (SELECT AVG(risk_score) FROM complaints)
ORDER BY risk_score DESC;
