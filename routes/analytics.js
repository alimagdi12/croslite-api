const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/stats", analyticsController.getVisitStatistics);
router.get("/stats/summary", analyticsController.getVisitStatsSummary);
router.get("/product-clicks", analyticsController.getProductClickStats);

module.exports = router;