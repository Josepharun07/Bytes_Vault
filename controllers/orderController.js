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
        
        // 1. Validate Cart
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart items are required' });
        }

        // 2. Conditional Address Logic (POS vs Online)
        let finalShippingAddress = shippingAddress;

        if (source === 'POS') {
            // --- POS LOGIC: Bypass strict address checks ---
            // Auto-fill defaults if address is missing for walk-in customers
            finalShippingAddress = {
                fullName: buyerDetails?.name || 'Walk-in Customer',
                address: 'In-Store Pickup',
                city: 'N/A',
                zip: '00000',
                country: 'Local',
                ...shippingAddress // Use provided info if available
            };
        } else {
            // --- ONLINE LOGIC: Enforce strict validation ---
            if (!shippingAddress) {
                return res.status(400).json({ success: false, message: 'Shipping address is required' });
            }
            
            const { fullName, address, city, zip } = shippingAddress;
            if (!fullName || !address || !city || !zip) {
                return res.status(400).json({ success: false, message: 'All shipping address fields are required' });
            }
            
            if (fullName.trim().length < 2) return res.status(400).json({ success: false, message: 'Full name too short' });
            if (address.trim().length < 5) return res.status(400).json({ success: false, message: 'Address too short' });
        }
        
        let totalAmount = 0;
        let orderItems = [];

        // 3. Stock Validation & Deduction
        for (const item of cartItems) {
            if (!item._id || !item.qty) {
                return res.status(400).json({ success: false, message: 'Invalid cart item format' });
            }
            
            const qty = Number(item.qty);
            if (isNaN(qty) || qty < 1) {
                return res.status(400).json({ success: false, message: 'Quantity must be positive' });
            }
            
            const product = await Product.findById(item._id);
            
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.itemName || 'Unknown Item'}` });
            }
            
            if (product.stockCount < qty) {
                return res.status(400).json({ success: false, message: `Insufficient stock for: ${product.itemName}` });
            }

            // Deduct Stock
            product.stockCount -= qty;
            await product.save();
            
            totalAmount += product.price * qty;
            orderItems.push({
                product: product._id,
                itemName: product.itemName,
                price: product.price,
                qty: qty
            });
        }

        // 4. Calculate Final Price (Tax 10%)
        const tax = totalAmount * 0.10;
        const grandTotal = totalAmount + tax;

        // 5. Determine Status
        // POS orders are usually completed instantly (handed over)
        const orderStatus = (source === 'POS') ? 'Delivered' : 'Pending';
        
        // 6. Create Order
        const order = await Order.create({
            user: req.user.id, // Links to the Staff member (if POS) or Customer (if Online)
            items: orderItems,
            shippingAddress: finalShippingAddress,
            totalAmount: grandTotal,
            status: orderStatus
            // Note: If you added 'source' or 'buyerDetails' to your Mongoose Schema, add them here.
            // If not, Mongoose will ignore them, but the order still saves correctly.
        });

        // 7. Notify
        notifyClients(req, 'ORDER_NEW', `New ${source || 'Online'} Order: $${grandTotal.toFixed(2)}`);

        // 8. Response
        // Attach staff name for POS confirmation receipts
        const responseOrder = order.toObject();
        if (source === 'POS') responseOrder.processedBy = req.user.fullName; 

        res.status(201).json({ success: true, order: responseOrder });

    } catch (err) {
        console.error("Create Order Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ... (Keep getMyOrders, getAllOrders, updateOrderStatus, getDashboardStats exactly as they were) ...

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
        const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

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