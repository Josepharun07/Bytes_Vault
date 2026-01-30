const express = require('express');
const router = express.Router();
const { getSalesTrend, getCategorySales, getTopProducts } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/trend', getSalesTrend);
router.get('/categories', getCategorySales);
router.get('/top-products', getTopProducts);

module.exports = router;