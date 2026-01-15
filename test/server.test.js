// test/server.test.js
const request = require('supertest');
const { expect } = require('chai');
const vaultApp = require('../server'); // Import our app

describe('🔹 Infrastructure & Server Health', () => {
    
    it('Should return 200 OK for the Health Check endpoint', async () => {
        const response = await request(vaultApp).get('/api/health');
        
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('systemStatus', 'Operational');
    });

    it('Should serve static files (e.g., return 404 for missing file, but not crash)', async () => {
        const response = await request(vaultApp).get('/non-existent-file.html');
        // Express static returns 404 by default for missing files
        expect(response.status).to.equal(404);
    });
});