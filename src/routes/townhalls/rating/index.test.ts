import express from 'express';
import request from 'supertest';
import {
    makeRatingForm,
    makeRating,
    makeTownhall,
    makeUser,
} from 'prytaneum-typings';

import * as DB from 'db/mongo';
import config from 'config/app';
import JWT from 'lib/jwt';
import { errorHandler } from 'middlewares';
import routes from './index';

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

const user = makeUser();
const townhall = makeTownhall();

describe('index', () => {
    describe('ratings', () => {
        describe('put request', () => {
            it('should accept valid data', async () => {
                // spy and mock useCollection
                const collectionSpy = jest.spyOn(DB, 'useCollection');
                collectionSpy.mockResolvedValueOnce({});

                const ratingForm = makeRatingForm();

                // make the request
                const { status } = await request(app)
                    .put(`/${townhall._id}/ratings`)
                    .send(ratingForm);
                expect(status).toStrictEqual(200);
            });
            it('should accept valid data & userId', async () => {
                // spy and mock useCollection
                const collectionSpy = jest.spyOn(DB, 'useCollection');
                collectionSpy.mockResolvedValueOnce({});

                const ratingForm = makeRatingForm();

                const payload = { _id: user._id, name: user.name };

                const token = await JWT.sign(payload);

                // make the request
                const { status } = await request(app)
                    .put(`/${townhall._id}/ratings`)
                    .set('Cookie', `jwt=${token}`)
                    .send(ratingForm);
                expect(status).toStrictEqual(200);
            });
            it('should reject invalid formatted data', async () => {
                // make the request
                const { status } = await request(app)
                    .put(`/${townhall._id}/ratings`)
                    .send({ invalid: '' });
                expect(status).toStrictEqual(400);
            });
            it('should have status 500 with a database error', async () => {
                // spy and mock useCollection
                const collectionSpy = jest.spyOn(DB, 'useCollection');
                collectionSpy.mockRejectedValue(new Error('Fake Error'));

                const ratingForm = makeRatingForm();

                // make the request
                const { status } = await request(app)
                    .put(`/${townhall._id}/ratings`)
                    .send(ratingForm);
                expect(status).toStrictEqual(500);
            });
        });
        describe('get request', () => {
            it('should accept valid data', async () => {
                // spy and mock useCollection
                const collectionSpy = jest.spyOn(DB, 'useCollection');
                collectionSpy.mockResolvedValueOnce({
                    count: () => {
                        return 2;
                    },
                    toArray: () => {
                        return [makeRating(), makeRating()];
                    },
                });

                // make the request
                const { status } = await request(app)
                    .get(`/${townhall._id}/ratings`)
                    .send();
                expect(status).toStrictEqual(200);
            });
            it('should have status 500 with a database error', async () => {
                // spy and mock useCollection
                const collectionSpy = jest.spyOn(DB, 'useCollection');
                collectionSpy.mockRejectedValue(new Error('Fake Error'));

                // make the request
                const { status } = await request(app)
                    .get(`/${townhall._id}/ratings`)
                    .send();
                expect(status).toStrictEqual(500);
            });
        });
    });
});
