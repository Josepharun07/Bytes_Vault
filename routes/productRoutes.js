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

// Admin
router.post('/', protect, admin, upload.single('image'), createCatalogItem);
router.put('/:id', protect, admin, upload.single('image'), updateCatalogItem); // Edit Route
router.delete('/:id', protect, admin, removeItem);

module.exports = router;