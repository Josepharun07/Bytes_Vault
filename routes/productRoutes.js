const express = require('express');
const router = express.Router();
const { 
    fetchCatalog, 
    createCatalogItem, 
    updateCatalogItem, 
    removeItem, 
    createProductReview,
    getCategories // <--- Import this
} = require('../controllers/productController');

const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.get('/', fetchCatalog);
router.get('/categories', getCategories); // <--- New Route

// Admin Routes
router.post('/', protect, admin, upload.array('image'), createCatalogItem);
router.put('/:id', protect, admin, upload.array('image'), updateCatalogItem); 
router.delete('/:id', protect, admin, removeItem);

// User Routes
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;