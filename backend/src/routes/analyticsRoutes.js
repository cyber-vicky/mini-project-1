const express = require('express');
const router = express.Router();
const { getAnalytics, getHotspots, getPublicStats } = require('../controllers/analyticsController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.get('/public-stats', getPublicStats);
router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER']), getAnalytics);
router.get('/hotspots', authMiddleware, roleMiddleware(['ADMIN', 'OFFICER']), getHotspots);

module.exports = router;
