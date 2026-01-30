const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get Sales Trend (Last 7 Days)
// @route   GET /api/analytics/trend
exports.getSalesTrend = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trend = await Order.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: sevenDaysAgo },
                    status: { $ne: 'Cancelled' }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ success: true, data: trend });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get Sales by Category
// @route   GET /api/analytics/categories
exports.getCategorySales = async (req, res) => {
    try {
        // Unwind orders to get individual items, then lookup product details
        const stats = await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.category",
                    revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
                    unitsSold: { $sum: "$items.qty" }
                }
            }
        ]);

        res.status(200).json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get Top 5 Best Sellers
// @route   GET /api/analytics/top-products
exports.getTopProducts = async (req, res) => {
    try {
        const top = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.itemName",
                    qty: { $sum: "$items.qty" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
                }
            },
            { $sort: { qty: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({ success: true, data: top });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};