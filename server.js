// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const initiateDataLayer = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');


const userRoutes = require('./routes/userRoutes');



// Initialize App
const vaultApp = express();

// 1. Connect to Database
initiateDataLayer();

// 2. Middleware Pipeline
vaultApp.use(express.json()); // Parse JSON bodies
vaultApp.use(express.urlencoded({ extended: true }));

//vaultApp.use(helmet()); // Security Headers

vaultApp.use(morgan('dev')); // Logger
vaultApp.use('/api/auth', authRoutes); 
vaultApp.use('/api/products', productRoutes); 

// 3. Serve Static UI (The Vanilla Frontend)
// This serves everything in /public as if it were the root
vaultApp.use(express.static(path.join(__dirname, 'public')));

// 4. Basic Health Check Route
vaultApp.get('/api/health', (req, res) => {
    res.status(200).json({ 
        systemStatus: 'Operational', 
        timestamp: new Date() 
    });
});

vaultApp.use('/api/auth', require('./routes/authRoutes'));

vaultApp.use('/api/products', productRoutes);
vaultApp.use('/api/orders', orderRoutes);

vaultApp.use('/api/products', require('./routes/productRoutes'));
vaultApp.use('/api/orders', orderRoutes);
vaultApp.use('/api/users', userRoutes);


// 5. Global Error Handler
vaultApp.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        errorType: 'InternalServerError', 
        message: 'The vault encountered an unexpected issue.' 
    });
});

// 6. Server Activation
const SYSTEM_PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${SYSTEM_PORT}`;

if (require.main === module) {
    vaultApp.listen(SYSTEM_PORT, () => {
        // Clear console for a fresh view (optional)
        // console.clear(); 

        console.log(`\n\x1b[36m%s\x1b[0m`, `🚀 Bytes Vault Engine Online`);
        console.log(`\x1b[33m%s\x1b[0m`, `--------------------------------------------------`);
        console.log(`\x1b[1m%s\x1b[0m`, `📡 ENVIRONMENT:  ${process.env.NODE_ENV || 'development'}`);
        console.log(`\x1b[1m%s\x1b[0m`, `🔌 PORT:         ${SYSTEM_PORT}`);
        console.log(`\x1b[33m%s\x1b[0m`, `--------------------------------------------------`);
        
        console.log(`\x1b[35m%s\x1b[0m`, `🔗 AVAILABLE ACCESS POINTS (Ctrl + Click to Open):`);
        
        // --- CUSTOMER LINKS ---
        console.log(`   🏠 Home:         \x1b[34m${BASE_URL}/\x1b[0m`);
        console.log(`   🛍️  Shop:         \x1b[34m${BASE_URL}/shop.html\x1b[0m`);
        console.log(`   🛒 Cart:         \x1b[34m${BASE_URL}/cart.html\x1b[0m`); // We will build this next
        
        // --- AUTH LINKS ---
        console.log(`\n   🔑 Login:        \x1b[34m${BASE_URL}/login.html\x1b[0m`);
        console.log(`   📝 Register:     \x1b[34m${BASE_URL}/register.html\x1b[0m`);
        
        // --- ADMIN LINKS ---
        console.log(`\n   🛡️  Admin Panel:  \x1b[34m${BASE_URL}/dashboard.html\x1b[0m`);
        
        // --- API LINKS ---
        console.log(`\n   ⚙️  API Health:   \x1b[34m${BASE_URL}/api/health\x1b[0m`);
        console.log(`\x1b[33m%s\x1b[0m`, `--------------------------------------------------\n`);
    });
}

module.exports = vaultApp;