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

// Replace the existing createOrder function in controllers/orderController.js

exports.createOrder = async (req, res) => {
    try {
        // Extract buyerDetails from request
        const { cartItems, shippingAddress, source, buyerDetails } = req.body; 
        
        let totalAmount = 0;
        let orderItems = [];

        // 1. Stock Validation (Same as before)
        for (const item of cartItems) {
            const product = await Product.findById(item._id);
            if (!product) return res.status(404).json({ success: false, message: `Product not found` });
            if (product.stockCount < item.qty) return res.status(400).json({ success: false, message: `Insufficient stock` });

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

        // 2. Determine Order Status
        const orderStatus = (source === 'POS') ? 'Completed' : 'Pending';
        
        // 3. Create Order
        const order = await Order.create({
            user: req.user.id, // This links the logged-in user (Staff for POS, Customer for Online)
            items: orderItems,
            shippingAddress,
            totalAmount: totalAmount * 1.1,
            source: source || 'Online',
            status: orderStatus,
            // Save the specific buyer info
            buyerDetails: buyerDetails || { 
                name: shippingAddress?.fullName || 'Online Customer', 
                email: '' 
            }
        });

        // Notify Admin
        const io = req.app.get('io');
        if(io) io.emit('data:updated', { type: 'ORDER_NEW', message: `New ${source} Order` });

        // Send back the order object + the Staff Name (from req.user) for confirmation
        const responseOrder = order.toObject();
        responseOrder.staffName = req.user.fullName; 

        res.status(201).json({ success: true, order: responseOrder });
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