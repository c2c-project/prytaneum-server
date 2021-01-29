import express from 'express';
import request from 'supertest';
import faker from 'faker';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { makeRatingForm, makeTownhall, makeUser } from 'prytaneum-typings';
import { useCollection } from 'db';
import { ObjectId } from 'mongodb';

import * as DB from 'db/mongo';
import config from 'config/app';
import Rating from 'modules/rating';
import * as Users from 'modules/user';
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
    describe('rating', () => {
        it('should accept valid data', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({});

            const ratingForm = makeRatingForm();

            // make the request
            const { status } = await request(app)
                .put(`/${townhall._id}/rating`)
                .send(ratingForm);
            expect(status).toStrictEqual(200);
        });
        it('should accept valid data & userId', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({});

            const ratingForm = makeRatingForm();

            // make the request
            const { status } = await request(app)
                .put(`/${townhall._id}/rating?userId=${user._id}`)
                .send(ratingForm);
            expect(status).toStrictEqual(200);
        });
        it('should reject invalid formatted data', async () => {
            // make the request
            const { status } = await request(app)
                .put(`/${townhall._id}/rating`)
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
                .put(`/${townhall._id}/rating`)
                .send(ratingForm);
            expect(status).toStrictEqual(500);
        });
    });
});
