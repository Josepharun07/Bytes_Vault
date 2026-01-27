const express = require('express');
const router = express.Router();

const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    addReview,
} = require('../controllers/productController');

const upload = require('../middleware/uploadMiddleware');
const { verifyAuthenticationToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Public route
router.get('/', getProducts);

// Protect admin routes
router.use(verifyAuthenticationToken);
router.use(authorizeAdmin);

router.post('/', upload.single('image'), createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/review', addReview);

module.exports = router;
