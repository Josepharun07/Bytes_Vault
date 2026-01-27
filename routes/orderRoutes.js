const express = require('express');
const router = express.Router();

const { getMyOrders } = require('../controllers/orderController');
const { verifyAuthenticationToken } = require('../middleware/authMiddleware');

// protect route
router.use(verifyAuthenticationToken);

// GET /api/orders/mine
router.get('/mine', getMyOrders);

module.exports = router;
