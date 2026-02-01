const express = require('express');
const router = express.Router();
const { 
    createCatalogItem, fetchCatalog, removeItem, 
    updateCatalogItem, createProductReview, getCategories 
} = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', fetchCatalog);
router.get('/categories', getCategories);
router.post('/', protect, admin, upload.array('images', 5), createCatalogItem);
router.put('/:id', protect, admin, upload.array('images', 5), updateCatalogItem);
router.delete('/:id', protect, admin, removeItem);
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;