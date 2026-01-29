// test/product.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');

describe('📦 Product & Review Module', () => {
    let adminToken, userToken, productId;

    before(async () => {
        await Product.deleteMany({});
        await User.deleteMany({});

        // Create Admin
        const adminRes = await request(vaultApp).post('/api/auth/register').send({
            fullName: "Admin", email: "admin@prod.com", password: "123", role: "admin"
        });
        adminToken = adminRes.body.token;

        // Create User (For reviews)
        const userRes = await request(vaultApp).post('/api/auth/register').send({
            fullName: "Reviewer", email: "reviewer@prod.com", password: "123"
        });
        userToken = userRes.body.token;
    });

    it('1. Admin should create a Product (201)', async () => {
        const res = await request(vaultApp)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .field('name', 'Gaming Laptop')
            .field('sku', 'LAP-001')
            .field('price', 1200)
            .field('stock', 10)
            .field('category', 'Laptop')
            .field('description', 'Fast laptop')
            .field('specs', '{"RAM":"16GB"}');

        // DEBUG LOG IF FAILURE
        if(res.status !== 201) console.log("Product Create Failed:", res.body);

        expect(res.status).to.equal(201);
        
        // CRITICAL FIX: The controller returns { data: product }
        const product = res.body.data || res.body.product; 
        expect(product).to.exist;
        expect(product.itemName).to.equal('Gaming Laptop');
        
        productId = product._id; // Save ID for next tests
    });

    it('2. Customer should NOT be able to delete products (403)', async () => {
        // Ensure ID exists
        if(!productId) this.skip();

        const res = await request(vaultApp)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).to.equal(403);
    });

    it('3. Customer should be able to add a Review (201)', async () => {
        if(!productId) throw new Error("Previous test failed to create product");

        const res = await request(vaultApp)
            .post(`/api/products/${productId}/reviews`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                rating: 5,
                comment: "Amazing laptop!"
            });

        expect(res.status).to.equal(201);
        
        const product = await Product.findById(productId);
        expect(product.reviews.length).to.equal(1);
        expect(product.rating).to.equal(5);
    });

    it('4. Customer should NOT be able to review same product twice (400)', async () => {
        if(!productId) this.skip();

        const res = await request(vaultApp)
            .post(`/api/products/${productId}/reviews`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ rating: 1, comment: "Spam" });

        // If it returns 500, it usually means ID is wrong or server crashed. 
        // We expect 400 (Bad Request) handled by controller logic.
        expect(res.status).to.equal(400);
    });
});