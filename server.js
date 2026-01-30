require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose'); // Added for status check
const initiateDataLayer = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Share 'io' instance with controllers
app.set('io', io);

// 1. Database
initiateDataLayer();

// 2. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());
// Security: Allow scripts for our frontend logic
app.use(helmet({ contentSecurityPolicy: false }));

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// 4. System Health Check (Fixed to match admin.js)
app.get('/api/system/status', async (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    let latency = 0;

    // Calculate DB Latency
    if (isConnected) {
        const start = Date.now();
        try {
            await mongoose.connection.db.admin().ping();
            latency = Date.now() - start;
        } catch (e) {
            latency = -1;
        }
    }

    res.status(200).json({ 
        connected: isConnected,
        dbStatus: isConnected ? 'Connected' : 'Disconnected', 
        activeConnections: io.engine.clientsCount,
        uptime: process.uptime(),
        latency: latency,
        totalDocuments: 'Check DB', // Placeholder to save performance
        environment: process.env.NODE_ENV || 'development'
    });
});

// 5. Serve Frontend
app.use(express.static(path.join(__dirname, 'public')));

// 6. Global Error Handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Internal Server Error' 
    });
});

// 7. Server Activation
const SYSTEM_PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${SYSTEM_PORT}`;

if (require.main === module) {
    server.listen(SYSTEM_PORT, () => {
        console.log(`\x1b[33m%s\x1b[0m`, `--------------------------------------------------`);
        console.log(`\x1b[1m%s\x1b[0m`, `📡 ENVIRONMENT:  ${process.env.NODE_ENV || 'development'}`);
        console.log(`\x1b[1m%s\x1b[0m`, `🔌 PORT:         ${SYSTEM_PORT}`);
        console.log(`\x1b[1m%s\x1b[0m`, `📡 SOCKET.IO:    Active`);
        console.log(`\x1b[33m%s\x1b[0m`, `--------------------------------------------------`);
        
        console.log(`\x1b[35m%s\x1b[0m`, `🔗 AVAILABLE ACCESS POINTS (Ctrl + Click to Open):`);
        
        // --- CUSTOMER LINKS ---
        console.log(`    Home:         \x1b[34m${BASE_URL}/\x1b[0m`);
        console.log(`    Shop:         \x1b[34m${BASE_URL}/shop.html\x1b[0m`);
        console.log(`    Cart:         \x1b[34m${BASE_URL}/cart.html\x1b[0m`);
        
        // --- AUTH LINKS ---
        console.log(`\n    Login:        \x1b[34m${BASE_URL}/login.html\x1b[0m`);
        console.log(`    Register:     \x1b[34m${BASE_URL}/register.html\x1b[0m`);
        
        // --- ADMIN LINKS ---
        console.log(`\n    Admin Panel:  \x1b[34m${BASE_URL}/dashboard.html\x1b[0m`);
        
        // --- API LINKS ---
        console.log(`\n    API Health:   \x1b[34m${BASE_URL}/api/system/status\x1b[0m`);
        console.log(`\x1b[33m%s\x1b[0m`, `--------------------------------------------------\n`);
    });
}

module.exports = app;