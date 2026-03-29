const router = require('express').Router();
const { getWorkflows, getWorkflowById, createWorkflow, updateWorkflow, deleteWorkflow, setDefault } = require('../controllers/workflow.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('ADMIN'));
router.get('/', getWorkflows);
router.post('/', createWorkflow);
router.get('/:id', getWorkflowById);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);
router.patch('/:id/default', setDefault);

module.exports = router;
