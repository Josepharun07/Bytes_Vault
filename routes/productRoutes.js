const express = require('express');
const router = express.Router();
const { fetchCatalog, createCatalogItem, removeItem, createProductReview } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', fetchCatalog);
router.post('/', protect, admin, upload.array('image'), createCatalogItem);
router.delete('/:id', protect, admin, removeItem);
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;