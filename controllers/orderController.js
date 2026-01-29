// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Helper to notify clients
const notifyClients = (req, type, message) => {
    const io = req.app.get('io');
    if(io) {
        io.emit('data:updated', { type, message, timestamp: new Date() });
    }
};

// @desc    Create new order
exports.createOrder = async (req, res) => {
    try {
        const { cartItems, shippingAddress } = req.body;
        let totalAmount = 0;
        let orderItems = [];

        for (const item of cartItems) {
            const product = await Product.findById(item._id);
            
            // Validate Product
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found` });
            }
            
            // Validate Stock
            if (product.stockCount < item.qty) {
                // --- FIX 1: Match the test expectation string ---
                return res.status(400).json({ success: false, message: `Insufficient stock for: ${item.itemName}` });
            }

            // Deduct
            product.stockCount -= item.qty;
            await product.save();
            
            totalAmount += product.price * item.qty;
            orderItems.push({
                product: product._id,
                itemName: product.itemName,
                price: product.price,
                qty: item.qty
            });
        }

        const order = await Order.create({
            user: req.user.id,
            items: orderItems,
            shippingAddress,
            totalAmount: totalAmount * 1.1 // +10% Tax
        });

        notifyClients(req, 'ORDER_NEW', 'New Order Placed');

        res.status(201).json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'fullName emailAddress').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if(!order) return res.status(404).json({ success: false, message: 'Order not found' });
        
        order.status = req.body.status;
        await order.save();
        
        // --- FIX 2: Match the test expectation string ---
        res.status(200).json({ success: true, message: 'Order updated', order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const revenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
        const orders = await Order.countDocuments();
        const users = await User.countDocuments({ privilegeLevel: 'customer' });
        const lowStock = await Product.find({ stockCount: { $lt: 5 } }).limit(5);
        
        res.json({
            success: true,
            stats: {
                revenue: revenue[0]?.total || 0,
                orders,
                users,
                lowStock
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};