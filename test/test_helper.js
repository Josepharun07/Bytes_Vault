// test/test_helper.js

// 1. Force the environment to 'test' programmatically (Cross-platform fix)
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
require('dotenv').config();

// Ensure we don't connect to the Production DB for tests if a test-specific one is available
const DB_URI = process.env.MONGO_URI;

before(async () => {
    // Prevent duplicate connections
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(DB_URI);
    }
});

after(async () => {
    // Close connection after tests finish
    await mongoose.disconnect();
});