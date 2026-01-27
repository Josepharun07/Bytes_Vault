// test/auth.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('🔐 Authentication Logic', () => {

    // Clean DB before running tests
    before(async () => {
        await User.deleteMany({});
    });

    after(async () => {
        await User.deleteMany({});
    });

    let validUser = {
        fullName: "Test Pilot",
        email: "pilot@bytesvault.com",
        password: "securePassword123",
        role: "admin"
    };

    it('Should register a new user successfully (201)', async () => {
        const res = await request(vaultApp)
            .post('/api/auth/register')
            .send(validUser);

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('token');
        expect(res.body.member).to.have.property('role', 'admin');
    });

    it('Should login the registered user (200)', async () => {
        const res = await request(vaultApp)
            .post('/api/auth/login')
            .send({
                email: validUser.email,
                password: validUser.password
            });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
    });

    it('Should reject incorrect password (401)', async () => {
        const res = await request(vaultApp)
            .post('/api/auth/login')
            .send({
                email: validUser.email,
                password: "wrongPassword"
            });

        expect(res.status).to.equal(401);
    });
});