const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }, // Reviewer Name snapshot
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
    imageUrl: { type: String, default: 'uploads/products/no-image.jpg' },
    
    // Dynamic Specs (Flexible Key-Value pairs)
    specs: { type: Map, of: String },
    
    // Reviews
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);