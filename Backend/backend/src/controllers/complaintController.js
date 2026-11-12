const pool = require("../config/db");
const { SERVICE_CITIES, identifyCity } = require("../services/serviceAreaService");
const { calculateRisk } = require("../services/riskService");
const { getWeather, getElevation } = require("../services/weatherService");

async function createComplaint(req, res, next) {
  const client = await pool.connect();
  try {
    const { title, description, severity, latitude, longitude, location_text, city } = req.body;
    const titleValue = typeof title === "string" ? title.trim() : "";
    const descriptionValue = typeof description === "string" ? description.trim() : "";
    const locationTextValue = typeof location_text === "string" ? location_text.trim() : "";
    const severityValues = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
    const normalizedSeverity = typeof severity === "string"
      ? severityValues[severity.trim().toLowerCase()]
      : null;
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!titleValue) return res.status(400).json({ message: "Complaint title is required." });
    if (titleValue.length > 150) return res.status(400).json({ message: "Complaint title must be 150 characters or fewer." });
    if (!descriptionValue) return res.status(400).json({ message: "Problem description is required." });
    if (!normalizedSeverity) return res.status(400).json({ message: "Severity must be Low, Medium, High or Critical." });
    if (latitude === undefined || String(latitude).trim() === "" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ message: "Latitude must be a number between -90 and 90." });
    }
    if (longitude === undefined || String(longitude).trim() === "" || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({ message: "Longitude must be a number between -180 and 180." });
    }
    if (locationTextValue.length > 250) return res.status(400).json({ message: "Location or landmark must be 250 characters or fewer." });
    let detectedCity;
    try {
      detectedCity = identifyCity(lat, lon);
    } catch (error) {
      return res.status(503).json({ message: error.message });
    }
    if (!detectedCity) {
      return res.status(400).json({ message: "This location is outside the configured service areas." });
    }
    const requestedCity = typeof city === "string"
      ? SERVICE_CITIES.find((value) => value.toLowerCase() === city.trim().toLowerCase())
      : null;
    if (city && !requestedCity) {
      return res.status(400).json({ message: "City must be Mangaluru, Bantwal or Udupi." });
    }
    if (requestedCity && requestedCity !== detectedCity) {
      return res.status(400).json({ message: `The selected coordinates are inside ${detectedCity}, not ${requestedCity}.` });
    }

    let rainfallMm = 0;
    let elevationM = null;
    try {
      const weather = await getWeather(lat, lon);
      rainfallMm = Number(weather.rain ?? weather.precipitation ?? 0);
    } catch (e) {
      console.warn("Weather unavailable; risk score will use available inputs.");
    }
    try {
      elevationM = await getElevation(lat, lon);
    } catch (e) {
      console.warn("Elevation unavailable; risk score will omit elevation points.");
    }

    const previous = await pool.query(
      `SELECT COUNT(*)::int AS count FROM complaints
       WHERE latitude BETWEEN $1 - 0.002 AND $1 + 0.002
       AND longitude BETWEEN $2 - 0.002 AND $2 + 0.002
       AND created_at >= NOW() - INTERVAL '90 days'`,
      [lat, lon]
    );
    const risk = calculateRisk({
      severity: normalizedSeverity, rainfallMm, elevationM,
      previousComplaints: previous.rows[0].count
    });

    await client.query("BEGIN");
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const inserted = await client.query(
      `INSERT INTO complaints
        (citizen_id, city, title, description, severity, latitude, longitude, location_text,
        photo_url, rainfall_mm, elevation_m, risk_score, risk_level, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Submitted')
       RETURNING *`,
            [req.user.id, detectedCity, titleValue, descriptionValue, normalizedSeverity, lat, lon,
       locationTextValue || null, photoUrl, rainfallMm, elevationM, risk.score, risk.level]
    );

    await client.query(
      `INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks)
       VALUES ($1,$2,NULL,'Submitted','Complaint submitted')`,
      [inserted.rows[0].id, req.user.id]
    );
    await client.query("COMMIT");
    res.status(201).json({ complaint: inserted.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

async function listComplaints(req, res, next) {
  try {
    const isAuthority = ["authority", "admin"].includes(req.user.role);
    const values = [];
    const filters = [];
    if (!isAuthority) {
      values.push(req.user.id);
      filters.push(`c.citizen_id = $${values.length}`);
    }
    if (req.query.city) {
      const requestedCity = SERVICE_CITIES.find((value) =>
        value.toLowerCase() === String(req.query.city).trim().toLowerCase()
      );
      if (!requestedCity) return res.status(400).json({ message: "City must be Mangaluru, Bantwal or Udupi." });
      values.push(requestedCity);
      filters.push(`c.city = $${values.length}`);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT c.*, u.name AS citizen_name,
        w.name AS worker_name
       FROM complaints c
       JOIN users u ON u.id = c.citizen_id
       LEFT JOIN cleaning_tasks t ON t.complaint_id = c.id
       LEFT JOIN users w ON w.id = t.worker_id
       ${where}
       ORDER BY c.created_at DESC`,
      values
    );
    res.json({ complaints: result.rows });
  } catch (error) { next(error); }
}

async function getComplaint(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS citizen_name, u.email AS citizen_email,
       w.name AS worker_name
       FROM complaints c
       JOIN users u ON u.id = c.citizen_id
       LEFT JOIN cleaning_tasks t ON t.complaint_id = c.id
       LEFT JOIN users w ON w.id = t.worker_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    const complaint = result.rows[0];
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });
    if (req.user.role === "citizen" && complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ message: "You cannot view this complaint." });
    }
    const history = await pool.query(
      `SELECT h.*, u.name AS changed_by_name
       FROM complaint_status_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.complaint_id = $1 ORDER BY h.changed_at`,
      [req.params.id]
    );
    const evidence = await pool.query(
      `SELECT e.*, u.name AS uploaded_by_name FROM cleaning_evidence e
       LEFT JOIN users u ON u.id = e.uploaded_by
       WHERE e.complaint_id = $1 ORDER BY e.created_at`,
      [req.params.id]
    );
    res.json({ complaint, history: history.rows, evidence: evidence.rows });
  } catch (error) { next(error); }
}

async function updateStatus(req, res, next) {
  const client = await pool.connect();
  try {
    const { status, remarks } = req.body;
    const allowed = ["Submitted", "Assigned", "Cleaning in Progress", "Cleaning Completed", "Rejected"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid complaint status." });

    await client.query("BEGIN");
    const old = await client.query("SELECT status FROM complaints WHERE id = $1 FOR UPDATE", [req.params.id]);
    if (!old.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Complaint not found." });
    }
    const updated = await client.query(
      "UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    await client.query(
      `INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, req.user.id, old.rows[0].status, status, remarks || null]
    );
    await client.query("COMMIT");
    res.json({ complaint: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally { client.release(); }
}

async function assignWorker(req, res, next) {
  const client = await pool.connect();
  try {
    const { worker_id, deadline } = req.body;
    if (!worker_id || !deadline) return res.status(400).json({ message: "Worker and deadline are required." });

    await client.query("BEGIN");
    const worker = await client.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'worker'",
      [worker_id]
    );
    if (!worker.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Selected worker does not exist." });
    }
    const complaint = await client.query("SELECT id,status FROM complaints WHERE id = $1 FOR UPDATE", [req.params.id]);
    if (!complaint.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Complaint not found." });
    }
    await client.query(
      `INSERT INTO cleaning_tasks (complaint_id, worker_id, assigned_by, deadline, task_status)
       VALUES ($1,$2,$3,$4,'Assigned')
       ON CONFLICT (complaint_id) DO UPDATE
       SET worker_id = EXCLUDED.worker_id, assigned_by = EXCLUDED.assigned_by,
           deadline = EXCLUDED.deadline, task_status = 'Assigned', updated_at = NOW()`,
      [req.params.id, worker_id, req.user.id, deadline]
    );
    const updated = await client.query(
      "UPDATE complaints SET status = 'Assigned', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    await client.query(
      `INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks)
       VALUES ($1,$2,$3,'Assigned','Worker assigned')`,
      [req.params.id, req.user.id, complaint.rows[0].status]
    );
    await client.query("COMMIT");
    res.json({ complaint: updated.rows[0], message: "Worker assigned successfully." });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally { client.release(); }
}

async function verifyComplaint(req, res, next) {
  try {
    const { accepted, remarks } = req.body;
    const result = await pool.query(
      "SELECT id,citizen_id,status FROM complaints WHERE id = $1",
      [req.params.id]
    );
    const complaint = result.rows[0];
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });
    if (complaint.citizen_id !== req.user.id) return res.status(403).json({ message: "Not your complaint." });
    if (complaint.status !== "Cleaning Completed") {
      return res.status(400).json({ message: "This complaint is not marked as completed yet." });
    }

    const nextStatus = accepted ? "Verified" : "Reopened";
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE complaints SET status = $1, verification_remarks = $2, updated_at = NOW() WHERE id = $3",
        [nextStatus, remarks || null, req.params.id]
      );
      await client.query(
        `INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks)
         VALUES ($1,$2,'Cleaning Completed',$3,$4)`,
        [req.params.id, req.user.id, nextStatus, remarks || null]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally { client.release(); }
    res.json({ message: accepted ? "Cleaning verified. Thank you." : "Complaint reopened for review.", status: nextStatus });
  } catch (error) { next(error); }
}

async function updateTaskStatus(req, res, next) {
  const client = await pool.connect();
  try {
    const { task_status, remarks } = req.body;
    const allowed = ["Assigned", "Cleaning in Progress", "Cleaning Completed"];
    if (!allowed.includes(task_status)) return res.status(400).json({ message: "Invalid task status." });

    await client.query("BEGIN");
    const task = await client.query(
      `SELECT t.*, c.status AS complaint_status FROM cleaning_tasks t
       JOIN complaints c ON c.id = t.complaint_id WHERE t.id = $1 FOR UPDATE`,
      [req.params.taskId]
    );
    if (!task.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Task not found." });
    }
    if (req.user.role === "worker" && task.rows[0].worker_id !== req.user.id) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "This task is not assigned to you." });
    }
    await client.query(
      "UPDATE cleaning_tasks SET task_status = $1, remarks = $2, updated_at = NOW() WHERE id = $3",
      [task_status, remarks || null, req.params.taskId]
    );
    const complaintStatus = task_status;
    await client.query(
      "UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2",
      [complaintStatus, task.rows[0].complaint_id]
    );
    await client.query(
      `INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks)
       VALUES ($1,$2,$3,$4,$5)`,
      [task.rows[0].complaint_id, req.user.id, task.rows[0].complaint_status, complaintStatus, remarks || null]
    );
    await client.query("COMMIT");
    res.json({ message: "Task status updated.", task_status });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally { client.release(); }
}

async function addEvidence(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Please select an image." });
    const { evidence_type, remarks } = req.body;
    if (!["Before", "After"].includes(evidence_type)) {
      return res.status(400).json({ message: "Evidence type must be Before or After." });
    }
    const exists = await pool.query("SELECT id FROM complaints WHERE id = $1", [req.params.id]);
    if (!exists.rows.length) return res.status(404).json({ message: "Complaint not found." });

    const result = await pool.query(
      `INSERT INTO cleaning_evidence (complaint_id, uploaded_by, evidence_type, photo_url, remarks)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, req.user.id, evidence_type, `/uploads/${req.file.filename}`, remarks || null]
    );
    res.status(201).json({ evidence: result.rows[0] });
  } catch (error) { next(error); }
}

module.exports = {
  createComplaint, listComplaints, getComplaint, updateStatus,
  assignWorker, verifyComplaint, updateTaskStatus, addEvidence
};
