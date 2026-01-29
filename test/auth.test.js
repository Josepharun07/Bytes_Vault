// test/auth.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server');
const User = require('../models/User');

describe('🔐 Authentication Module', () => {
    
    // Clear Users before testing
    before(async () => {
        await User.deleteMany({});
    });

    const adminUser = {
        fullName: "Super Admin",
        email: "admin@test.com",
        password: "password123",
        role: "admin"
    };

    let adminToken;

    // --- UNIT / INTEGRATION TESTS ---

    it('1. Should register a new Admin user (201)', async () => {
        const res = await request(vaultApp)
            .post('/api/auth/register')
            .send(adminUser);

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body).to.have.property('token');
        expect(res.body).to.have.property('role', 'admin');
        
        adminToken = res.body.token; // Save for later
    });

    it('2. Should prevent duplicate emails (400)', async () => {
        const res = await request(vaultApp)
            .post('/api/auth/register')
            .send(adminUser);

        expect(res.status).to.equal(400);
        expect(res.body.message).to.include('Email taken');
    });

    it('3. Should login successfully with correct credentials (200)', async () => {
        const res = await request(vaultApp)
            .post('/api/auth/login')
            .send({
                email: adminUser.email,
                password: adminUser.password
            });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
    });

    it('4. Should reject incorrect password (401)', async () => {
        const res = await request(vaultApp)
            .post('/api/auth/login')
            .send({
                email: adminUser.email,
                password: "wrongpassword"
            });

        expect(res.status).to.equal(401);
    });
});