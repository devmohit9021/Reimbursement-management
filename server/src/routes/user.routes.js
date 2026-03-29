const router = require('express').Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, getTeam, updateProfile, getManagers } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/managers', getManagers);
router.get('/team', authorize('MANAGER', 'ADMIN'), getTeam);
router.patch('/me', updateProfile);
router.get('/', authorize('ADMIN'), getAllUsers);
router.post('/', authorize('ADMIN'), createUser);
router.get('/:id', authorize('ADMIN'), getUserById);
router.patch('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

module.exports = router;
