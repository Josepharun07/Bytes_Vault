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
    
    // CHANGED: Removed 'enum'. Added trim.
    category: { 
        type: String, 
        required: true,
        trim: true
    },
    
    description: { type: String, required: true },
    imageUrl: { type: String, default: 'https://placehold.co/600x400?text=No+Image' },
    specs: { type: Map, of: String },
    images: { type: [String], default: [] },
    
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);