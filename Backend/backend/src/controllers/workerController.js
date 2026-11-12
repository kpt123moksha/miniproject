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

module.exports = { listWorkers, createWorker };
