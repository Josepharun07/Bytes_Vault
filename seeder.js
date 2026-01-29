// seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const colors = require('colors'); // Optional: npm install colors for pretty logs

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

// --- DATA ---

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
    },
    {
        fullName: 'Jane Smith',
        emailAddress: 'jane@example.com',
        accessKey: '123456',
        privilegeLevel: 'customer'
    }
];

const products = [
    {
        itemName: 'NVIDIA RTX 4090',
        sku: 'GPU-4090-OC',
        price: 1599.99,
        stockCount: 15,
        category: 'GPU',
        description: 'The ultimate GeForce GPU. A huge leap in performance, efficiency, and AI-powered graphics.',
        imageUrl: 'uploads/products/no-image.jpg',
        specs: { "VRAM": "24GB", "Bus": "384-bit", "Clock": "2.5GHz" }
    },
    {
        itemName: 'Intel Core i9-13900K',
        sku: 'CPU-INT-139',
        price: 589.00,
        stockCount: 50,
        category: 'CPU',
        description: '24 cores (8 P-cores + 16 E-cores) and 32 threads. Up to 5.8 GHz unlocked.',
        imageUrl: 'uploads/products/no-image.jpg',
        specs: { "Cores": "24", "Socket": "LGA1700", "TDP": "125W" }
    },
    {
        itemName: 'MacBook Pro M2',
        sku: 'LAP-MAC-M2',
        price: 2499.00,
        stockCount: 8,
        category: 'Laptop',
        description: 'Supercharged by M2 Pro or M2 Max. Takes power and efficiency further than ever.',
        imageUrl: 'uploads/products/no-image.jpg',
        specs: { "Screen": "16-inch", "Chip": "M2 Pro", "RAM": "32GB" }
    },
    {
        itemName: 'Corsair K95 RGB',
        sku: 'PER-K95-RGB',
        price: 199.99,
        stockCount: 4, // Low stock test
        category: 'Peripheral',
        description: 'Platinum Mechanical Gaming Keyboard with Cherry MX Speed switches.',
        imageUrl: 'uploads/products/no-image.jpg',
        specs: { "Switch": "Cherry MX", "Backlight": "RGB" }
    },
    {
        itemName: 'Samsung 980 PRO 2TB',
        sku: 'STO-SSD-2TB',
        price: 169.99,
        stockCount: 100,
        category: 'Storage',
        description: 'PCIe 4.0 NVMe SSD for next-level computing.',
        imageUrl: 'uploads/products/no-image.jpg',
        specs: { "Capacity": "2TB", "Read Speed": "7000 MB/s" }
    }
];

// --- LOGIC ---

const importData = async () => {
    try {
        // 1. Clear Database
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        console.log('🗑️  Data Destroyed...'.red.inverse);

        // 2. Hash Passwords & Create Users
        const hashedUsers = await Promise.all(users.map(async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.accessKey = await bcrypt.hash(user.accessKey, salt);
            return user;
        }));

        const createdUsers = await User.insertMany(hashedUsers);
        const adminUser = createdUsers[0]._id;
        const customerUser = createdUsers[1]._id;
        console.log('👥 Users Imported...'.green.inverse);

        // 3. Create Products
        const createdProducts = await Product.insertMany(products);
        console.log('📦 Products Imported...'.green.inverse);

        // 4. Create Dummy Orders (For Dashboard Stats)
        // Order 1: Admin bought a CPU
        const order1 = new Order({
            user: customerUser,
            items: [{
                product: createdProducts[1]._id,
                itemName: createdProducts[1].itemName,
                price: createdProducts[1].price,
                qty: 1
            }],
            shippingAddress: { fullName: "John Doe", address: "123 Main St", city: "NY", zip: "10001" },
            totalAmount: 647.90, // with tax
            status: 'Delivered',
            createdAt: new Date('2023-10-01') // Backdated for chart variety
        });

        // Order 2: Customer bought a GPU
        const order2 = new Order({
            user: customerUser,
            items: [{
                product: createdProducts[0]._id,
                itemName: createdProducts[0].itemName,
                price: createdProducts[0].price,
                qty: 1
            }],
            shippingAddress: { fullName: "John Doe", address: "123 Main St", city: "NY", zip: "10001" },
            totalAmount: 1759.99,
            status: 'Pending'
        });

        await Order.insertMany([order1, order2]);
        console.log('🚚 Orders Imported...'.green.inverse);

        console.log('✅ DATA IMPORTED SUCCESSFULLY'.green.bold);
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

        console.log('🔥 Data Destroyed!'.red.bold);
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