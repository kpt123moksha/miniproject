const router = require("express").Router();
const { listWorkers, createWorker } = require("../controllers/workerController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

router.use(protect, allowRoles("authority", "admin"));
router.get("/", listWorkers);
router.post("/", createWorker);

module.exports = router;
