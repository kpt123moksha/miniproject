const pool = require("../config/db");

async function summary(req, res, next) {
  try {
    const isAuthority = ["authority", "admin"].includes(req.user.role);
    const params = [];
    const where = isAuthority ? "" : "WHERE citizen_id = $1";
    if (!isAuthority) params.push(req.user.id);

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'Submitted')::int AS pending,
       COUNT(*) FILTER (WHERE status IN ('Assigned','Cleaning in Progress'))::int AS assigned,
       COUNT(*) FILTER (WHERE status = 'Verified')::int AS completed,
       COUNT(*) FILTER (WHERE risk_level IN ('High','Critical'))::int AS high_risk
       FROM complaints ${where}`,
      params
    );
    const overdue = await pool.query(
      `SELECT COUNT(*)::int AS overdue FROM cleaning_tasks
       WHERE deadline < NOW() AND task_status <> 'Cleaning Completed'`
    );
    let cityStats = [];
    if (isAuthority) {
      const byCity = await pool.query(
        `SELECT city_filter.city,
         COUNT(c.id)::int AS total,
         COUNT(c.id) FILTER (WHERE c.status IN ('Submitted','Reopened'))::int AS pending,
         COUNT(c.id) FILTER (WHERE c.status IN ('Assigned','Cleaning in Progress'))::int AS assigned,
         COUNT(c.id) FILTER (WHERE c.status = 'Verified')::int AS completed,
         COUNT(t.id) FILTER (WHERE t.deadline < NOW() AND t.task_status <> 'Cleaning Completed')::int AS overdue
         FROM (VALUES ('Mangaluru'), ('Bantwal'), ('Udupi')) AS city_filter(city)
         LEFT JOIN complaints c ON c.city = city_filter.city
         LEFT JOIN cleaning_tasks t ON t.complaint_id = c.id
         GROUP BY city_filter.city
         ORDER BY city_filter.city`
      );
      cityStats = byCity.rows;
    }
    res.json({
      ...result.rows[0],
      overdue: isAuthority ? overdue.rows[0].overdue : 0,
      city_stats: cityStats
    });
  } catch (error) { next(error); }
}

module.exports = { summary };
