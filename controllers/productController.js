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
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// @desc    Add new product
exports.createCatalogItem = async (req, res) => {
    let createdProduct = null;
    try {
        const { name, sku, price, stock, category, description, specs } = req.body;
        
        // Input validation
        if (!name || !sku || price === undefined || stock === undefined || !category || !description) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided' });
        }
        
        if (name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Product name must be at least 2 characters' });
        }
        
        if (sku.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'SKU must be at least 2 characters' });
        }
        
        // Numeric validation
        const priceNum = Number(price);
        const stockNum = Number(stock);
        
        if (isNaN(priceNum) || priceNum < 0) {
            return res.status(400).json({ success: false, message: 'Price must be a positive number' });
        }
        
        if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
            return res.status(400).json({ success: false, message: 'Stock must be a positive integer' });
        }
        
        // Category validation
        const validCategories = ['GPU', 'CPU', 'Laptop', 'Console', 'Peripheral', 'Storage', 'Monitor', 'Motherboard', 'RAM', 'Power Supply', 'Case', 'Software'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }
        
        if (description.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
        }
        
        let parsedSpecs = specs;
        if (typeof specs === 'string') {
            try { parsedSpecs = JSON.parse(specs); } catch (e) { parsedSpecs = {}; }
        }

        createdProduct = await Product.create({
            itemName: name.trim(),
            sku: sku.trim().toUpperCase(),
            price: priceNum,
            stockCount: stockNum,
            category,
            description: description.trim(),
            // FIX 1: Use a reliable online placeholder if no image
            images: ['https://placehold.co/600x400?text=No+Image'], 
            specs: parsedSpecs
        });

        const imagePaths = [];

        if (req.files && req.files.length > 0) {
            const productId = createdProduct._id.toString();
            const productSlug = slugify(name);
            const targetDir = path.join(__dirname, '../public/uploads/products', productId);
            
            if (!fs.existsSync(targetDir)){
                fs.mkdirSync(targetDir, { recursive: true });
            }

            req.files.forEach((file, index) => {
                const ext = path.extname(file.originalname);
                const newFilename = `${productSlug}-${productId}-${index + 1}${ext}`;
                const targetPath = path.join(targetDir, newFilename);
                
                fs.renameSync(file.path, targetPath);

                // FIX 2: Force Forward Slashes (/) for URLs, even on Windows
                // Also add leading slash for absolute path
                let dbPath = `uploads/products/${productId}/${newFilename}`;
                imagePaths.push(dbPath); 
            });

            createdProduct.images = imagePaths;
            await createdProduct.save();
        }

        notifyClients(req, 'PRODUCT_NEW', `New Product Added: ${name}`);
        res.status(201).json({ success: true, product: createdProduct });

    } catch (err) {
        if(createdProduct) await Product.findByIdAndDelete(createdProduct._id);
        if (req.files) req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'SKU already exists.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

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

exports.removeItem = async (req, res) => {
    try {
        const item = await Product.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const name = item.itemName;
        const productId = item._id.toString();

        const productFolder = path.join(__dirname, '../public/uploads/products', productId);
        if (fs.existsSync(productFolder)) {
            fs.rmSync(productFolder, { recursive: true, force: true });
        }

        await item.deleteOne();
        notifyClients(req, 'PRODUCT_DEL', `Product Deleted: ${name}`);
        res.status(200).json({ success: true, message: 'Item removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCatalogItem = async (req, res) => {
    try {
        const { name, price, stock, description, category } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Validate name
        if (name !== undefined) {
            if (!name || name.trim().length < 2) {
                return res.status(400).json({ success: false, message: 'Product name must be at least 2 characters' });
            }
            product.itemName = name.trim();
        }
        
        // Validate price
        if (price !== undefined) {
            const priceNum = Number(price);
            if (isNaN(priceNum) || priceNum < 0) {
                return res.status(400).json({ success: false, message: 'Price must be a positive number' });
            }
            product.price = priceNum;
        }
        
        // Validate stock
        if (stock !== undefined) {
            const stockNum = Number(stock);
            if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
                return res.status(400).json({ success: false, message: 'Stock must be a positive integer' });
            }
            product.stockCount = stockNum;
        }
        
        // Validate description
        if (description !== undefined) {
            if (!description || description.trim().length < 10) {
                return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
            }
            product.description = description.trim();
        }
        
        // Validate category
        if (category !== undefined) {
            const validCategories = ['GPU', 'CPU', 'Laptop', 'Console', 'Peripheral', 'Storage', 'Monitor', 'Motherboard', 'RAM', 'Power Supply', 'Case', 'Software'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({ success: false, message: 'Invalid category' });
            }
            product.category = category;
        }

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
                
                // FIX 2 REPEATED: Force Forward Slashes
                newImagePaths.push(`uploads/products/${productId}/${newFilename}`);
            });

            product.images = newImagePaths;
        }

        await product.save();
        notifyClients(req, 'PRODUCT_UPDATE', `Product Updated: ${product.itemName}`);
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        if (req.files) req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        
        // Input validation
        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: 'Rating and comment are required' });
        }
        
        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        
        if (comment.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Comment must be at least 5 characters' });
        }
        
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
        if (alreadyReviewed) return res.status(400).json({ success: false, message: 'Product already reviewed' });

        const review = {
            name: req.user.fullName,
            rating: ratingNum,
            comment: comment.trim(),
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