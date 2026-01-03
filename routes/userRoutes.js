const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/userController');
const { verifyAuthenticationToken, authorizeSuperAdmin, authorizeAdmin } = require('../middleware/authMiddleware');

// Protect all routes
router.use(verifyAuthenticationToken);

// Get Users - Allow Admin or SuperAdmin (requirement says "users given permission by the super")
// We will allow 'admin' and 'superadmin' to VIEW users.
router.get('/', authorizeAdmin, getUsers);

// Update Role - ONLY Super Admin (requirement: "only the super user can do this")
router.put('/:id/role', authorizeSuperAdmin, updateUserRole);

module.exports = router;
