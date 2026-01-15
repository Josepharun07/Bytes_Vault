// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { createCatalogItem, fetchCatalog, removeItem } = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');

// Public Route (View Products)
router.get('/', fetchCatalog);

// Admin Routes (Write Access)
// Note: We will add Auth Middleware here later. For now, it's open for testing.
router.post('/', upload.single('image'), createCatalogItem);
router.delete('/:id', removeItem);

module.exports = router;