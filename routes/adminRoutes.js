const express = require('express');
const router = express.Router();
const {
    registerAdmin,
    loginAdmin,
    getAllAdmins,
    promoteUserToAdmin,
    demoteAdminToUser
} = require('../controllers/adminController');

const { verifyAuthenticationToken, authorizeSuperAdmin } = require('../middleware/authMiddleware');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected Management Routes
router.use(verifyAuthenticationToken);

router.get('/', authorizeSuperAdmin, getAllAdmins);
router.post('/promote/:userId', authorizeSuperAdmin, promoteUserToAdmin);
router.post('/demote/:adminId', authorizeSuperAdmin, demoteAdminToUser);

module.exports = router;
