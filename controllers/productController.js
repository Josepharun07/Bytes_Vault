// controllers/productController.js
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const notifyClients = (req, type, message) => {
    const io = req.app.get('io');
    if(io) io.emit('data:updated', { type, message, timestamp: new Date() });
};

// @desc    Add new product
exports.createCatalogItem = async (req, res) => {
    try {
        const { name, sku, price, stock, category, description, specs } = req.body;
        let imagePath = 'uploads/products/no-image.jpg';
        if (req.file) imagePath = `uploads/products/${req.file.filename}`;

        let parsedSpecs = specs;
        if (typeof specs === 'string') {
            try { parsedSpecs = JSON.parse(specs); } catch (e) { parsedSpecs = {}; }
        }

        const newItem = await Product.create({
            itemName: name,
            sku,
            price,
            stockCount: stock,
            category,
            description,
            imageUrl: imagePath,
            specs: parsedSpecs
        });

        // 🟢 TRIGGER SYNC
        notifyClients(req, 'PRODUCT_NEW', `New Product Added: ${name}`);

        res.status(201).json({ success: true, product: newItem });
    } catch (err) {
        if (req.file) fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
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

// @desc    Delete product
exports.removeItem = async (req, res) => {
    try {
        const item = await Product.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const name = item.itemName;
        if (item.imageUrl && !item.imageUrl.includes('no-image')) {
             const filePath = path.join(__dirname, '../public', item.imageUrl);
             fs.unlink(filePath, (err) => { if(err) console.error(err); });
        }

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
        if (req.file) product.imageUrl = `uploads/products/${req.file.filename}`;

        await product.save();

        // 🟢 TRIGGER SYNC
        notifyClients(req, 'PRODUCT_UPDATE', `Product Updated: ${product.itemName}`);

        res.status(200).json({ success: true, data: product });
    } catch (err) {
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