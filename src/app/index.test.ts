import request from 'supertest';

import app from './index';

describe('app tests', () => {
    it('should render 404 on unfound route', async () => {
        const { status } = await request(app).patch('/bogus-route');
        expect(status).toStrictEqual(404);
    });
});
