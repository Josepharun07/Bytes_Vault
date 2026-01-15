// controllers/productController.js
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// @desc    Add new product to catalog
// @route   POST /api/products
exports.createCatalogItem = async (req, res) => {
    try {
        const { name, sku, price, stock, category, description, specs } = req.body;
        
        // Handle Image File
        let imagePath = 'uploads/products/no-image.jpg'; // Default changed
        
        if (req.file) {
            // CHANGED: Store path including the 'products' subfolder
            imagePath = `uploads/products/${req.file.filename}`;
        }

        // Parse Specs if sent as JSON string
        let parsedSpecs = specs;
        if (typeof specs === 'string') {
            try {
                parsedSpecs = JSON.parse(specs);
            } catch (e) {
                parsedSpecs = {};
            }
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

        res.status(201).json({
            success: true,
            product: newItem
        });

    } catch (err) {
        // Clean up uploaded file if database error occurs
        if (req.file) {
            fs.unlink(path.join(__dirname, '../public/uploads', req.file.filename), () => {});
        }

        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'SKU already exists.' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all products (with optional filters)
// @route   GET /api/products
exports.fetchCatalog = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        // Filter by Category
        if (category) {
            query.category = category;
        }

        // Search by Name (Case insensitive regex)
        if (search) {
            query.itemName = { $regex: search, $options: 'i' };
        }

        const products = await Product.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.removeItem = async (req, res) => {
    try {
        const item = await Product.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Optional: Delete image file associated with product
        if (item.imageUrl && !item.imageUrl.includes('no-image')) {
             const filePath = path.join(__dirname, '../public', item.imageUrl);
             fs.unlink(filePath, (err) => { if(err) console.error(err); });
        }

        await item.deleteOne();

        res.status(200).json({ success: true, message: 'Item removed from catalog' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};