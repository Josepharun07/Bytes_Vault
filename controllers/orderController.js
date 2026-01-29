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
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
    try {
        const { cartItems, shippingAddress } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in cart' });
        }

        let orderItems = [];
        let totalAmount = 0;

        for (const item of cartItems) {
            const product = await Product.findById(item._id);
            if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.itemName}` });
            if (product.stockCount < item.qty) return res.status(400).json({ success: false, message: `Insufficient stock for: ${product.itemName}` });

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

        const tax = totalAmount * 0.10;
        const grandTotal = totalAmount + tax;

        const order = await Order.create({
            user: req.user.id,
            items: orderItems,
            shippingAddress,
            totalAmount: grandTotal
        });

        // 🟢 TRIGGER SYNC
        notifyClients(req, 'ORDER_NEW', `New Order placed for $${grandTotal.toFixed(2)}`);

        res.status(201).json({ success: true, order });
    } catch (err) {
        console.error("Order Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get All Orders (Admin)
// @route   GET /api/orders/admin/all
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'fullName emailAddress') // Fixed email field name
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update Status (Admin)
// @route   PUT /api/orders/admin/:id
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

        // 1. Validate Status
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid status. Allowed: ${validStatuses.join(', ')}` 
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // 2. Update and Save
        order.status = status;
        await order.save();

        // 🟢 TRIGGER SYNC
        notifyClients(req, 'ORDER_UPDATE', `Order #${order._id.toString().slice(-4)} updated to ${order.status}`);

        res.status(200).json({ success: true, message: 'Order updated', order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/orders/admin/stats
exports.getDashboardStats = async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: 'Cancelled' } });
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments({ privilegeLevel: 'customer' });
        
        const lowStockProducts = await Product.find({ stockCount: { $lt: 5 } })
            .select('itemName stockCount imageUrl')
            .limit(5);

        res.status(200).json({
            success: true,
            stats: {
                revenue: totalRevenue,
                orders: totalOrders,
                users: totalUsers,
                lowStock: lowStockProducts
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};