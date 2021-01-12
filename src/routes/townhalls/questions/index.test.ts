import express from 'express';
import request from 'supertest';
import faker from 'faker';
import {
    Townhall,
    Question,
    makeUser,
    makeTownhall,
    makeQuestionForm,
    makeQuestion,
    QuestionForm,
} from 'prytaneum-typings';

import * as DB from 'db/mongo';
import jwt from 'lib/jwt';
import config from 'config/app';
import { errorHandler } from 'middlewares';
import routes from '../index';

const app = express();

// jest.mock('mongodb');
beforeAll(() => {
    // jest.mock('db');
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

const user = makeUser();
const townhall = makeTownhall() as Townhall & { _id: string };
const questionForm = makeQuestionForm();
const question = makeQuestion() as Question & { _id: string };

describe('/townhall', () => {
    describe('GET /:townhallId/questions', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the questions query
            collectionSpy.mockResolvedValueOnce([]);

            // make the request
            const { status } = await request(app).get(
                `/${townhall._id}/questions`
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
    describe('POST /:townhallId/questions', () => {
        it('should have status 200 no quote in form', async () => {
            const myForm = { ...questionForm };
            myForm.quoteId = undefined;
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for the requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);
            collectionSpy.mockResolvedValueOnce({
                insertedCount: 1,
                ops: [question],
            });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/questions`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]) // 401 without this
                .type('form')
                .send(myForm);

            // expectations
            expect(status).toStrictEqual(200);
        });

        it('should have status 200 quote in form', async () => {
            const myForm = { ...questionForm };
            myForm.quoteId = makeQuestion()._id;
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for the requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);
            // for the question lookup
            collectionSpy.mockResolvedValueOnce(makeQuestion());
            collectionSpy.mockResolvedValueOnce({
                insertedCount: 1,
                ops: [question],
            });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/questions`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]) // 401 without this
                .type('form')
                .send(myForm);

            // expectations
            expect(status).toStrictEqual(200);
        });

        it('should have status 400 with invalid townhall id', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for the requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .post(`/${faker.random.alphaNumeric(6)}/questions`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]) // 401 without this
                .type('form')
                .send(questionForm);

            // expectations
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 with an invalid form', async () => {
            const copy: Partial<QuestionForm> = { ...questionForm };
            delete copy.question;

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for the requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/questions`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]) // 401 without this
                .type('form')
                .send(copy);

            // expectations
            expect(status).toStrictEqual(400);
        });
        it('should have status 401 with no login cookie', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for the requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .post(`/${townhall._id}/questions`)

                .type('form')
                .send(questionForm);

            // expectations
            expect(status).toStrictEqual(401);
        });
    });
    describe('GET /:townhallId/questions/:questionId', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for retrieving the question
            collectionSpy.mockResolvedValueOnce(question);

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status, body } = (await request(app).get(
                `/${townhall._id}/questions/${question._id}`
            )) as { status: number; body: Question };

            // expectations
            expect(status).toStrictEqual(200);
            expect(JSON.stringify(body)).toEqual(JSON.stringify(question));
        });
        it('should have status 400 with an invalid townhall Id', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for retrieving the question
            collectionSpy.mockResolvedValueOnce(question);

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status, body } = (await request(app).get(
                `/${faker.random.alphaNumeric()}/questions/${question._id}`
            )) as { status: number; body: Question };

            // expectations
            expect(status).toStrictEqual(400);
            expect(JSON.stringify(body)).not.toEqual(JSON.stringify(question));
        });
        it('should have status 400 with an invalid question id', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for retrieving the question
            collectionSpy.mockResolvedValueOnce(question);

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status, body } = (await request(app).get(
                `/${townhall._id}/questions/${faker.random.alphaNumeric()}`
            )) as { status: number; body: Question };

            // expectations
            expect(status).toStrictEqual(400);
            expect(JSON.stringify(body)).not.toEqual(JSON.stringify(question));
        });
    });
    describe('PUT /:townhallId/questions/:questionId', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);
            // for updating the question
            collectionSpy.mockResolvedValueOnce({ value: question });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .put(`/${townhall._id}/questions/${question._id}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]) // 401 without this
                .type('form')
                .send(questionForm);

            // expectations
            expect(status).toStrictEqual(200);
        });
        it('should have status 400 for invalid townhall id', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);
            // for updating the question
            collectionSpy.mockResolvedValueOnce({ value: question });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .put(
                    `/${faker.random.alphaNumeric()}/questions/${question._id}`
                )
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]) // 401 without this
                .type('form')
                .send(questionForm);

            // expectations
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 for invalid question id', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);
            // for updating the question
            collectionSpy.mockResolvedValueOnce({ value: question });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .put(
                    `/${townhall._id}/questions/${faker.random.alphaNumeric()}`
                )
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]) // 401 without this
                .type('form')
                .send(questionForm);

            // expectations
            expect(status).toStrictEqual(400);
        });
        it('should have status 400 for an invalid form', async () => {
            const copy = { ...questionForm } as Partial<QuestionForm>;
            delete copy.question;

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);
            // for updating the question
            collectionSpy.mockResolvedValueOnce({ value: question });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .put(`/${townhall._id}/questions/${question._id}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]) // 401 without this
                .type('form')
                .send(copy);

            // expectations
            expect(status).toStrictEqual(400);
        });
        it('should have status 401 for missing login cookie', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for requireLogin() middleware
            collectionSpy.mockResolvedValueOnce(user);
            // for updating the question
            collectionSpy.mockResolvedValueOnce({ value: question });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .put(`/${townhall._id}/questions/${question._id}`)
                .type('form')
                .send(questionForm);

            // expectations
            expect(status).toStrictEqual(401);
        });
    });
    describe('DELETE /:townhallId/questions/:questionId', () => {
        it('should have status 200', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for requireLogin() middleware
            collectionSpy.mockResolvedValueOnce({
                ...user,
                roles: ['organizer'],
            });
            // for deleting the question
            collectionSpy.mockResolvedValueOnce({ value: question });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .delete(`/${townhall._id}/questions/${question._id}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(200);
        });
        it('should have status 403 if not an organizer or admin', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');
            // for requireLogin() middleware
            collectionSpy.mockResolvedValueOnce({
                ...user,
                roles: [],
            });
            // for deleting the question
            collectionSpy.mockResolvedValueOnce({ value: question });

            // jwt spy for requireLogin() -- 401 without this
            const jwtSpy = jest.spyOn(jwt, 'verify');
            jwtSpy.mockResolvedValueOnce(user);

            // make the request
            const { status } = await request(app)
                .delete(`/${townhall._id}/questions/${question._id}`)
                .set('Cookie', [`jwt=${faker.random.alphaNumeric()}`]); // 401 without this

            // expectations
            expect(status).toStrictEqual(403);
        });
    });
});
