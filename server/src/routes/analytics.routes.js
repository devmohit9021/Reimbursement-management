const router = require('express').Router();
const { getSummary, getByCategory, getByStatus, getTrends, getTopExpenses } = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('MANAGER', 'ADMIN'));
router.get('/summary', getSummary);
router.get('/by-category', getByCategory);
router.get('/by-status', getByStatus);
router.get('/trends', getTrends);
router.get('/top-expenses', getTopExpenses);

module.exports = router;
