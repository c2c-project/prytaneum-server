import express from 'express';
import request from 'supertest';
import faker from 'faker';
import {
    Townhall,
    ChatMessage,
    makeUser,
    makeTownhall,
    makeChatMessage,
} from 'prytaneum-typings';

import * as DB from 'db/mongo';
import jwt from 'lib/jwt';
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
    describe('POST /:townhallId/chat-messages/:messageId/hide', () => {
        it('should have status 200', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(user);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(townhall);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: message });

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/chat-messages/${message._id}/hide`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this
            // expectations
            expect(status).toStrictEqual(200);
        });

        it('should have status 401 with no jwt', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(user);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(townhall);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: message });

            // make the request
            const { status } = await request(app).post(
                `/${townhall._id}/chat-messages/${message._id}/hide`
            );

            // expectations
            expect(status).toStrictEqual(401);
        });
        it('should have status 403 if not a moderator', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(user);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(null);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: message });

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/chat-messages/${message._id}/hide`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(403);
        });
        it('should have status 404 with no user found', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(null);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(townhall);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: message });

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/chat-messages/${message._id}/hide`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(404);
        });
        it('should have status 404 if message not found', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(user);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(townhall);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: null });

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/chat-messages/${message._id}/hide`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(404);
        });
    });
    describe('POST /:townhallId/chat-messages/:messageId/show', () => {
        it('should have status 200', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(user);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(townhall);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: message });

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/chat-messages/${message._id}/show`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(200);
        });

        it('should have status 401 with no jwt', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(user);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(townhall);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: message });

            // make the request
            const { status } = await request(app).post(
                `/${townhall._id}/chat-messages/${message._id}/show`
            );

            // expectations
            expect(status).toStrictEqual(401);
        });
        it('should have status 403 if not a moderator', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(user);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(null);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: message });

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/chat-messages/${message._id}/show`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(403);
        });
        it('should have status 404 with no user found', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(null);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(townhall);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: message });

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/chat-messages/${message._id}/show`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(404);
        });
        it('should have status 404 if message not found', async () => {
            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the requireLogin query -- 404 without this
            collectionSpy.mockResolvedValueOnce(user);
            // for the requireModerator query -- 403 without this
            collectionSpy.mockResolvedValueOnce(townhall);
            // for modifying the target mesage -- 404 without this
            collectionSpy.mockResolvedValueOnce({ value: null });

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/chat-messages/${message._id}/show`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(404);
        });
    });
});
