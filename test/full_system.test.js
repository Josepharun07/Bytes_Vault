// test/full_system.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const fs = require('fs');
const path = require('path');

describe('🚀 Full System E2E (Orders & Admin)', () => {
    let customerToken, adminToken, productId, orderId;

    before(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});

        // Dummy image
        const dummyPath = path.join(__dirname, 'test-image.jpg');
        if (!fs.existsSync(dummyPath)) fs.writeFileSync(dummyPath, 'fake');

        // 1. Setup Admin
        const adminRes = await request(vaultApp).post('/api/auth/register').send({
            fullName: "Admin", email: "admin@system.com", password: "123", role: "admin"
        });
        adminToken = adminRes.body.token;

        // 2. Setup Customer
        const userRes = await request(vaultApp).post('/api/auth/register').send({
            fullName: "Buyer", email: "buyer@system.com", password: "123", role: "customer"
        });
        customerToken = userRes.body.token;

        // 3. Create Product
        const prodRes = await request(vaultApp)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .attach('image', dummyPath)
            .field('name', 'Stock Test Item')
            .field('sku', 'TEST-001')
            .field('price', 100)
            .field('stock', 10)
            .field('category', 'Peripheral')
            .field('description', 'desc');
        
        // CRITICAL FIX
        const productData = prodRes.body.data || prodRes.body.product;
        if(!productData) {
            console.error("Setup Product Create Failed:", prodRes.body);
            throw new Error("Setup failed");
        }
        productId = productData._id;
    });

    after(() => {
        const dummyPath = path.join(__dirname, 'test-image.jpg');
        if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    });

    it('1. Customer places an Order (Stock deduction check)', async () => {
        const res = await request(vaultApp)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                cartItems: [{ _id: productId, qty: 2, itemName: 'Stock Test Item', price: 100 }],
                shippingAddress: { fullName: "Buyer", address: "123 St" }
            });

        if(res.status !== 201) console.log("Order Failed:", res.body);
        expect(res.status).to.equal(201);
        orderId = res.body.order._id;

        const product = await Product.findById(productId);
        expect(product.stockCount).to.equal(8);
    });

    it('2. Admin views All Orders', async () => {
        const res = await request(vaultApp)
            .get('/api/orders/admin/all')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.an('array');
        expect(res.body.data.length).to.equal(1);
    });

    it('3. Admin updates Order Status to "Shipped"', async () => {
        const res = await request(vaultApp)
            .put(`/api/orders/admin/${orderId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'Shipped' });

        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal('Order updated');
    });

    it('4. Customer views their Profile (Checks status update)', async () => {
        const res = await request(vaultApp)
            .get('/api/orders/myorders')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.data[0].status).to.equal('Shipped');
    });
});