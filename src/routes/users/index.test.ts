import express from 'express';
import request from 'supertest';
import faker from 'faker';
import { ObjectID } from 'mongodb';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, RegisterForm } from 'prytaneum-typings';

import * as DB from 'db/mongo';
import * as Users from 'modules/user';
import Emails from 'lib/emails';
import jwt from 'lib/jwt';
import config from 'config/app';
import { errorHandler } from 'middlewares';
import routes from './index';

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

const user: Partial<User> = {
    _id: new ObjectID(),
    email: { address: faker.internet.email(), verified: Math.random() > 0.5 },
    name: {
        first: faker.name.firstName(),
        last: faker.name.lastName(),
    },
};
describe('/users', () => {
    describe('POST /login', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue(user);

            // spy and mock Users.verifyPassword
            const userSpy = jest.spyOn(Users, 'verifyPassword');
            userSpy.mockResolvedValue(true);

            // make the request
            const { status } = await request(app)
                .post('/login')
                .type('form')
                .send({
                    email: faker.internet.email(),
                    password: faker.internet.password(10),
                });

            // expectations
            expect(status).toStrictEqual(200);
        });
        it('should have status 401 with an incorrect password', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue(user);

            // spy and mock Users.verifyPassword
            const userSpy = jest.spyOn(Users, 'verifyPassword');
            userSpy.mockResolvedValue(false);

            // make the request
            const { status } = await request(app)
                .post('/login')
                .send({
                    email: faker.internet.email(),
                    password: faker.internet.password(10),
                });

            // expectations
            expect(status).toStrictEqual(401);
        });
        it('should have status 401 with no user found', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue(null);

            // spy and mock Users.verifyPassword
            const userSpy = jest.spyOn(Users, 'verifyPassword');
            userSpy.mockResolvedValue(false);

            // make the request
            const { status } = await request(app)
                .post('/login')
                .send({
                    email: faker.internet.email(),
                    password: faker.internet.password(10),
                });

            // expectations
            expect(status).toStrictEqual(401);
        });
        it('should have status 500 with a database error', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockRejectedValue(new Error('Fake Error'));

            // spy and mock Users.verifyPassword
            const userSpy = jest.spyOn(Users, 'verifyPassword');
            userSpy.mockResolvedValue(false);

            // make the request
            const { status } = await request(app)
                .post('/login')
                .send({
                    email: faker.internet.email(),
                    password: faker.internet.password(10),
                });

            // expectations
            expect(status).toStrictEqual(500);
        });
        it('should have status 500 with a password comparison error', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue(user);

            // spy and mock Users.verifyPassword
            const userSpy = jest.spyOn(Users, 'verifyPassword');
            userSpy.mockRejectedValue(new Error('Fake Error'));

            // make the request
            const { status } = await request(app)
                .post('/login')
                .send({
                    email: faker.internet.email(),
                    password: faker.internet.password(10),
                });

            // expectations
            expect(status).toStrictEqual(500);
        });
    });
    describe('POST /logout', () => {
        it('should have status 200', async () => {
            // make the request
            const { status } = await request(app).post('/logout');

            // expectations
            expect(status).toStrictEqual(200);
        });
    });
    describe('POST /register', () => {
        // setup for all tests
        const pass = faker.internet.password();
        const form: RegisterForm = {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.internet.email(),
            password: pass,
            confirmPassword: pass,
        };

        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // reference: modules/user/index.ts
            collectionSpy.mockResolvedValueOnce(null);
            collectionSpy.mockResolvedValueOnce({
                insertedCount: 1,
                ops: [{}],
            });

            // bcrypt spy -- this is purely so that the test takes like 5ms instead of 90 from hashing
            const bcryptSpy = jest.spyOn(bcrypt, 'hash');
            bcryptSpy.mockResolvedValue(pass);

            // make the request
            const { status } = await request(app)
                .post('/register')
                .type('form')
                .send(form);

            // expectations
            expect(status).toStrictEqual(200);
        });

        it('should have status 400 for an incomplete(email missing) form', async () => {
            // incomplete form
            const copy = { ...form } as Partial<RegisterForm>;
            delete copy.email;

            // make the request
            const { status } = await request(app)
                .post('/register')
                .type('form')
                .send(copy);

            // expectations
            expect(status).toStrictEqual(400);
        });

        it('should have status 400 for password mismatch', async () => {
            // incomplete form
            const copy = { ...form };
            copy.confirmPassword = faker.internet.password();

            // make the request
            const { status } = await request(app)
                .post('/register')
                .type('form')
                .send(copy);

            // expectations
            expect(status).toStrictEqual(400);
        });
    });

    describe('POST /verify-email', () => {
        // setup for all tests
        // on client, the object id will be a string
        const userId = new ObjectID().toHexString();

        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue({ modifiedCount: 1 });

            // make the request
            const { status } = await request(app)
                .post('/verify-email')
                .type('form')
                .send({ userId });

            // expectations
            expect(status).toStrictEqual(200);
        });

        it('should have status 400 for an invalid id', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue({ modifiedCount: 1 });

            // make the request
            const { status } = await request(app)
                .post('/verify-email')
                .type('form')
                .send({ userId: faker.random.alphaNumeric(6) });

            // expectations
            expect(status).toStrictEqual(400);
        });

        it('should have status 404 for no user found', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue({ modifiedCount: 0 });

            // make the request
            const { status } = await request(app)
                .post('/verify-email')
                .type('form')
                .send({ userId });

            // expectations
            expect(status).toStrictEqual(404);
        });
    });
    describe('POST /forgot-password', () => {
        // setup
        const email = faker.internet.email();

        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue(user);

            // spy on emails
            const emailSpy = jest.spyOn(Emails, 'sendPasswordReset');

            // make the request
            const { status } = await request(app)
                .post('/forgot-password')
                .type('form')
                .send({ email });

            // expectations
            expect(status).toStrictEqual(200);
            expect(emailSpy).toBeCalledWith(email, expect.stringMatching(/./));
        });
        it('should have status 404 for no user found', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue(null);

            // spy on emails
            const emailSpy = jest.spyOn(Emails, 'sendPasswordReset');

            // make the request
            const { status } = await request(app)
                .post('/forgot-password')
                .type('form')
                .send({ email });

            // expectations
            expect(status).toStrictEqual(404);
            expect(emailSpy).not.toHaveBeenCalled();
        });
    });

    describe('POST /reset-password', () => {
        const token = faker.random.alphaNumeric(6);
        const password = faker.internet.password(10);
        const form = {
            password,
            confirmPassword: password,
        };
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue({ modifiedCount: 1 });

            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValue({ _id: new ObjectID() });

            // bcrypt spy -- this is purely so that the test takes like 5ms instead of 90 from hashing
            const bcryptSpy = jest.spyOn(bcrypt, 'hash');
            bcryptSpy.mockResolvedValue(password);

            // make the request
            const { status } = await request(app)
                .post(`/reset-password/${token}`)
                .type('form')
                .send(form);

            // expectations
            expect(status).toStrictEqual(200);
        });

        it('should have status 400 for password mismatch', async () => {
            // make passwords mismatch
            const copy = { ...form };
            copy.confirmPassword = password.slice(1); // off by 1 is a common password error

            // make the request
            const { status } = await request(app)
                .post(`/reset-password/${token}`)
                .type('form')
                .send(copy);

            // expectations
            expect(status).toStrictEqual(400);
        });

        it('should have status 400 for invalid user id', async () => {
            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValue({ _id: faker.random.alphaNumeric(6) });

            // make the request
            const { status } = await request(app)
                .post(`/reset-password/${token}`)
                .type('form')
                .send(form);

            // expectations
            expect(status).toStrictEqual(400);
        });

        it('should have status 401 for an expired token', async () => {
            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockRejectedValue(
                new TokenExpiredError('jwt expired', new Date())
            );

            // make the request
            const { status } = await request(app)
                .post(`/reset-password/${token}`)
                .type('form')
                .send(form);

            // expectations
            expect(status).toStrictEqual(401);
        });

        it('should have status 401 for an invalid token', async () => {
            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockRejectedValue(new JsonWebTokenError('jwt malformed'));

            // make the request
            const { status } = await request(app)
                .post(`/reset-password/${token}`)
                .type('form')
                .send(form);

            // expectations
            expect(status).toStrictEqual(401);
        });

        it('should have status 404 if user not found', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValue({ modifiedCount: 0 });

            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValue(user);

            // bcrypt spy -- this is purely so that the test takes like 5ms instead of 90 from hashing
            const bcryptSpy = jest.spyOn(bcrypt, 'hash');
            bcryptSpy.mockResolvedValue(password);

            // make the request
            const { status } = await request(app)
                .post(`/reset-password/${token}`)
                .type('form')
                .send(form);

            // expectations
            expect(status).toStrictEqual(404);
        });
    });

    describe('GET /me', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);

            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .get('/me')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

            // expectations
            expect(status).toStrictEqual(200);
        });
        it('should have status 401 if there is no cookie', async () => {
            // make the request
            const { status } = await request(app).get('/me');

            // expectations
            expect(status).toStrictEqual(401);
        });

        it('should have status 401 with an invalid token', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .get('/me')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

            // expectations
            expect(status).toStrictEqual(401);
        });
    });

    describe('GET /', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });

            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .get('/')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

            // expectations
            expect(status).toStrictEqual(200);
        });
        it('should have status 401 without admin permission', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            collectionSpy.mockResolvedValueOnce(user);

            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .get('/')
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

            // expectations
            expect(status).toStrictEqual(401);
        });
    });

    describe('GET /:userId', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for the requireLogin middleware
            collectionSpy.mockResolvedValueOnce({ ...user, roles: ['admin'] });
            // for the fetch of the queried user
            collectionSpy.mockResolvedValueOnce(user);

            // jwt spy
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .get(`/${new ObjectID().toHexString()}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]);

            // expectations
            expect(status).toStrictEqual(200);
        });
    });
});
