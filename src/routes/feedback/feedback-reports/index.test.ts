import express from 'express';
import request from 'supertest';
import faker from 'faker';
import { ObjectID } from 'mongodb';
import {
    makeUser,
    makeFeedbackReportForm,
    makeFeedbackReport,
    FeedbackReport,
    User,
} from 'prytaneum-typings';

import * as DB from 'db/mongo';
import jwt from 'lib/jwt';
import config from 'config/app';
import { errorHandler } from 'middlewares';
import routes from '../index';

const app = express();
// jest.mock('mongodb');

beforeAll(() => {
    jest.mock('db');
    config(app);
    app.use(routes);
    app.use(errorHandler());
});

// afterAll(() => {
//     jest.unmock('mongodb');
// });

afterEach(() => {
    jest.restoreAllMocks();
});

const user = makeUser() as User & { _id: string };
const feedbackReportForm = makeFeedbackReportForm();
const feedbackReport = makeFeedbackReport() as FeedbackReport & { _id: string };

describe('/feedback', () => {
    describe('GET /feedback-reports', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for the requireLogin middleware
            collectionSpy.mockResolvedValueOnce({
                ...user,
            });

            // for the townhalls query
            collectionSpy.mockResolvedValueOnce([]);

            // jwt spy for requireLogin()
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .get('/feedback-reports')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

            // expectations
            expect(status).toStrictEqual(200);
        });

        // it('should have status 401 if there is no login cookie', async () => {
        //     // spy and mock useCollection
        //     const collectionSpy = jest.spyOn(DB, 'useCollection');
        //     // for the requireLogin middleware
        //     collectionSpy.mockResolvedValueOnce(user);

        //     // jwt spy for requireLogin()
        //     const jwtSpy = jest.spyOn(jwt, 'verify');
        //     jwtSpy.mockResolvedValueOnce(user);

        //     // make the request
        //     const { status } = await request(app).get('/');

        //     // expectations
        //     expect(status).toStrictEqual(401);
        // });
        // it('should have status 403 if organizer role is not present', async () => {
        //     // spy and mock useCollection
        //     const collectionSpy = jest.spyOn(DB, 'useCollection');
        //     // for the requireLogin middleware
        //     collectionSpy.mockResolvedValueOnce({ ...user, roles: [] });

        //     // jwt spy for requireLogin()
        //     const jwtSpy = jest.spyOn(jwt, 'verify');
        //     jwtSpy.mockResolvedValueOnce(user);

        //     // make the request
        //     const { status } = await request(app)
        //         .get('/')
        //         .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

        //     // expectations
        //     expect(status).toStrictEqual(403);
        // });
    });
    // describe('POST /', () => {
    //     it('should have status 200 for an organizer', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['organizer'],
    //         });

    //         // for the townhall insertion
    //         collectionSpy.mockResolvedValueOnce({
    //             insertedCount: 1,
    //             insertedId: new ObjectID(),
    //         });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .post('/')
    //             .type('form')
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //             .send(feedbackReportForm);

    //         // expectations
    //         expect(status).toStrictEqual(200);
    //     });
    // it('should have status 200 for an admin', async () => {
    //     // spy and mock useCollection
    //     const collectionSpy = jest.spyOn(DB, 'useCollection');
    //     // for the requireLogin middleware
    //     collectionSpy.mockResolvedValueOnce({
    //         ...user,
    //         roles: ['admin'],
    //     });

    //     // for the townhall insertion
    //     collectionSpy.mockResolvedValueOnce({
    //         insertedCount: 1,
    //         insertedId: new ObjectID(),
    //     });

    //     // jwt spy for requireLogin()
    //     const jwtSpy = jest.spyOn(jwt, 'verify');
    //     jwtSpy.mockResolvedValueOnce(user);

    //     // make the request
    //     const { status } = await request(app)
    //         .post('/')
    //         .type('form')
    //         .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //         .send(townhallForm);

    //     // expectations
    //     expect(status).toStrictEqual(200);
    // });

    // it('should have status 400 for an incomplete form', async () => {
    //     // make form partial
    //     const copy: Partial<TownhallForm> = { ...townhallForm };
    //     delete copy.title;
    //     // spy and mock useCollection
    //     const collectionSpy = jest.spyOn(DB, 'useCollection');
    //     // for the requireLogin middleware
    //     collectionSpy.mockResolvedValueOnce({
    //         ...user,
    //         roles: ['admin'],
    //     });

    //     // for the townhall insertion
    //     collectionSpy.mockResolvedValueOnce({
    //         insertedCount: 1,
    //         insertedId: new ObjectID(),
    //     });

    //     // jwt spy for requireLogin()
    //     const jwtSpy = jest.spyOn(jwt, 'verify');
    //     jwtSpy.mockResolvedValueOnce(user);

    //     // make the request
    //     const { status } = await request(app)
    //         .post('/')
    //         .type('form')
    //         .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //         .send(copy);

    //     // expectations
    //     expect(status).toStrictEqual(400);
    // });

    // it('should have status 401 if login cookie missing', async () => {
    //     // spy and mock useCollection
    //     const collectionSpy = jest.spyOn(DB, 'useCollection');
    //     // for the requireLogin middleware
    //     collectionSpy.mockResolvedValueOnce({
    //         ...user,
    //         roles: ['admin'],
    //     });

    //     // for the townhall insertion
    //     collectionSpy.mockResolvedValueOnce({
    //         insertedCount: 1,
    //         insertedId: new ObjectID(),
    //     });

    //     // jwt spy for requireLogin()
    //     const jwtSpy = jest.spyOn(jwt, 'verify');
    //     jwtSpy.mockResolvedValueOnce(user);

    //     // make the request
    //     const { status } = await request(app)
    //         .post('/')
    //         .type('form')
    //         .send(townhallForm);

    //     // expectations
    //     expect(status).toStrictEqual(401);
    // });

    // it('should have status 403 if insufficient permissions', async () => {
    //     // spy and mock useCollection
    //     const collectionSpy = jest.spyOn(DB, 'useCollection');
    //     // for the requireLogin middleware
    //     collectionSpy.mockResolvedValueOnce({ ...user, roles: [] });

    //     // for the townhall insertion although it should never get to this point in this test
    //     collectionSpy.mockResolvedValueOnce({
    //         insertedCount: 1,
    //         insertedId: new ObjectID(),
    //     });

    //     // jwt spy for requireLogin()
    //     const jwtSpy = jest.spyOn(jwt, 'verify');
    //     jwtSpy.mockResolvedValueOnce(user);

    //     // make the request
    //     const { status } = await request(app)
    //         .post('/')
    //         .type('form')
    //         .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //         .send(townhallForm);

    //     // expectations
    //     expect(status).toStrictEqual(403);
    // });
    // });

    // describe('GET /:townhallId', () => {
    //     it('should have status 200', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the townhall query
    //         collectionSpy.mockResolvedValueOnce(townhall);

    //         // make the request
    //         const { status, body } = (await request(app).get(
    //             `/${new ObjectID().toHexString()}`
    //         )) as { status: number; body: Townhall };

    //         // expectations
    //         expect(status).toStrictEqual(200);
    //         expect(JSON.stringify(body)).toEqual(JSON.stringify(townhall));
    //     });
    //     it('should have status 400 for an invalid townhall id', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the townhall query
    //         collectionSpy.mockResolvedValueOnce(townhall);

    //         // make the request
    //         const { status, body } = (await request(app).get(
    //             `/${faker.random.alphaNumeric(6)}`
    //         )) as { status: number; body: Townhall };

    //         // expectations
    //         expect(status).toStrictEqual(400);
    //         expect(JSON.stringify(body)).not.toEqual(JSON.stringify(townhall));
    //     });
    // });
    // describe('PUT /:townhallId', () => {
    //     it('should have status 200 for an admin', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
    //         // for the townhall modification
    //         collectionSpy.mockResolvedValueOnce({ modifiedCount: 1 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .put(`/${new ObjectID().toHexString()}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //             .type('form')
    //             .send(townhallForm);

    //         // expectations
    //         expect(status).toStrictEqual(200);
    //     });
    //     it('should have status 200 for an organizer', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['organizer'],
    //         });
    //         // for the townhall modification
    //         collectionSpy.mockResolvedValueOnce({ modifiedCount: 1 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .put(`/${new ObjectID().toHexString()}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //             .type('form')
    //             .send(townhallForm);

    //         // expectations
    //         expect(status).toStrictEqual(200);
    //     });
    //     it('should have status 400 for an incomplete townhall form', async () => {
    //         // partial townhall
    //         const partial: Partial<TownhallForm> = { ...townhallForm };
    //         delete partial.title;

    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['organizer'],
    //         });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .put(`/${new ObjectID().toHexString()}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //             .type('form')
    //             .send(partial);

    //         // expectations
    //         expect(status).toStrictEqual(400);
    //     });

    //     it('should have status 400 for an invalid id', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['organizer'],
    //         });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .put(`/${faker.random.alphaNumeric(6)}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //             .type('form')
    //             .send(townhallForm);

    //         // expectations
    //         expect(status).toStrictEqual(400);
    //     });
    //     it('should have status 401 if the login cookie is missing', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['organizer'],
    //         });
    //         // for the townhall modification
    //         collectionSpy.mockResolvedValueOnce({ modifiedCount: 1 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .put(`/${new ObjectID().toHexString()}`)
    //             .type('form')
    //             .send(townhallForm);

    //         // expectations
    //         expect(status).toStrictEqual(401);
    //     });
    //     it('should have status 401 for a non-owner', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
    //         // for the townhall modification
    //         collectionSpy.mockResolvedValueOnce({ modifiedCount: 0 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .put(`/${new ObjectID().toHexString()}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //             .type('form')
    //             .send(townhallForm);

    //         // expectations
    //         expect(status).toStrictEqual(401);
    //     });
    //     it('should have status 403 for a user without the necessary roles', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({ ...user, roles: [] });
    //         // for the townhall modification
    //         collectionSpy.mockResolvedValueOnce({ modifiedCount: 1 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .put(`/${new ObjectID().toHexString()}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`])
    //             .type('form')
    //             .send(townhallForm);

    //         // expectations
    //         expect(status).toStrictEqual(403);
    //     });
    // });

    // describe('DELETE /:townhallId', () => {
    //     it('should have status 200 for an organizer', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['organizer'],
    //         });
    //         // for the townhall deletion
    //         collectionSpy.mockResolvedValueOnce({ deletedCount: 1 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .delete(`/${new ObjectID().toHexString()}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

    //         // expectations
    //         expect(status).toStrictEqual(200);
    //     });

    //     it('should have status 200 for an admin', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['admin'],
    //         });
    //         // for the townhall deletion
    //         collectionSpy.mockResolvedValueOnce({ deletedCount: 1 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .delete(`/${new ObjectID().toHexString()}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

    //         // expectations
    //         expect(status).toStrictEqual(200);
    //     });

    //     it('should have status 400 if the id is invalid', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['admin'],
    //         });
    //         // for the townhall deletion
    //         collectionSpy.mockResolvedValueOnce({ deletedCount: 1 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .delete(`/${faker.random.alphaNumeric(6)}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

    //         // expectations
    //         expect(status).toStrictEqual(400);
    //     });

    //     it('should have status 404 if the townhall is not found', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['admin'],
    //         });
    //         // for the townhall deletion
    //         collectionSpy.mockResolvedValueOnce({ deletedCount: 0 });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .delete(`/${new ObjectID().toHexString()}`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

    //         // expectations
    //         expect(status).toStrictEqual(404);
    //     });
    // });
    // describe('POST /:townhallId/start', () => {
    //     it('should have status 200', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['organizer'],
    //         });

    //         // for the townhall start modification
    //         collectionSpy.mockResolvedValueOnce({
    //             value: { ...townhall, _id: new ObjectID() },
    //         });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .post(`/${townhall._id}/start`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

    //         // expectations
    //         expect(status).toStrictEqual(200);
    //     });
    //     it('should have status 400 for invalid townhallId', async () => {
    //         // spy and mock useCollection
    //         const collectionSpy = jest.spyOn(DB, 'useCollection');
    //         // for the requireLogin middleware
    //         collectionSpy.mockResolvedValueOnce({
    //             ...user,
    //             roles: ['organizer'],
    //         });

    //         // for the townhall start modification
    //         collectionSpy.mockResolvedValueOnce({
    //             value: { ...townhall, _id: new ObjectID() },
    //         });

    //         // jwt spy for requireLogin()
    //         const jwtSpy = jest.spyOn(jwt, 'verify');
    //         jwtSpy.mockResolvedValueOnce(user);

    //         // make the request
    //         const { status } = await request(app)
    //             .post(`/${faker.random.alphaNumeric(6)}/start`)
    //             .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

    //         // expectations
    //         expect(status).toStrictEqual(400);
    //     });
    // });
});
