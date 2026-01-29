// routes/orderRoutes.js
const express = require('express');
const router = express.Router();

// 1. Import Controller Functions
const { 
    createOrder, 
    getMyOrders, 
    getAllOrders,      
    updateOrderStatus,
    getDashboardStats 
} = require('../controllers/orderController');

// 2. Import Middleware
const { protect, admin } = require('../middleware/authMiddleware');

// 3. Customer Routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);

// 4. Admin Routes
router.get('/admin/all', protect, admin, getAllOrders);
router.get('/admin/stats', protect, admin, getDashboardStats);

// Update Status: PUT /api/orders/admin/:id
router.put('/admin/:id', protect, admin, updateOrderStatus);

module.exports = router;