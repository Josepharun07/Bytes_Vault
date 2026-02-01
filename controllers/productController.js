const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const notifyClients = (req, type, message) => {
    const io = req.app.get('io');
    if(io) io.emit('data:updated', { type, message });
};

const slugify = (text) => text.toLowerCase().replace(/[^\w]+/g, '-');

exports.createCatalogItem = async (req, res) => {
    let createdProduct = null;
    try {
        const { name, sku, price, stock, category, description, specs } = req.body;
        
        let parsedSpecs = {};
        try { parsedSpecs = JSON.parse(specs); } catch(e) {}

        createdProduct = await Product.create({
            itemName: name,
            sku,
            price,
            stockCount: stock,
            category,
            description,
            specs: parsedSpecs,
            images: ['uploads/products/no-image.jpg']
        });

        if (req.files && req.files.length > 0) {
            const productId = createdProduct._id.toString();
            const targetDir = path.join(__dirname, '../public/uploads/products', productId);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            const imagePaths = req.files.map((file, i) => {
                const ext = path.extname(file.originalname);
                const newName = `${slugify(name)}-${productId}-${i}${ext}`;
                fs.renameSync(file.path, path.join(targetDir, newName));
                return `uploads/products/${productId}/${newName}`;
            });

            createdProduct.images = imagePaths;
            createdProduct.imageUrl = imagePaths[0];
            await createdProduct.save();
        }

        notifyClients(req, 'PRODUCT_NEW', `Added: ${name}`);
        res.status(201).json({ success: true, product: createdProduct });

    } catch (err) {
        if(createdProduct) await Product.findByIdAndDelete(createdProduct._id);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.fetchCatalog = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};
        if(category && category !== 'All') query.category = category;
        if(search) query.itemName = { $regex: search, $options: 'i' };
        
        const products = await Product.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const cats = await Product.distinct('category');
        res.status(200).json({ success: true, data: cats.sort() });
    } catch(err) {
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