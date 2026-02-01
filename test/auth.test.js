const request = require('supertest');
const { expect } = require('chai');
const app = require('../server'); // Import the Express App
const User = require('../models/User');

describe('🔐 Authentication System', () => {
    
    before(async () => {
        await User.deleteMany({}); // Clear users
    });

    const adminUser = {
        fullName: "Super Admin",
        email: "admin@test.com",
        password: "password123",
        role: "admin"
    };

    const staffUser = {
        fullName: "Staff Member",
        email: "staff@test.com",
        password: "password123",
        role: "staff"
    };

    it('1. Should Register an Admin User', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(adminUser);
        
        expect(res.status).to.equal(201);
        expect(res.body.role).to.equal('admin');
        expect(res.body).to.have.property('token');
    });

    it('2. Should Prevent Duplicate Emails', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(adminUser);
        
        expect(res.status).to.equal(400);
        expect(res.body.message).to.include('Email taken');
    });

    it('3. Should Login Successfully', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: adminUser.email, password: adminUser.password });
        
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
    });

    it('4. Should Register a Staff Member', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(staffUser);
        
        expect(res.status).to.equal(201);
        expect(res.body.role).to.equal('staff');
    });
});