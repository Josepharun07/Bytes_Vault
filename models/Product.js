// models/Product.js
const mongoose = require('mongoose');

const catalogItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    sku: { // Stock Keeping Unit (Unique ID)
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    stockCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['GPU', 'CPU', 'Laptop', 'Peripheral', 'Console', 'Other']
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: 'uploads/no-image.jpg'
    },
    specs: {
        type: Map, // Flexible object for tech specs (e.g., { "RAM": "16GB" })
        of: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', catalogItemSchema);