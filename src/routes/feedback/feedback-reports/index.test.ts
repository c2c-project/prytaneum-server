import express from 'express';
import request from 'supertest';
import faker from 'faker';
import { ObjectID } from 'mongodb';
import {
    makeUser,
    makeFeedbackReportForm,
    FeedbackReportForm,
    makeReportReplyForm,
    ReportReplyForm,
    User,
} from 'prytaneum-typings';

import * as DB from 'db/mongo';
import jwt from 'lib/jwt';
import config from 'config/app';
import { errorHandler } from 'middlewares';
import routes from '../index';

const app = express();

beforeAll(() => {
    jest.mock('db');
    config(app);
    app.use(routes);
    app.use(errorHandler());
});

afterEach(() => {
    jest.restoreAllMocks();
});

const user = makeUser() as User & { _id: string };
const feedbackReportForm = makeFeedbackReportForm();
const endpoint = '/feedback-reports';

describe('/feedback-reports', () => {
    describe('GET /', () => {
        it('should have status 200 since undefined sortByDate query parameter defaults to true', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce(0);
            collectionSpy.mockResolvedValueOnce([]);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=0`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(200);
        });
        it('should have status 200', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce(0);
            collectionSpy.mockResolvedValueOnce([]);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=1&sortByDate=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 if page number is negative', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=-1&sortByDate=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is big negative number', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=-135423652764745672745741235&sortByDate=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is infinite', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=${Number.POSITIVE_INFINITY}&sortByDate=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is string', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=${faker.random.word()}&sortByDate=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is random long string', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=${faker.random.words(80)}&sortByDate=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is empty', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=&sortByDate=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is undefined', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?sortByDate=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if sortByDae is random string ', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}?page=1&sortByDate=${faker.random.word()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 401 if there is no login cookie', async () => {
            const { status } = await request(app).get(`${endpoint}?page=5&sortByDate=false)}`);
            expect(status).toStrictEqual(401);
        });
    });
    describe(' GET /admin', () => {
        it('should have status 401 if user object is not admin', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: [] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app).get(`${endpoint}/admin?page=10&sortByDate=true&resolved=true`);
            expect(status).toStrictEqual(401);
        });
        it('should have status 400 if required query parameters are not provided', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 200 since undefined sortByDate query parameter defaults to true', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            collectionSpy.mockResolvedValueOnce(0);
            collectionSpy.mockResolvedValueOnce([]);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=0&=&resolved=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(200);
        });
        it('should have status 200 since empty sortByDate defaults to true', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            collectionSpy.mockResolvedValueOnce(0);
            collectionSpy.mockResolvedValueOnce([]);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=0&sortByDate=&resolved=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 if page query parameter is empty', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=&sortByDate=false&resolved=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page query parameter is undefined', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?sortByDate=false&resolved=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if resolved query parameter is empty', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=1&sortByDate=true&resolved=`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if resolved query parameter is undefined', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=1&sortByDate=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 200 if resolved query parameter is true', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            collectionSpy.mockResolvedValueOnce(0);
            collectionSpy.mockResolvedValueOnce([]);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=1&sortByDate=false&resolved=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(200);
        });
        it('should have status 200 if resolved query parameter is false', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            collectionSpy.mockResolvedValueOnce(0);
            collectionSpy.mockResolvedValueOnce([]);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=1&sortByDate=true&resolved=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 if page number is negative', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=-1&sortByDate=true&resolved=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is big negative number', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=-135423652764745672745741235&sortByDate=true&resolved=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is infinite', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=${Number.POSITIVE_INFINITY}&sortByDate=false&resolved=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is string', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=${faker.random.word()}&sortByDate=true&resolved=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if page number is random long string', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=${faker.random.words(80)}&sortByDate=false&resolved=true`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if sortByDate is random string ', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=1&sortByDate=${faker.random.word()}&resolved=false`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if resolved parameter is random string', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .get(`${endpoint}/admin?page=1&sortByDate=false&resolved=${faker.random.word()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 401 if there is no login cookie', async () => {
            const { status } = await request(app).get(`${endpoint}/admin?page=5&sortByDate=false)}`);
            expect(status).toStrictEqual(401);
        });
    });
    describe('POST /', () => {
        it('should have status 200', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce({
                insertedCount: 1,
            });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .post(endpoint)
                .type('form')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send(feedbackReportForm);
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 if creation of feedback report fails', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce({
                insertedCount: 0,
            });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .post(endpoint)
                .type('form')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send(feedbackReportForm);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 for an incomplete form', async () => {
            const copy: Partial<FeedbackReportForm> = { ...feedbackReportForm };
            delete copy.description;
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .post(endpoint)
                .type('form')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send(copy);
            expect(status).toStrictEqual(400);
        });

        it('should have status 401 if login cookie is missing', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app).post(endpoint).type('form').send(feedbackReportForm);
            expect(status).toStrictEqual(401);
        });
        it('should have status 400 if feedback report data is not sent', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .post(endpoint)
                .type('form')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if feedback report description is empty', async () => {
            const copy: Partial<FeedbackReportForm> = { ...feedbackReportForm };
            copy.description = '';
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .post(endpoint)
                .type('form')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send(copy);
            expect(status).toStrictEqual(400);
        });
        it('Should have status 400 if description is random number', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .post(endpoint)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ description: faker.random.number() });
            expect(status).toStrictEqual(400);
        });
    });
    describe('PUT /:reportId', () => {
        it('should have status 200', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce({ modifiedCount: 1 });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(feedbackReportForm);
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 for an incomplete feedback report form', async () => {
            const partial: Partial<FeedbackReportForm> = {
                ...feedbackReportForm,
            };
            delete partial.description;
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(partial);
            expect(status).toStrictEqual(400);
        });
        it('should have status 401 if the login cookie is missing', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}`)
                .type('form')
                .send(feedbackReportForm);
            expect(status).toStrictEqual(401);
        });

        it('should have status 400 if update data is not sent', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form');
            expect(status).toStrictEqual(400);
        });

        it('should have status 400 if empty description is sent', async () => {
            const partial: Partial<FeedbackReportForm> = {
                ...feedbackReportForm,
            };
            partial.description = '';
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(partial);
            expect(status).toStrictEqual(400);
        });

        it('should have status 400 if reportId provided is invalid', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${faker.random.alphaNumeric(6)}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(feedbackReportForm);
            expect(status).toStrictEqual(400);
        });

        it('should have status 401 if calling user is not owner of the report to update', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce({
                modifiedCount: 0,
            });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(feedbackReportForm);
            expect(status).toStrictEqual(401);
        });
    });
    describe('DELETE /:reportId', () => {
        it('should have status 200', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce({ deletedCount: 1 });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .delete(`${endpoint}/${new ObjectID().toHexString()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 if the id is invalid', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .delete(`${endpoint}/${faker.random.alphaNumeric(6)}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 404 if the feedback report is not found', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce({ deletedCount: 0 });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .delete(`${endpoint}/${new ObjectID().toHexString()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(404);
        });
    });
    describe('PUT /:reportId/resolved-status', () => {
        it('should have status 200', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            collectionSpy.mockResolvedValueOnce({ modifiedCount: 1 });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/resolved-status`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ resolvedStatus: true });
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 for not sending a new resolved status', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/resolved-status`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);
            expect(status).toStrictEqual(400);
        });
        it('should have status 401 if the login cookie is missing', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/resolved-status`)
                .send({ resolvedStatus: false });
            expect(status).toStrictEqual(401);
        });
        it('should have status 403 if insufficient permissions', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: [] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/resolved-status`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ resolvedStatus: true });
            expect(status).toStrictEqual(403);
        });
        it('should have status 400 if resolved status is random string', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/resolved-status`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ resolvedStatus: faker.random.word() });
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if resolved status is random number', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/resolved-status`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ resolvedStatus: faker.random.number() });
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if resolved status is null', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/resolved-status`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ resolvedStatus: null });
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if reportId provided is invalid', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${faker.random.alphaNumeric(6)}/resolved-status`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ resolvedStatus: true });
            expect(status).toStrictEqual(400);
        });
        it('should have status 404 is it fails to update resolved status', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            collectionSpy.mockResolvedValueOnce({ modifiedCount: 0 });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/resolved-status`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ resolvedStatus: false });
            expect(status).toStrictEqual(404);
        });
    });
    describe('PUT /:reportId/reply', () => {
        const reportReplyFrom = makeReportReplyForm();
        it('should have status 200', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            collectionSpy.mockResolvedValueOnce({ modifiedCount: 1 });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(reportReplyFrom);
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 for not sending a reply content', async () => {
            const partialReplyForm: Partial<ReportReplyForm> = {
                ...reportReplyFrom,
            };
            delete partialReplyForm.content;
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(partialReplyForm);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 for not sending a reply object', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form');
            expect(status).toStrictEqual(400);
        });
        it('should have status 401 if the login cookie is missing', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .type('form')
                .send(reportReplyFrom);
            expect(status).toStrictEqual(401);
        });
        it('should have status 403 if insufficient permissions', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: [] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(reportReplyFrom);
            expect(status).toStrictEqual(403);
        });
        it('should have status 400 if reply is random boolean', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ content: faker.random.boolean() });
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if reply is random number', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .send({ content: faker.random.number() });
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if reply is null', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send({ content: null });
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if reportId provided is invalid', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${faker.random.alphaNumeric(6)}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(reportReplyFrom);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 if reply is empty string', async () => {
            const copyReplyForm = reportReplyFrom;
            copyReplyForm.content = '';
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(copyReplyForm);
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 is it fails to submit reply to feedback report', async () => {
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            collectionSpy.mockResolvedValueOnce({ modifiedCount: 0 });
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);
            const { status } = await request(app)
                .put(`${endpoint}/${new ObjectID().toHexString()}/reply`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
                .type('form')
                .send(reportReplyFrom);
            expect(status).toStrictEqual(400);
        });
    });
});
