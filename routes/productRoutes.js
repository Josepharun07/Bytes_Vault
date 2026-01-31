const express = require('express');
const router = express.Router();
// 1. Import updateCatalogItem here
const { 
    fetchCatalog, 
    createCatalogItem, 
    updateCatalogItem, 
    removeItem, 
    createProductReview 
} = require('../controllers/productController');

const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.get('/', fetchCatalog);

// Admin Routes
router.post('/', protect, admin, upload.array('image'), createCatalogItem);
// 2. Add this PUT route so the server knows how to handle updates
router.put('/:id', protect, admin, upload.array('image'), updateCatalogItem); 
router.delete('/:id', protect, admin, removeItem);

// User Routes
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;