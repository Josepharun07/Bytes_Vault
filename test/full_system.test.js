// test/full_system.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server'); // Your Express App
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

describe('🚀 Full System Integration Test (The Customer Journey)', function() {
    // Increase timeout for DB operations
    this.timeout(10000);

    let adminToken;
    let customerToken;
    let createdProductId;

    // 1. CLEANUP & SETUP
    before(async () => {
        // Clear DB so we start fresh
        await User.deleteMany({});
        await Product.deleteMany({});

        // Create a dummy image for testing uploads
        const dummyPath = path.join(__dirname, 'test-image.jpg');
        if (!fs.existsSync(dummyPath)) {
            fs.writeFileSync(dummyPath, 'fake image content');
        }
    });

    // 2. PRE-REQUISITE: ADMIN SETUP (To put items in the shop)
    describe('Step 0: Admin Setup (Prerequisite)', () => {
        it('Should register and login as Admin', async () => {
            // Register
            await request(vaultApp).post('/api/auth/register').send({
                fullName: "Super Admin",
                email: "admin@test.com",
                password: "admin123",
                role: "admin" // Our controller allows passing role logic
            });

            // Login
            const res = await request(vaultApp).post('/api/auth/login').send({
                email: "admin@test.com",
                password: "admin123"
            });

            expect(res.status).to.equal(200);
            adminToken = res.body.token; // SAVE TOKEN
        });

        it('Should allow Admin to upload a Product', async () => {
            const res = await request(vaultApp)
                .post('/api/products')
                // Attach file (simulating form upload)
                .attach('image', path.join(__dirname, 'test-image.jpg'))
                .field('name', 'RTX 4090 Test Edition')
                .field('sku', 'GPU-TEST-999')
                .field('price', 1599.99)
                .field('stock', 50)
                .field('category', 'GPU')
                .field('description', 'The ultimate testing GPU')
                .field('specs', '{"VRAM":"24GB"}');

            expect(res.status).to.equal(201);
            expect(res.body.product).to.have.property('itemName', 'RTX 4090 Test Edition');
            
            createdProductId = res.body.product._id; // SAVE ID
        });
    });

    // 3. THE CUSTOMER FLOW (Test B)
    describe('Step 1: Customer Registration', () => {
        it('Should register a new customer "John Doe"', async () => {
            const res = await request(vaultApp)
                .post('/api/auth/register')
                .send({
                    fullName: "John Doe",
                    email: "john@customer.com",
                    password: "customer123"
                });

            // --- DEBUGGING LOG ---
            if (res.status !== 201) {
                console.log("❌ REGISTRATION FAILED. Server Response:", res.body);
            }
            // ---------------------

            expect(res.status).to.equal(201);
            expect(res.body.success).to.be.true;
        });
    });

    describe('Step 2: Customer Login', () => {
        it('Should login and receive a Token', async () => {
            const res = await request(vaultApp)
                .post('/api/auth/login')
                .send({
                    email: "john@customer.com",
                    password: "customer123"
                });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('token');
            expect(res.body.role).to.equal('customer');
            
            customerToken = res.body.token; // SAVE CUSTOMER TOKEN
        });
    });

    describe('Step 3: Browse Shop', () => {
        it('Should fetch the product catalog', async () => {
            const res = await request(vaultApp)
                .get('/api/products'); // Public Endpoint

            expect(res.status).to.equal(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.be.greaterThan(0);
            expect(res.body.data[0].itemName).to.equal('RTX 4090 Test Edition');
        });

        it('Should filter products by Category (GPU)', async () => {
            const res = await request(vaultApp)
                .get('/api/products?category=GPU');

            expect(res.status).to.equal(200);
            expect(res.body.data.length).to.equal(1);
        });

        it('Should return empty for non-matching search', async () => {
            const res = await request(vaultApp)
                .get('/api/products?search=Banana');

            expect(res.body.data.length).to.equal(0);
        });
    });

    describe('Step 4: View Product Detail', () => {
        it('Should fetch details for the specific Product ID', async () => {
            // In a real app, we might have a specific ID route like /api/products/:id
            // But currently our fetchCatalog logic handles filtering or we can find it in the list
            
            // Note: Since we haven't explicitly built GET /api/products/:id yet
            // We will verify the data exists in the main list which simulates "Finding" it
            
            const res = await request(vaultApp).get('/api/products');
            const product = res.body.data.find(p => p._id === createdProductId);

            expect(product).to.exist;
            expect(product.itemName).to.equal('RTX 4090 Test Edition');
            expect(product.price).to.equal(1599.99);
            // Verify Specs were saved correctly
            // Note: Mongoose Maps convert to objects in JSON
            expect(product.specs).to.have.property('VRAM', '24GB');
        });
    });

    // Clean up the dummy file
    after(() => {
        const dummyPath = path.join(__dirname, 'test-image.jpg');
        if (fs.existsSync(dummyPath)) {
            fs.unlinkSync(dummyPath);
        }
    });
});