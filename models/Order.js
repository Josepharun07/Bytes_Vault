// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // In POS mode, 'user' refers to the STAFF member logging the sale
    // In Online mode, 'user' refers to the registered CUSTOMER
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        itemName: String,
        price: Number,
        qty: Number
    }],
    
    // NEW: Specifically for POS customer details (or guest checkout)
    buyerDetails: {
        name: { type: String, default: 'Walk-in Customer' },
        email: { type: String, default: '' }
    },

    shippingAddress: {
        fullName: String,
        address: String,
        city: String,
        zip: String
    },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    source: {
        type: String,
        enum: ['Online', 'POS'],
        default: 'Online'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);