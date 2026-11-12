const router = require("express").Router();
const { weather, elevation } = require("../controllers/weatherController");

router.get("/", weather);
router.get("/elevation", elevation);
module.exports = router;
