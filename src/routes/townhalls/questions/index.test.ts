import express from 'express';
import request from 'supertest';
import faker from 'faker';
import { ObjectID } from 'mongodb';
import {
    Townhall,
    ChatMessage,
    makeUser,
    makeTownhall,
    makeChatMessage,
} from 'prytaneum-typings';

import * as DB from 'db/mongo';
import config from 'config/app';
import { errorHandler } from 'middlewares';
import routes from '../index';

const app = express();

beforeAll(() => {
    jest.mock('mongodb');
    config(app);
    app.use(routes);
    app.use(errorHandler());
});

afterAll(() => {
    jest.unmock('mongodb');
});

afterEach(() => {
    jest.restoreAllMocks();
});

const user = makeUser();
const townhall = makeTownhall() as Townhall & { _id: string };
const message = makeChatMessage() as ChatMessage & { _id: string };

describe('/townhall', () => {
    describe('GET /:townhallId/questions', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the questions query
            collectionSpy.mockResolvedValueOnce([]);

            // make the request
            const { status } = await request(app).get(
                `/${new ObjectID().toHexString()}/questions`
            );
            // expectations
            expect(status).toStrictEqual(200);
        });

        it('should have status 400 with invalid townhall id', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the questions query
            collectionSpy.mockResolvedValueOnce([]);

            // make the request
            const { status } = await request(app).get(
                `/${faker.random.alphaNumeric(6)}/questions`
            );
            // expectations
            expect(status).toStrictEqual(400);
        });
    });
});
