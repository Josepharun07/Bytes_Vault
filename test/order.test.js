// test/order.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

describe('🛒 Checkout & Transactions', () => {
    let token, productId;

    before(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});

        // 1. Create User
        const userRes = await request(vaultApp).post('/api/auth/register').send({
            fullName: "Buyer", email: "buyer@test.com", password: "123"
        });
        token = userRes.body.token;

        // 2. Create Product (Stock: 10)
        const prodRes = await request(vaultApp).post('/api/products').send({
            name: "Test GPU", sku: "GPU-TEST", price: 100, stock: 10, category: "GPU", description: "desc"
        });
        productId = prodRes.body.product._id;
    });

    it('Should place order and deduct stock', async () => {
        const res = await request(vaultApp)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                cartItems: [{ _id: productId, qty: 2 }],
                shippingAddress: { address: "123 St" }
            });

        expect(res.status).to.equal(201);
        
        // Check DB Stock
        const product = await Product.findById(productId);
        expect(product.stockCount).to.equal(8); // 10 - 2 = 8
    });

    it('Should fail if requesting more than stock', async () => {
        const res = await request(vaultApp)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                cartItems: [{ _id: productId, qty: 100 }], // Only 8 left
                shippingAddress: { address: "123 St" }
            });

        expect(res.status).to.equal(400);
        expect(res.body.message).to.include('Insufficient stock');
    });
});