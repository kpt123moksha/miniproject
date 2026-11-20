const router = require("express").Router();
const { listWorkers, listMyTasks, createWorker } = require("../controllers/workerController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

router.get("/me/tasks", protect, allowRoles("worker"), listMyTasks);
router.use(protect, allowRoles("authority", "admin"));
router.get("/", listWorkers);
router.post("/", createWorker);

module.exports = router;
