// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
    // Note: Removed Atomic Transactions to support Local Standalone MongoDB
    try {
        const { cartItems, shippingAddress } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in cart' });
        }

        let orderItems = [];
        let totalAmount = 0;

        // 1. Loop through items to check stock and deduct
        for (const item of cartItems) {
            const product = await Product.findById(item._id);

            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.itemName}` });
            }

            if (product.stockCount < item.qty) {
                return res.status(400).json({ success: false, message: `Insufficient stock for: ${product.itemName}` });
            }

            // Deduct Stock (Direct Save)
            product.stockCount -= item.qty;
            await product.save();

            // Calculate Totals
            totalAmount += product.price * item.qty;

            orderItems.push({
                product: product._id,
                itemName: product.itemName,
                price: product.price,
                qty: item.qty
            });
        }

        // 2. Add Tax (10%)
        const tax = totalAmount * 0.10;
        const grandTotal = totalAmount + tax;

        // 3. Create Order
        const order = await Order.create({
            user: req.user.id,
            items: orderItems,
            shippingAddress,
            totalAmount: grandTotal
        });

        res.status(201).json({
            success: true,
            order: order
        });

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

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'fullName email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        order.status = req.body.status;
        await order.save();

        res.status(200).json({ success: true, message: 'Order updated', order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};