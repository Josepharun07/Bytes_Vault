require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const initiateDataLayer = require('./config/db');

// --- CRITICAL: Import Models for Stats ---
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Share 'io' instance
app.set('io', io);

// 1. Database
initiateDataLayer();

// 2. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// 4. System Health & Stats Endpoint (FIXED)
app.get('/api/system/status', async (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    let latency = 0;
    let totalDocs = 0; // Default to 0

    if (isConnected) {
        try {
            // 1. Check Latency
            const start = Date.now();
            await mongoose.connection.db.admin().ping();
            latency = Date.now() - start;

            // 2. Count Documents (Safe Promise.all)
            const [userCount, prodCount, orderCount] = await Promise.all([
                User.countDocuments().catch(() => 0),     // If fails, return 0
                Product.countDocuments().catch(() => 0),  // If fails, return 0
                Order.countDocuments().catch(() => 0)     // If fails, return 0
            ]);
            
            totalDocs = userCount + prodCount + orderCount;

        } catch (e) {
            console.error("Stats Error:", e);
            latency = -1;
            totalDocs = 0; // Fallback
        }
    }

    res.status(200).json({ 
        connected: isConnected,
        dbStatus: isConnected ? 'Connected' : 'Disconnected', 
        activeConnections: io.engine.clientsCount,
        uptime: process.uptime(),
        latency: latency,
        totalDocuments: totalDocs, // <-- Sends the number here
        environment: process.env.NODE_ENV || 'development'
    });
});

// 5. Serve Frontend
app.use(express.static(path.join(__dirname, 'public')));

// 6. Global Error Handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

// 7. Start
const SYSTEM_PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${SYSTEM_PORT}`;

if (require.main === module) {
    server.listen(SYSTEM_PORT, () => {
        console.log(`\n🚀 Bytes Vault Running`);
        console.log(`🔗 ${BASE_URL}`);
    });
}

module.exports = app;