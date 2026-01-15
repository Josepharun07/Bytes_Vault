// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerNewMember, authenticateMember } = require('../controllers/authController');

router.post('/register', registerNewMember);
router.post('/login', authenticateMember);

module.exports = router;