const pool = require("../config/db");

async function listWorkers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone,
       COUNT(t.id)::int AS assigned_tasks
       FROM users u LEFT JOIN cleaning_tasks t ON t.worker_id = u.id
       WHERE u.role = 'worker'
       GROUP BY u.id ORDER BY u.name`
    );
    res.json({ workers: result.rows });
  } catch (error) { next(error); }
}

async function listMyTasks(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT c.*, t.id AS task_id, t.worker_id, t.deadline, t.task_status,
       u.name AS citizen_name, c.authority_confirmed_at IS NOT NULL AS authority_confirmed,
       c.citizen_confirmed_at IS NOT NULL AS citizen_confirmed,
       (SELECT e.photo_url FROM cleaning_evidence e
        WHERE e.complaint_id = c.id AND e.evidence_type = 'Before'
        ORDER BY e.created_at DESC LIMIT 1) AS before_photo,
       (SELECT e.photo_url FROM cleaning_evidence e
        WHERE e.complaint_id = c.id AND e.evidence_type = 'After'
        ORDER BY e.created_at DESC LIMIT 1) AS after_photo,
       (SELECT e.remarks FROM cleaning_evidence e
        WHERE e.complaint_id = c.id AND e.evidence_type = 'After'
        ORDER BY e.created_at DESC LIMIT 1) AS completion_description
       FROM cleaning_tasks t
       JOIN complaints c ON c.id = t.complaint_id
       JOIN users u ON u.id = c.citizen_id
       WHERE t.worker_id = $1
       ORDER BY CASE WHEN c.status = 'Verified' THEN 1 ELSE 0 END, t.deadline ASC`,
      [req.user.id]
    );
    res.json({ tasks: result.rows });
  } catch (error) { next(error); }
}

async function createWorker(req, res, next) {
  try {
    const bcrypt = require("bcryptjs");
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password || String(password).length < 6) {
      return res.status(400).json({ message: "Name, email and a password of at least 6 characters are required." });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name,email,phone,password_hash,role)
       VALUES ($1,LOWER($2),$3,$4,'worker')
       RETURNING id,name,email,phone,role`,
      [name.trim(), email.trim(), phone || null, hash]
    );
    res.status(201).json({ worker: result.rows[0] });
  } catch (error) { next(error); }
}

module.exports = { listWorkers, listMyTasks, createWorker };
