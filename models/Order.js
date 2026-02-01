const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        itemName: String,
        price: Number,
        qty: Number
    }],
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