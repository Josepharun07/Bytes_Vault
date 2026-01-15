// test/product.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server');
const Product = require('../models/Product');

describe('📦 Inventory Management', () => {

    before(async () => {
        await Product.deleteMany({});
    });

    let newProduct = {
        name: "Gaming Mouse",
        sku: "MS-001",
        price: 50,
        stock: 100,
        category: "Peripheral",
        description: "High DPI Mouse"
    };

    let createdId;

    it('Should create a new product (201)', async () => {
        const res = await request(vaultApp)
            .post('/api/products')
            .send(newProduct); // Note: We aren't testing image upload here to keep it simple

        expect(res.status).to.equal(201);
        expect(res.body.product).to.have.property('sku', 'MS-001');
        createdId = res.body.product._id;
    });

    it('Should fetch all products (200)', async () => {
        const res = await request(vaultApp).get('/api/products');
        
        expect(res.status).to.equal(200);
        expect(res.body.count).to.equal(1);
    });

    it('Should delete the product (200)', async () => {
        const res = await request(vaultApp).delete(`/api/products/${createdId}`);
        expect(res.status).to.equal(200);
    });
});