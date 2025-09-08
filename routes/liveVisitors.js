const express = require('express');
const router = express.Router();
const {
  getLiveVisitorsController,
  getLiveVisitorsCountController
} = require('../controllers/liveVisitorsController');

// GET /api/analytics/live-visitors - Get all live visitors data
router.get('/live-visitors', getLiveVisitorsController);

// GET /api/analytics/live-visitors/count - Get only live visitors count
router.get('/live-visitors/count', getLiveVisitorsCountController);

module.exports = router;