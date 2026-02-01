const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

describe('📦 Product Inventory Module', () => {
    let adminToken;
    let productId;
    const dummyImagePath = path.join(__dirname, 'temp_test_image.jpg');

    before(async () => {
        await Product.deleteMany({});
        await User.deleteMany({});

        // Create Admin for Access
        const res = await request(app).post('/api/auth/register').send({
            fullName: "Admin", email: "admin@prod.com", password: "123", role: "admin"
        });
        adminToken = res.body.token;

        // Create Dummy Image
        fs.writeFileSync(dummyImagePath, 'fake image content');
    });

    after(() => {
        // Cleanup Dummy Image
        if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);
    });

    it('1. Admin should Create a Product with Image', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .attach('image', dummyImagePath) // Simulates File Upload
            .field('name', 'RTX 5090')
            .field('sku', 'GPU-5090')
            .field('price', 2000)
            .field('stock', 5)
            .field('category', 'GPU')
            .field('description', 'Next gen graphics card')
            .field('specs', '{"VRAM":"32GB"}');

        expect(res.status).to.equal(201);
        expect(res.body.product).to.have.property('itemName', 'RTX 5090');
        expect(res.body.product.images).to.be.an('array');
        productId = res.body.product._id;
    });

    it('2. Should Fetch Catalog (Search & Filter)', async () => {
        const res = await request(app)
            .get('/api/products?search=RTX&category=GPU');
        
        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.an('array');
        expect(res.body.data.length).to.equal(1);
    });

    it('3. Should Prevent Duplicate SKU', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .attach('image', dummyImagePath)
            .field('name', 'Another GPU')
            .field('sku', 'GPU-5090') // Same SKU
            .field('price', 2000)
            .field('stock', 5)
            .field('category', 'GPU')
            .field('description', 'Desc');

        expect(res.status).to.equal(400);
        expect(res.body.message).to.include('SKU already exists');
    });

    it('4. Admin should Delete Product', async () => {
        const res = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        
        const check = await Product.findById(productId);
        expect(check).to.be.null;
    });
});