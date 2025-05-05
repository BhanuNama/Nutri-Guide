const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
    it('should respond with a 200 status code', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
    });
});

// Additional tests can be added here