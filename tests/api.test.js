import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

describe('API Endpoints', () => {
    it('GET /api/tasks should return prepopulated array initially', async () => {
        const res = await request(app).get('/api/tasks');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.length >= 3);
    });

    it('POST /api/tasks should create a new task', async () => {
        const payload = { title: 'Test Task' };
        const res = await request(app)
            .post('/api/tasks')
            .send(payload);
            
        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.title, 'Test Task');
        assert.ok(res.body.data.id);
    });
});
