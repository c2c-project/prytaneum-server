import express from 'express';
import request from 'supertest';
import fs from 'fs';
import faker from 'faker';
import Papa from 'papaparse';
import makeDebug from 'debug';

// import app from 'app';
import { useCollection } from 'db';
import { NotificationMetaData, Notification } from 'prytaneum-typings/dist/notifications';
import { ObjectId } from 'mongodb';
import Notifications from 'modules/notifications';
import Subscribe, { SubscribeData } from 'modules/subscribe';

import * as DB from 'db/mongo';
import config from 'config/app';
import { errorHandler } from 'middlewares';
import routes from './index';

const app = express();

const info = makeDebug('prytaneum:db');

const testMoC = faker.name.firstName();
const testTopic = 'Technology';
const testEventDateTime = faker.date.future().toUTCString();
const testConstituentScope = 'state';
const testTownHallId = 'id';
const testMetadata: NotificationMetaData = {
    name: 'filename',
    size: 500, // Size in bytes
    sentDateTime: new Date().toISOString(),
};

const _id: ObjectId = new ObjectId();
const testUnsubscribeList: Array<string> = [
    faker.internet.email(),
    faker.internet.email(),
    faker.internet.email(),
];

const testSubscribeList: Array<string> = [
    faker.internet.email(),
    faker.internet.email(),
];

const region = 'test';
const testDoc: Notification<ObjectId> = {
    _id,
    unsubscribeList: testUnsubscribeList,
    subscribeList: testSubscribeList,
    region,
    inviteHistory: [testMetadata]
};

const testCSVData = [
    {
        email: faker.internet.email(),
        fName: faker.name.firstName(),
        lName: faker.name.lastName(),
    },
    {
        email: faker.internet.email(),
        fName: faker.name.firstName(),
        lName: faker.name.lastName(),
    },
];
const testCSVDataString = Papa.unparse(testCSVData);
const testUnsubCSVData = {
    email: testUnsubscribeList[0],
    fName: faker.name.firstName(),
    lName: faker.name.lastName(),
};
const testUnsubCSVString = Papa.unparse([testUnsubCSVData]);

const testFilePath = '/tmp/test.csv';
const testUnsubFilePath = '/tmp/testUnsub.csv';
const testInvalidFilePath = '/tmp/test.txt';

beforeAll(() => {
    // Check if tmp directory exists & create it if not
    if (!fs.existsSync('/tmp')) {
        fs.mkdirSync('/tmp');
    }
    // await useCollection('Notifications', async (collection) => {
    //     await collection.insertOne(testDoc);
    // });
    fs.writeFile(testFilePath, testCSVDataString, (err) => {
        if (err) info(err);
    });
    fs.writeFile(testUnsubFilePath, testUnsubCSVString, (err) => {
        if (err) info(err);
    });
    fs.writeFile(testInvalidFilePath, testUnsubCSVString, (err) => {
        if (err) info(err);
    });
    jest.mock('db');
    config(app);
    app.use(routes);
    app.use(errorHandler());
});

// afterAll(async () => {
//     await useCollection('Notifications', async (collection) => {
//         await collection.deleteOne({ _id });
//     });
// });

afterEach(() => {
    jest.clearAllMocks();
});

const validDeliveryTime = new Date();

describe('index', () => {
    describe('#invite', () => {
        // it('should accept options with cors', async () => {
        //     const { status } = await request(app)
        //         .options('/invite')
        //         .field('MoC', testMoC)
        //         .field('topic', testTopic)
        //         .field('eventDateTime', testEventDateTime)
        //         .field('constituentScope', testConstituentScope)
        //         .field('deliveryTimeString', validDeliveryTime.toISOString())
        //         .field('region', region)
        //         .field('townHallId', testTownHallId)
        //         .attach('inviteFile', fs.createReadStream(testFilePath));
        //     expect(status).toStrictEqual(204);
        // });
        it('should accept valid data', async () => {
            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the unsubscribed query
            collectionSpy.mockResolvedValueOnce({ unsubscribeList: [] });            
        
            const { status } = await request(app)
                .post('/invite')
                .field('MoC', testMoC)
                .field('topic', testTopic)
                .field('eventDateTime', testEventDateTime)
                .field('constituentScope', testConstituentScope)
                .field('deliveryTimeString', validDeliveryTime.toISOString())
                .field('region', region)
                .field('townHallId', testTownHallId)
                .attach('inviteFile', fs.createReadStream(testFilePath));
            expect(status).toStrictEqual(200);
        });
        // it('should accept valid data with previewEmail', async () => {
        //     const { status } = await request(app)
        //         .post('/invite')
        //         .field('MoC', testMoC)
        //         .field('topic', testTopic)
        //         .field('eventDateTime', testEventDateTime)
        //         .field('constituentScope', testConstituentScope)
        //         .field('deliveryTimeString', validDeliveryTime.toISOString())
        //         .field('region', region)
        //         .field('townHallId', testTownHallId)
        //         .field('previewEmail', faker.internet.email())
        //         .attach('inviteFile', fs.createReadStream(testFilePath));
        //     expect(status).toStrictEqual(200);
        // });
        // it('should accept valid deliveryTime', async () => {
        //     const { status } = await request(app)
        //         .post('/invite')
        //         .field('MoC', testMoC)
        //         .field('topic', testTopic)
        //         .field('eventDateTime', testEventDateTime)
        //         .field('constituentScope', testConstituentScope)
        //         .field('deliveryTimeString', validDeliveryTime.toISOString())
        //         .field('region', region)
        //         .field('townHallId', testTownHallId)
        //         .attach('inviteFile', fs.createReadStream(testFilePath));
        //     expect(status).toStrictEqual(200);
        // });
        // it('should accept undefined deliveryTime & replace with valid deliveryTime', async () => {
        //     const { status } = await request(app)
        //         .post('/invite')
        //         .field('MoC', testMoC)
        //         .field('topic', testTopic)
        //         .field('eventDateTime', testEventDateTime)
        //         .field('constituentScope', testConstituentScope)
        //         .field('region', region)
        //         .field('townHallId', testTownHallId)
        //         .attach('inviteFile', fs.createReadStream(testFilePath));
        //     expect(status).toStrictEqual(200);
        // });
        // it('should reject invalid deliveryTime', async () => {
        //     const { status } = await request(app)
        //         .post('/invite')
        //         .field('MoC', testMoC)
        //         .field('topic', testTopic)
        //         .field('eventDateTime', testEventDateTime)
        //         .field('constituentScope', testConstituentScope)
        //         .field('deliveryTimeString', 'invalid')
        //         .field('region', region)
        //         .field('townHallId', testTownHallId)
        //         .attach('inviteFile', fs.createReadStream(testFilePath));
        //     expect(status).toStrictEqual(400);
        // });
        // it('should remove unsubscribed user from list', async () => {
        //     const { status } = await request(app)
        //         .post('/invite')
        //         .field('MoC', testMoC)
        //         .field('topic', testTopic)
        //         .field('eventDateTime', testEventDateTime)
        //         .field('constituentScope', testConstituentScope)
        //         .field('deliveryTimeString', validDeliveryTime.toISOString())
        //         .field('region', region)
        //         .field('townHallId', testTownHallId)
        //         .attach('inviteFile', fs.createReadStream(testUnsubFilePath));
        //     expect(status).toStrictEqual(400);
        // });
        // it('should reject invalid filetype', async () => {
        //     const { status } = await request(app)
        //         .post('/invite')
        //         .field('MoC', testMoC)
        //         .field('topic', testTopic)
        //         .field('eventDateTime', testEventDateTime)
        //         .field('constituentScope', testConstituentScope)
        //         .field('deliveryTimeString', validDeliveryTime.toISOString())
        //         .field('region', region)
        //         .field('townHallId', testTownHallId)
        //         .attach('inviteFile', fs.createReadStream(testInvalidFilePath));
        //     expect(status).toStrictEqual(400);
        // });
        // it('should reject no data', async () => {
        //     const { status } = await request(app).post('/invite');
        //     expect(status).toStrictEqual(400);
        // });
    });
    describe('#subscribe', () => {
        it('should accept new subscriber', async () => {
            // define valid subscribe data
            const validData: SubscribeData = {
                email: faker.internet.email(),
                region,
            };

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the subscribed query
            collectionSpy.mockResolvedValueOnce({ subscribeList: [] });

            // for the unsubscribed query
            collectionSpy.mockResolvedValueOnce({ unsubscribeList: [] });

            // for addToSubList
            collectionSpy.mockResolvedValueOnce({ value: {} });

            // spy and mock mailgun http request function
            const mailgunDeleteFromUnsubList = jest
                .spyOn(Subscribe, 'mailgunDeleteFromUnsubList')
                .mockImplementationOnce(async () => {
                    return new Promise((resolve) => resolve('Success'));
                });

            // spy on removeFromUnsubList function
            const removeFromUnsubList = jest.spyOn(
                Notifications,
                'removeFromUnsubList'
            );

            // make the request
            const { status } = await request(app)
                .post('/subscribe')
                .send(validData);

            // expectations
            expect(status).toStrictEqual(200);
            expect(mailgunDeleteFromUnsubList).not.toBeCalled();
            expect(removeFromUnsubList).not.toBeCalled();
            // TODO: Find out why addToSubList calls showing as 0
            // const addToSubList = jest.spyOn(Notifications, 'addToSubList');
            // expect(addToSubList).toBeCalledWith(
            //     validData.email,
            //     validData.region
            // );
        });
        it('should reject existing subscriber', async () => {
            // define valid subscribe data
            const validData: SubscribeData = {
                email: faker.internet.email(),
                region,
            };

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the subscribed query
            collectionSpy.mockResolvedValueOnce({ subscribeList: [validData.email] });

            // spy and mock mailgun http request function
            const mailgunDeleteFromUnsubList = jest
                .spyOn(Subscribe, 'mailgunDeleteFromUnsubList')
                .mockImplementationOnce(async () => {
                    return new Promise((resolve) => resolve('Success'));
                });

            // spy on removeFromUnsubList function
            const removeFromUnsubList = jest.spyOn(
                Notifications,
                'removeFromUnsubList'
            );

            // make the request
            const { status } = await request(app)
                .post('/subscribe')
                .send(validData);

            // expectations
            expect(status).toStrictEqual(400);
            expect(mailgunDeleteFromUnsubList).not.toBeCalled();
            expect(removeFromUnsubList).not.toBeCalled();
        });
        it('should find existing unsubscriber in testUnsubscribeList', async () => {
            // define valid subscribe data
            const validData: SubscribeData = {
                email: faker.internet.email(),
                region,
            };

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the subscribed query
            collectionSpy.mockResolvedValueOnce({ subscribeList: [] });

            // for the unsubscribed query
            collectionSpy.mockResolvedValueOnce({ unsubscribeList: [validData.email] });

            // for removeFromSubList
            collectionSpy.mockResolvedValueOnce({ value: {} });

            // for addToSubList
            collectionSpy.mockResolvedValueOnce({ value: {} });

            // spy and mock mailgun http request function
            const mailgunDeleteFromUnsubList = jest
                .spyOn(Subscribe, 'mailgunDeleteFromUnsubList')
                .mockImplementationOnce(async () => {
                    return new Promise((resolve) => resolve('Success'));
                });

            const addToSubList = jest.spyOn(Notifications, 'addToSubList');

            // spy on removeFromUnsubList function
            const removeFromUnsubList = jest.spyOn(
                Notifications,
                'removeFromUnsubList'
            );

            // make the request
            const { status } = await request(app)
                .post('/subscribe')
                .send(validData);

            // expectations
            expect(status).toStrictEqual(200);
            expect(mailgunDeleteFromUnsubList).toBeCalledWith(validData.email);
            expect(removeFromUnsubList).toBeCalledWith(validData.email, validData.region);
            expect(addToSubList).toBeCalledWith(validData.email, validData.region);
        });
        it('should reject invalid email', async () => {
            const invalidData = {
                email: undefined,
                region,
            };
            const { status } = await request(app)
                .post('/subscribe')
                .send(invalidData);
            expect(status).toStrictEqual(400);
        });
        it('should reject invalid region', async () => {
            const invalidData = {
                email: faker.internet.email(),
                region: undefined,
            };
            const { status } = await request(app)
                .post('/subscribe')
                .send(invalidData);
            expect(status).toStrictEqual(400);
        });
        it('should reject no data', async () => {
            const { status } = await request(app).post('/subscribe');
            expect(status).toStrictEqual(400);
        });
    });
    describe('#unsubscribe', () => {
        it('should accept a new unsubscriber', async () => {
            // define valid subscribe data
            const validData: SubscribeData = {
                email: faker.internet.email(),
                region,
            };

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the unsubscribed query
            collectionSpy.mockResolvedValueOnce({ unsubscribeList: [] });

            // for the subscribed query
            collectionSpy.mockResolvedValueOnce({ subscribeList: [] });

            // for addToUnsubList
            collectionSpy.mockResolvedValueOnce({ value: {} });

            const addToUnsubList = jest.spyOn(Notifications, 'addToUnsubList');

            // spy and mock mailgun http request function
            const mailgunUnsubscribe = jest
                .spyOn(Subscribe, 'mailgunUnsubscribe')
                .mockImplementationOnce(async () => {
                    return new Promise((resolve) => resolve('Success'));
                });

            // spy on removeFromSubList function
            const removeFromSubList = jest.spyOn(
                Notifications,
                'removeFromSubList'
            );

            // make the request
            const { status } = await request(app)
                .post('/unsubscribe')
                .send(validData);

            // expectations
            expect(status).toStrictEqual(200);
            expect(addToUnsubList).toBeCalledWith(
                validData.email,
                validData.region
            );
            expect(mailgunUnsubscribe).toBeCalledWith(validData.email);
            expect(removeFromSubList).not.toBeCalled();
        });
        it('should reject and existing unsubscriber', async () => {
            // define valid subscribe data
            const validData: SubscribeData = {
                email: faker.internet.email(),
                region,
            };

            // spy and mock useCollection
            const collectionSpy = jest.spyOn(DB, 'useCollection');

            // for the unsubscribed query
            collectionSpy.mockResolvedValueOnce({ unsubscribeList: [validData.email] });

            // spy on isUnsubscribed function
            const isUnsubscried = jest.spyOn(Notifications, 'isUnsubscribed');

            // make the request
            const { status } = await request(app)
                .post('/unsubscribe')
                .send(validData);

            // expectations
            expect(status).toStrictEqual(400);
            expect(isUnsubscried).toBeCalledWith(
                validData.email,
                validData.region
            );
        });
        // TODO figure out why 500 status is being returned
        // it('should find existing subscriber in testSubscribeList', async () => {
        //     // define valid subscribe data
        //     const validData: SubscribeData = {
        //         email: faker.internet.email(),
        //         region,
        //     };

        //     // spy and mock useCollection
        //     const collectionSpy = jest.spyOn(DB, 'useCollection');
            
        //     // for the unsubscribed query
        //     collectionSpy.mockResolvedValueOnce({ unsubscribeList: [] });
            
        //     // for the subscribed query
        //     collectionSpy.mockResolvedValueOnce({ subscribeList: [ validData.email ] });

        //     // for removeFromSubList
        //     collectionSpy.mockResolvedValueOnce({ value: {} });

        //     // for addToUnsubList
        //     collectionSpy.mockResolvedValueOnce({ value: {} });

        //     // spy and mock mailgun http request function
        //     const mailgunUnsubscribe = jest
        //         .spyOn(Subscribe, 'mailgunUnsubscribe')
        //         .mockImplementationOnce(async () => {
        //             return new Promise((resolve) => resolve('Success'));
        //         });

        //     // spy on removeFromSubList function
        //     const removeFromSubList = jest.spyOn(
        //         Notifications,
        //         'removeFromSubList'
        //     );

        //     // spy on addToUnsubList function
        //     const addToUnsubList = jest.spyOn(Notifications, 'addToUnsubList');

        //     // make the request
        //     const { status } = await request(app)
        //         .post('/subscribe')
        //         .send(validData);

        //     // expectations
        //     expect(status).toStrictEqual(200);
        //     expect(removeFromSubList).toBeCalledWith(validData.email, validData.region);
        //     expect(addToUnsubList).toBeCalledWith(validData.email, validData.region);
        //     expect(mailgunUnsubscribe).toBeCalledWith(validData.email);
        // });
        it('should reject invalid email', async () => {
            const invalidData = {
                email: undefined,
                region,
            };
            const { status } = await request(app)
                .post('/unsubscribe')
                .send(invalidData);
            expect(status).toStrictEqual(400);
        });
        it('should reject invalid region', async () => {
            const invalidData = {
                email: faker.internet.email(),
                region: undefined,
            };
            const { status } = await request(app)
                .post('/unsubscribe')
                .send(invalidData);
            expect(status).toStrictEqual(400);
        });
        it('should reject no data', async () => {
            const { status } = await request(app).post('/unsubscribe');
            expect(status).toStrictEqual(400);
        });
    });
});