const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../server');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Product = require('../models/Product');

let server;
let adminToken;
let userToken;
let productId;

describe('Product API Integration Tests', function () {
    this.timeout(10000);

    before(async () => {
        // Start ephemeral server
        server = app.listen(0);

        // Clean DB
        await Admin.deleteMany({});
        await User.deleteMany({});
        await Product.deleteMany({});

        // Create Admin
        const admin = await Admin.create({
            name: 'Test Admin',
            email: 'admin@test.com',
            password: 'password123',
            department: 'IT',
            role: 'admin'
        });
        const adminRes = await request(server)
            .post('/api/admins/login')
            .send({ email: 'admin@test.com', password: 'password123' });
        adminToken = adminRes.body.token;

        // Create User
        await request(server)
            .post('/api/auth/register')
            .send({ name: 'Test User', email: 'user@test.com', password: 'password123', address: '123 St' });
        const userRes = await request(server)
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });
        userToken = userRes.body.token;
    });

    after(async () => {
        server.close();
    });

    describe('POST /api/products', () => {
        it('should allow Admin to create a product', async () => {
            const res = await request(server)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Product',
                    price: 100,
                    stock: 50,
                    description: 'A great product',
                    imageUrl: 'http://img.com/1.jpg'
                });
            expect(res.status).to.equal(201);
            expect(res.body.success).to.be.true;
            productId = res.body.data._id;
        });

        it('should NOT allow User to create a product', async () => {
            const res = await request(server)
                .post('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Hacked Product',
                    price: 1,
                    stock: 1
                });
            // 403 Forbidden because User is found but role is not admin
            expect(res.status).to.equal(403);
        });
    });

    describe('GET /api/products', () => {
        it('should allow anyone to get products', async () => {
            const res = await request(server).get('/api/products');
            expect(res.status).to.equal(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.be.greaterThan(0);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should allow Admin to update a product', async () => {
            const res = await request(server)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 150 });
            expect(res.status).to.equal(200);
            expect(res.body.data.price).to.equal(150);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should allow Admin to delete a product', async () => {
            const res = await request(server)
                .delete(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).to.equal(200);
        });

        it('should confirm product is gone', async () => {
            const res = await request(server).get('/api/products');
            // Should be empty or not contain that ID
            const product = res.body.data.find(p => p._id === productId);
            expect(product).to.be.undefined;
        });
    });
});
