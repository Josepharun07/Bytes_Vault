// seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const colors = require('colors'); // Optional

// Load Models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🔌 MongoDB Connected...'.green.inverse))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

// --- USER DATA ONLY ---
const users = [
    {
        fullName: 'System Admin',
        emailAddress: 'admin@example.com',
        accessKey: 'admin@test',
        privilegeLevel: 'admin'
    },
    {
        fullName: 'John Doe',
        emailAddress: 'john@example.com',
        accessKey: '123456',
        privilegeLevel: 'customer',
        shippingCoordinates: {
            street: '123 Tech Lane',
            city: 'Silicon Valley',
            zipCode: '94000',
            country: 'USA'
        }
    }
];

// --- LOGIC ---
const importData = async () => {
    try {
        // 1. Clear Database (Wipe everything clean)
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        console.log('🗑️  Old Data Destroyed...'.red.inverse);

        // 2. Hash Passwords & Create Users
        const hashedUsers = await Promise.all(users.map(async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.accessKey = await bcrypt.hash(user.accessKey, salt);
            return user;
        }));

        await User.insertMany(hashedUsers);
        console.log('👥 Admin & Customer Accounts Created...'.green.inverse);

        console.log('✅ SYSTEM RESET SUCCESSFUL'.green.bold);
        console.log('   -> Log in as admin@example.com to add products manually.');
        process.exit();

    } catch (err) {
        console.error(`${err}`.red.inverse);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('🔥 All Data Destroyed!'.red.bold);
        process.exit();
    } catch (err) {
        console.error(`${err}`.red.inverse);
        process.exit(1);
    }
};

// Handle Command Line Args
if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}