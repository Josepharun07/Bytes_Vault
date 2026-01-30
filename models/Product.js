// models/Product.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    itemName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true },
    price: { type: Number, required: true, min: 0 },
    stockCount: { type: Number, required: true, min: 0, default: 0 },
    category: { 
        type: String, 
        required: true,
        enum: ['GPU', 'CPU', 'Laptop', 'Console', 'Peripheral', 'Storage', 'Monitor', 'Motherboard', 'RAM', 'Power Supply', 'Case', 'Software']
    },
    description: { type: String, required: true },
    
    // FIX: Change default to the online placeholder so it works out of the box
    imageUrl: { type: String, default: 'https://placehold.co/600x400?text=No+Image' },
    
    // Dynamic Specs
    specs: { type: Map, of: String },
    
    // Images Array (Priority)
    images: { type: [String], default: [] },
    
    // Reviews
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);