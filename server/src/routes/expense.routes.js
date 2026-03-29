const router = require('express').Router();
const { createExpense, getExpenses, getExpenseById, updateExpenseStatus, deleteExpense, getPendingForApprover } = require('../controllers/expense.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authenticate);
router.get('/pending', authorize('MANAGER', 'ADMIN'), getPendingForApprover);
router.get('/', getExpenses);
router.post('/', upload.single('receipt'), createExpense);
router.get('/:id', getExpenseById);
router.patch('/:id/status', authorize('ADMIN'), updateExpenseStatus);
router.delete('/:id', deleteExpense);

module.exports = router;
