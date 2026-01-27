// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists logic (Optional safety check)
const uploadDir = 'public/uploads/products';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
        // CHANGED: Specific folder for products
        cb(null, 'public/uploads/products'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilterConfig = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

const upload = multer({ 
    storage: storageConfig,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
    fileFilter: fileFilterConfig
});

module.exports = upload;