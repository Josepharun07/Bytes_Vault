const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, createUser, deleteUser, resetUserPassword } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);
router.put('/:id/password', resetUserPassword);

module.exports = router;