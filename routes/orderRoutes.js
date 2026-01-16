// routes/orderRoutes.js
const express = require('express');
const router = express.Router();

// 1. Import Controller Functions
const { 
    createOrder, 
    getMyOrders, 
    getAllOrders,      // Check if this is greyed out/undefined
    updateOrderStatus  // Check if this is greyed out/undefined
} = require('../controllers/orderController');

// 2. Import Middleware
const { protect, admin } = require('../middleware/authMiddleware');

// 3. Define Routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);

// Admin Routes (This is where your error was happening)
router.get('/admin/all', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;