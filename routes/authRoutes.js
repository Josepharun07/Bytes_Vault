const express = require('express');
const router = express.Router();
const { registerCustomer, authenticateCustomer } = require('../controllers/authController');

// Map routes to controller functions
router.post('/register', registerCustomer);
router.post('/login', authenticateCustomer);

module.exports = router;
