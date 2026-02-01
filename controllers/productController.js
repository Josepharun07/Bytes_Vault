// controllers/productController.js
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const notifyClients = (req, type, message) => {
    const io = req.app.get('io');
    if(io) io.emit('data:updated', { type, message, timestamp: new Date() });
};

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// Helper: Normalize Category (Title Case)
const formatCategory = (cat) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
};

// @desc    Get All Unique Categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.status(200).json({ success: true, data: categories.sort() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Add new product
exports.createCatalogItem = async (req, res) => {
    let createdProduct = null;
    try {
        const { name, sku, price, stock, category, description, specs } = req.body;
        
        // Input validation
        if (!name || !sku || !category || !description) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }
        
        let parsedSpecs = specs;
        if (typeof specs === 'string') {
            try { parsedSpecs = JSON.parse(specs); } catch (e) { parsedSpecs = {}; }
        }

        // Store Category in uniform format (e.g., "Laptop", not "laptop")
        const formattedCategory = formatCategory(category);

        createdProduct = await Product.create({
            itemName: name.trim(),
            sku: sku.trim().toUpperCase(),
            price: Number(price),
            stockCount: Number(stock),
            category: formattedCategory,
            description: description.trim(),
            images: ['https://placehold.co/600x400?text=No+Image'], 
            specs: parsedSpecs
        });

        // Image Handling (Same as before)
        const imagePaths = [];
        if (req.files && req.files.length > 0) {
            const productId = createdProduct._id.toString();
            const productSlug = slugify(name);
            const targetDir = path.join(__dirname, '../public/uploads/products', productId);
            
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            req.files.forEach((file, index) => {
                const ext = path.extname(file.originalname);
                const newFilename = `${productSlug}-${productId}-${index + 1}${ext}`;
                const targetPath = path.join(targetDir, newFilename);
                fs.renameSync(file.path, targetPath);
                // Force forward slashes
                imagePaths.push(`uploads/products/${productId}/${newFilename}`); 
            });

            createdProduct.images = imagePaths;
            await createdProduct.save();
        }

        notifyClients(req, 'PRODUCT_NEW', `New Product: ${name}`);
        res.status(201).json({ success: true, product: createdProduct });

    } catch (err) {
        if(createdProduct) await Product.findByIdAndDelete(createdProduct._id);
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'SKU exists.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all products (Expanded Search)
exports.fetchCatalog = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        // Filter by Category
        if (category && category !== 'All') {
            query.category = category;
        }

        // Search Logic: Name OR Description OR Category
        if (search && search.trim() !== '') {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [
                { itemName: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ];
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const item = await Product.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const productId = item._id.toString();
        const productFolder = path.join(__dirname, '../public/uploads/products', productId);
        
        if (fs.existsSync(productFolder)) {
            fs.rmSync(productFolder, { recursive: true, force: true });
        }

        await item.deleteOne();
        notifyClients(req, 'PRODUCT_DEL', `Deleted: ${item.itemName}`);
        res.status(200).json({ success: true, message: 'Item removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCatalogItem = async (req, res) => {
    try {
        const { name, price, stock, description, category } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Not found' });

        if(name) product.itemName = name;
        if(price) product.price = Number(price);
        if(stock) product.stockCount = Number(stock);
        if(description) product.description = description;
        if(category) product.category = formatCategory(category); // Normalize on update too

        if (req.files && req.files.length > 0) {
            const productId = product._id.toString();
            const productSlug = slugify(product.itemName);
            const targetDir = path.join(__dirname, '../public/uploads/products', productId);

            if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
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
        notifyClients(req, 'PRODUCT_UPDATE', `Updated: ${product.itemName}`);
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

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