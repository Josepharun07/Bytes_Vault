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

// @desc    Create new order (Supports Online & POS)
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
    try {
        const { cartItems, shippingAddress, source, buyerDetails } = req.body;
        
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart empty' });
        }

        // Logic: POS vs Online Address
        let finalAddress = shippingAddress;
        if (source === 'POS') {
            finalAddress = {
                fullName: buyerDetails?.name || 'Walk-in',
                address: 'In-Store',
                city: 'Local',
                zip: '00000',
                ...shippingAddress
            };
        } else {
            if (!shippingAddress?.address) return res.status(400).json({ success: false, message: 'Address required' });
        }

        let totalAmount = 0;
        let orderItems = [];

        // Stock Deduction
        for (const item of cartItems) {
            const product = await Product.findById(item._id);
            if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.itemName}` });
            if (product.stockCount < item.qty) return res.status(400).json({ success: false, message: `Insufficient stock: ${item.itemName}` });

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

        // Create
        const orderStatus = source === 'POS' ? 'Completed' : 'Pending';
        const order = await Order.create({
            user: req.user.id,
            items: orderItems,
            shippingAddress: finalAddress,
            totalAmount: totalAmount * 1.1, // Tax
            status: orderStatus,
            source: source || 'Online',
            buyerDetails
        });

        notifyClients(req, 'ORDER_NEW', `New Order ($${order.totalAmount.toFixed(2)})`);
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
        const { status } = req.body;
        const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Completed'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        order.status = status;
        await order.save();

        notifyClients(req, 'ORDER_UPDATE', `Order #${order._id.toString().slice(-4)} updated to ${status}`);

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