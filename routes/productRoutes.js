const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const { verifyAuthenticationToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Public route to view products
router.get('/', getProducts);

// Protected Admin routes
router.use(verifyAuthenticationToken);
router.use(authorizeAdmin);

router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
