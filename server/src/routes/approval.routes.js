const router = require('express').Router();
const { approveExpense, rejectExpense, getApprovalHistory } = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.post('/:id/approve', authorize('MANAGER', 'ADMIN'), approveExpense);
router.post('/:id/reject', authorize('MANAGER', 'ADMIN'), rejectExpense);
router.get('/:id/history', getApprovalHistory);

module.exports = router;
