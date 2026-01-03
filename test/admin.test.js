const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../server');
const Admin = require('../models/Admin');
const User = require('../models/User');

let server;
let superToken;
let userId;
let adminId;

describe('Admin Management API Integration Tests', function () {
    this.timeout(10000);

    before(async () => {
        try {
            server = app.listen(0);

            // Start DB wait
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(process.env.MONGO_URI);
            }

            // Clean DB
            await Admin.deleteMany({});
            await User.deleteMany({});

            // Create Super Admin
            const superAdmin = await Admin.create({
                name: 'Super Admin',
                email: 'super@test.com',
                password: 'password123',
                department: 'Management',
                role: 'superadmin'
            });
            const res = await request(server)
                .post('/api/admins/login')
                .send({ email: 'super@test.com', password: 'password123' });

            if (res.status !== 200) {
                throw new Error("Login failed");
            }

            superToken = res.body.token;
        } catch (e) {
            console.error("BEFORE HOOK ERROR:", e);
            throw e;
        }
    });

    after(async () => {
        server.close();
    });

    describe('User Promotion (User -> Admin)', () => {
        it('should create a user first', async () => {
            const res = await request(server)
                .post('/api/auth/register')
                .send({ name: 'Promote Me', email: 'promote@test.com', password: 'password123', address: 'Nowhere' });
            expect(res.status).to.equal(201);
            userId = res.body.data.id;
        });

        it('should allow Super Admin to promote user', async () => {
            const res = await request(server)
                .post(`/api/admins/promote/${userId}`)
                .set('Authorization', `Bearer ${superToken}`)
                .send({ department: 'Sales' });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
        });

        it('should verify User is removed and Admin exists', async () => {
            // Check User gone
            const user = await User.findById(userId);
            expect(user).to.be.null;

            // Check Admin exists with same email
            const admin = await Admin.findOne({ email: 'promote@test.com' });
            expect(admin).to.not.be.null;
            expect(admin.department).to.equal('Sales');
            expect(admin.role).to.equal('admin');
            adminId = admin._id;
        });
    });

    describe('Admin Demotion (Admin -> User)', () => {
        it('should allow Super Admin to demote admin', async () => {
            const res = await request(server)
                .post(`/api/admins/demote/${adminId}`)
                .set('Authorization', `Bearer ${superToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
        });

        it('should verify Admin is removed and User exists', async () => {
            // Check Admin gone
            const admin = await Admin.findById(adminId);
            expect(admin).to.be.null;

            // Check User exists
            const user = await User.findOne({ email: 'promote@test.com' });
            expect(user).to.not.be.null;
            expect(user.role).to.equal('user');
        });
    });
});
