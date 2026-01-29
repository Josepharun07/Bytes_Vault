// server.js
require('dotenv').config();
const express = require('express');
const http = require('http'); 
const { Server } = require("socket.io"); 
const path = require('path');
const morgan = require('morgan');
const mongoose = require('mongoose');
const initiateDataLayer = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize Express
const app = express();

// Create HTTP Server & Socket.io Instance
const server = http.createServer(app);
const io = new Server(server);

// Share 'io' instance with all routes/controllers
app.set('io', io);

// 1. Connect to Database
initiateDataLayer();

// 2. Middleware Pipeline
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); 

// 3. API Routes
app.use('/api/auth', authRoutes); 
app.use('/api/products', productRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// 4. Enhanced System Health Endpoint
app.get('/api/system/status', async (req, res) => {
    const statusMap = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting',
        99: 'Uninitialized'
    };
    
    const dbState = mongoose.connection.readyState;
    let dbLatency = 0;
    let totalDocs = 0;

    try {
        if (dbState === 1) {
            // Calculate DB Latency
            const start = Date.now();
            await mongoose.connection.db.admin().ping();
            dbLatency = Date.now() - start;

            // Get estimated total documents (User + Product + Order)
            const users = await mongoose.connection.db.collection('users').estimatedDocumentCount();
            const products = await mongoose.connection.db.collection('products').estimatedDocumentCount();
            const orders = await mongoose.connection.db.collection('orders').estimatedDocumentCount();
            totalDocs = users + products + orders;
        }
    } catch (e) {
        dbLatency = -1;
    }

    res.status(200).json({
        dbStatus: statusMap[dbState] || 'Unknown',
        connected: dbState === 1,
        latency: dbLatency,
        activeConnections: io.engine.clientsCount, // Count connected sockets
        uptime: process.uptime(), // Server uptime in seconds
        totalDocuments: totalDocs,
        environment: process.env.NODE_ENV || 'Development'
    });
});

// 5. Serve Static UI
app.use(express.static(path.join(__dirname, 'public')));

// 6. Socket.io Logic
io.on('connection', (socket) => {
    // console.log(`🔌 Client Connected [ID: ${socket.id}]`);
    
    // Broadcast connection count update to Admin immediately
    io.emit('system:metrics', { connections: io.engine.clientsCount });

    socket.on('disconnect', () => {
        // console.log(`❌ Client Disconnected [ID: ${socket.id}]`);
        io.emit('system:metrics', { connections: io.engine.clientsCount });
    });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        errorType: 'InternalServerError', 
        message: 'The vault encountered an unexpected issue.' 
    });
});

// 8. Server Activation
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