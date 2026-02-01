const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

describe('🛒 Orders & POS System', () => {
    let customerToken, staffToken, adminToken;
    let productId;

    before(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});

        // 1. Setup Roles
        const adminRes = await request(app).post('/api/auth/register').send({ fullName: "Admin", email: "admin@o.com", password: "123", role: "admin" });
        adminToken = adminRes.body.token;

        const staffRes = await request(app).post('/api/auth/register').send({ fullName: "Staff", email: "staff@o.com", password: "123", role: "staff" });
        staffToken = staffRes.body.token;

        const custRes = await request(app).post('/api/auth/register').send({ fullName: "Buyer", email: "buyer@o.com", password: "123", role: "customer" });
        customerToken = custRes.body.token;

        // 2. Create Product
        const prod = await Product.create({
            itemName: "Test Mouse",
            sku: "MOUSE-01",
            price: 50,
            stockCount: 100,
            category: "Peripheral",
            description: "Clicky mouse"
        });
        productId = prod._id;
    });

    it('1. Customer places ONLINE Order', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                cartItems: [{ _id: productId, qty: 1, itemName: "Test Mouse", price: 50 }],
                shippingAddress: { fullName: "Buyer", address: "123 Web St", city: "Net", zip: "000" },
                source: "Online"
            });

        expect(res.status).to.equal(201);
        expect(res.body.order.status).to.equal('Pending');
        expect(res.body.order.source).to.equal('Online');
    });

    it('2. Staff processes POS Order', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                cartItems: [{ _id: productId, qty: 2, itemName: "Test Mouse", price: 50 }],
                shippingAddress: {}, // POS doesn't require strict address
                source: "POS",
                buyerDetails: { name: "Walk-in Guy", email: "walkin@test.com" }
            });

        expect(res.status).to.equal(201);
        expect(res.body.order.status).to.equal('Completed'); // POS orders auto-complete
        expect(res.body.order.source).to.equal('POS');
        expect(res.body.order.processedBy).to.exist; // Check if staff name attached
    });

    it('3. Admin checks Dashboard Stats', async () => {
        const res = await request(app)
            .get('/api/orders/admin/stats')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        // 1 Online (50) + 1 POS (100) + Tax (10%) = approx 165
        expect(res.body.stats.revenue).to.be.greaterThan(0);
        expect(res.body.stats.orders).to.equal(2);
    });
});