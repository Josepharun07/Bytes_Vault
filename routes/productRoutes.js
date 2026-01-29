// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { 
    createCatalogItem, 
    fetchCatalog, 
    removeItem, 
    updateCatalogItem,   
    createProductReview  
} = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');

// Public Route (View Products)
router.get('/', fetchCatalog);

router.post('/:id/reviews', protect, createProductReview);

// Admin Routes
router.post('/', protect, admin, upload.array('images', 5), createCatalogItem);
router.put('/:id', protect, admin, upload.array('images', 5), updateCatalogItem); 
router.delete('/:id', protect, admin, removeItem);

module.exports = router;
