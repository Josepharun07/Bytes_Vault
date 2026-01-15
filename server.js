// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const initiateDataLayer = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

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

if (require.main === module) {
    vaultApp.listen(SYSTEM_PORT, () => {
        console.log(`🚀 BytesVault Engine running on port ${SYSTEM_PORT}`);
    });
}

module.exports = vaultApp; // Export for Testingnode