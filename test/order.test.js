// test/order.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

describe('🛒 Checkout & Transactions', () => {
    let customerToken, adminToken, productId;

    before(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});

        // 1. Create ADMIN
        const adminRes = await request(vaultApp).post('/api/auth/register').send({
            fullName: "Admin", email: "admin@stock.com", password: "123", role: "admin"
        });
        adminToken = adminRes.body.token;

        // 2. Create CUSTOMER
        const userRes = await request(vaultApp).post('/api/auth/register').send({
            fullName: "Buyer", email: "buyer@test.com", password: "123", role: "customer"
        });
        customerToken = userRes.body.token;

        // 3. Create Product
        const prodRes = await request(vaultApp)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .field('name', "Test GPU")
            .field('sku', "GPU-TEST")
            .field('price', 100)
            .field('stock', 10)
            .field('category', "GPU")
            .field('description', "desc");
        
        const productData = prodRes.body.data || prodRes.body.product;
        if (!productData) throw new Error("Failed to create product in Setup");
        
        productId = productData._id;
    });

    it('Should place order and deduct stock', async () => {
        const res = await request(vaultApp)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                cartItems: [{ _id: productId, qty: 2, itemName: "Test GPU", price: 100 }],
                shippingAddress: { address: "123 St" }
            });

        expect(res.status).to.equal(201);
        
        const product = await Product.findById(productId);
        expect(product.stockCount).to.equal(8); 
    });

    it('Should fail if requesting more than stock', async () => {
        const res = await request(vaultApp)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                // --- FIX 3: Added itemName to prevent "undefined" error message ---
                cartItems: [{ _id: productId, qty: 100, itemName: "Test GPU" }], 
                shippingAddress: { address: "123 St" }
            });

        expect(res.status).to.equal(400);
        // Expect specific string from updated controller
        expect(res.body.message).to.include('Insufficient stock');
    });
});