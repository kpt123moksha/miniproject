require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connection successful");
    app.listen(PORT, () => {
      console.log(`DrainWatch API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to PostgreSQL:", error.message);
    process.exit(1);
  }
}

startServer();
