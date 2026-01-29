// controllers/productController.js
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const notifyClients = (req, type, message) => {
    const io = req.app.get('io');
    if(io) io.emit('data:updated', { type, message, timestamp: new Date() });
};

// Helper to sanitize filenames
const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

// @desc    Add new product (Multi-Image Support)
exports.createCatalogItem = async (req, res) => {
    let createdProduct = null;
    try {
        const { name, sku, price, stock, category, description, specs } = req.body;
        
        let parsedSpecs = specs;
        if (typeof specs === 'string') {
            try { parsedSpecs = JSON.parse(specs); } catch (e) { parsedSpecs = {}; }
        }

        // 1. Create Product Document first (to get the _id)
        createdProduct = await Product.create({
            itemName: name,
            sku,
            price,
            stockCount: stock,
            category,
            description,
            images: [], // Will populate after moving files
            specs: parsedSpecs
        });

        const imagePaths = [];

        // 2. Handle File Moving & Renaming
        if (req.files && req.files.length > 0) {
            const productId = createdProduct._id.toString();
            const productSlug = slugify(name);
            
            // Create specific folder: public/uploads/products/<id>
            const targetDir = path.join(__dirname, '../public/uploads/products', productId);
            if (!fs.existsSync(targetDir)){
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Loop through uploaded temp files
            req.files.forEach((file, index) => {
                const ext = path.extname(file.originalname);
                // Format: <product-name>-<product-id>-<image-number>.ext
                const newFilename = `${productSlug}-${productId}-${index + 1}${ext}`;
                const targetPath = path.join(targetDir, newFilename);
                
                // Move file from temp to target
                fs.renameSync(file.path, targetPath);

                // Store relative path for DB
                imagePaths.push(`uploads/products/${productId}/${newFilename}`);
            });

            // 3. Update Product with image paths
            createdProduct.images = imagePaths;
            await createdProduct.save();
        } else {
            // Default image if none uploaded
            createdProduct.images = ['uploads/products/no-image.jpg'];
            await createdProduct.save();
        }

        // 🟢 TRIGGER SYNC
        notifyClients(req, 'PRODUCT_NEW', `New Product Added: ${name}`);

        res.status(201).json({ success: true, product: createdProduct });

    } catch (err) {
        // Cleanup: If product was created but error occurred later, delete it
        if(createdProduct) {
            await Product.findByIdAndDelete(createdProduct._id);
        }
        // Cleanup: Delete temp files if any
        if (req.files) {
            req.files.forEach(f => {
                if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
        }

        if (err.code === 11000) return res.status(400).json({ success: false, message: 'SKU already exists.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all products
exports.fetchCatalog = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};
        if (category && category !== 'All') query.category = category;
        if (search && search.trim() !== '') query.itemName = { $regex: search, $options: 'i' };

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete product & Folder
exports.removeItem = async (req, res) => {
    try {
        const item = await Product.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const name = item.itemName;
        const productId = item._id.toString();

        // 1. Delete Product Folder recursively
        const productFolder = path.join(__dirname, '../public/uploads/products', productId);
        if (fs.existsSync(productFolder)) {
            fs.rmSync(productFolder, { recursive: true, force: true });
        }

        // 2. Remove DB Entry
        await item.deleteOne();

        // 🟢 TRIGGER SYNC
        notifyClients(req, 'PRODUCT_DEL', `Product Deleted: ${name}`);

        res.status(200).json({ success: true, message: 'Item removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update product
exports.updateCatalogItem = async (req, res) => {
    try {
        const { name, price, stock, description, category } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if(name) product.itemName = name;
        if(price) product.price = price;
        if(stock) product.stockCount = stock;
        if(description) product.description = description;
        if(category) product.category = category;

        // Handle New Images (Replaces old ones logic for simplicity)
        if (req.files && req.files.length > 0) {
            const productId = product._id.toString();
            const productSlug = slugify(product.itemName);
            const targetDir = path.join(__dirname, '../public/uploads/products', productId);

            // Clear existing folder content
            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
            fs.mkdirSync(targetDir, { recursive: true });

            const newImagePaths = [];
            req.files.forEach((file, index) => {
                const ext = path.extname(file.originalname);
                const newFilename = `${productSlug}-${productId}-${index + 1}${ext}`;
                const targetPath = path.join(targetDir, newFilename);
                fs.renameSync(file.path, targetPath);
                newImagePaths.push(`uploads/products/${productId}/${newFilename}`);
            });

            product.images = newImagePaths;
        }

        await product.save();

        // 🟢 TRIGGER SYNC
        notifyClients(req, 'PRODUCT_UPDATE', `Product Updated: ${product.itemName}`);

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        // Cleanup temps
        if (req.files) req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Review product
exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
        if (alreadyReviewed) return res.status(400).json({ success: false, message: 'Product already reviewed' });

        const review = {
            name: req.user.fullName,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();
        res.status(201).json({ success: true, message: 'Review added' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};