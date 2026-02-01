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

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// App & Server Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Share 'io' instance with controllers
app.set('io', io);

// 1. Database Connection
initiateDataLayer();

// 2. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());
// Security: Disable CSP to allow inline scripts in this specific project
app.use(helmet({ contentSecurityPolicy: false }));

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// 4. System Health API (Used by Admin Dashboard)
app.get('/api/system/status', async (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    let latency = 0;
    
    if (isConnected) {
        const start = Date.now();
        try {
            await mongoose.connection.db.admin().ping();
            latency = Date.now() - start;
        } catch (e) { latency = -1; }
    }

    res.status(200).json({ 
        connected: isConnected,
        dbStatus: isConnected ? 'Connected' : 'Disconnected', 
        activeConnections: io.engine.clientsCount,
        uptime: process.uptime(),
        latency: latency,
        environment: process.env.NODE_ENV || 'development'
    });
});

// 5. Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// 6. Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

// 7. Start
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`\n🚀 Bytes Vault Running on Port ${PORT}`);
        console.log(`🔗 http://localhost:${PORT}`);
    });
}

module.exports = app;