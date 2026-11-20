const router = require("express").Router();
const controller = require("../controllers/complaintController");
const imageAnalysisController = require("../controllers/imageAnalysisController");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const imageAnalysisUpload = require("../middleware/imageAnalysisUploadMiddleware");

router.use(protect);
router.get("/", controller.listComplaints);
router.post("/analyze-image", allowRoles("citizen"), imageAnalysisUpload, imageAnalysisController.analyzeImage);
router.post("/", allowRoles("citizen"), upload.single("photo"), controller.createComplaint);
router.get("/:id", controller.getComplaint);
router.patch("/:id/status", allowRoles("authority", "admin"), controller.updateStatus);
router.post("/:id/assign", allowRoles("authority", "admin"), controller.assignWorker);
router.post("/:id/authority-confirm", allowRoles("authority", "admin"), controller.confirmByAuthority);
router.post("/:id/verify", allowRoles("citizen"), controller.verifyComplaint);
router.post("/:id/evidence", allowRoles("worker", "authority", "admin"), upload.single("photo"), controller.addEvidence);
router.post("/:id/complete", allowRoles("worker"), upload.fields([
  { name: "beforePhoto", maxCount: 1 },
  { name: "afterPhoto", maxCount: 1 }
]), controller.completeTask);
router.post("/:id/rating", allowRoles("citizen"), controller.rateCompletion);
router.patch("/tasks/:taskId/status", allowRoles("worker", "authority", "admin"), controller.updateTaskStatus);

module.exports = router;
