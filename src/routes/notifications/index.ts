import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import csvParser from 'csv-parser';
import makeDebug from 'debug';
import { makeEndpoint } from 'middlewares';
import createHttpError, { HttpError } from 'http-errors';

import Notifications from 'modules/notifications';
// import logger from 'lib/logger';
import Invite, { InviteData, InviteeData } from 'modules/invite';
import Subscribe, { SubscribeData } from 'modules/subscribe';

const info = makeDebug('prytaneum:db');

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
    destination(req, file, cb) {
        if (!fs.existsSync(path.join(__dirname, '/downloads'))) {
            fs.mkdirSync(path.join(__dirname, '/downloads'));
        }
        cb(null, path.join(__dirname, '/downloads/'));
    },
    filename(req, file, cb) {
        cb(null, file.originalname);
    },
});

// eslint-disable-next-line @typescript-eslint/ban-types
const fileFilter = (
    req: unknown,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (file.mimetype === 'text/csv') {
        cb(null, true); // Accept
    } else {
        cb(new Error('Invalid File')); // Reject
    }
};

// TODO Discuss storing locally or in memory
const inviteUpload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 10, // 10 MB limit
    },
    fileFilter,
});

// TODO Add invite limited route that checks the number of lines/entries in file and limit to 100 max.
// If over max, return bad response with message relating to limit exceeded
router.post(
    '/invite-limited',
    inviteUpload.single('inviteFile'),
    makeEndpoint(async (req, res) => {
        const { file } = req;
        try {
            if (!file) throw new Error('File undefined'); // Check if file is undefined (rejected)
            const data = req.body as InviteData;
            Invite.validateData(data);
            data.deliveryTime = Invite.validateDeliveryTime(
                data.deliveryTimeString
            );
            const inviteeData: Array<InviteeData> = [];
            const fileStream = fs.createReadStream(file.path).pipe(csvParser());
            const SIZE_LIMIT = 100;
            // eslint-disable-next-line no-restricted-syntax
            for await (const fileData of fileStream) {
                if (inviteeData.length < SIZE_LIMIT) {
                    inviteeData.push(fileData);
                } else {
                    throw new Error('Invite list limit exceeded');
                }
            }
            // Remove file after use
            fs.unlink(file.path, (err) => {
                if (err) throw new Error(JSON.stringify(err));
            });
            if (inviteeData.length > 0) {
                // Handle any remaining data
                const results = await Invite.inviteCSVList(inviteeData, data);
                info(JSON.stringify(results));
            }
            res.status(200).send();
        } catch (e) {
            // Still using try/catch here to ensure file is unlinked
            if (file) {
                // Remove file after use
                fs.unlink(file.path, (err) => {
                    if (err) throw new Error(JSON.stringify(err));
                });
            }
            throw new Error(e); // Send to error handler
        }
    })
);

router.post(
    '/invite',
    inviteUpload.single('inviteFile'), // form-data key
    makeEndpoint(async (req, res) => {
        // TODO add authentication
        const { file } = req;
        try {
            if (!file) throw createHttpError(400, 'File undefined'); // Check if file is undefined (rejected)
            const data = req.body as InviteData;
            Invite.validateData(data);
            data.deliveryTime = Invite.validateDeliveryTime(
                data.deliveryTimeString
            );
            const inviteeData: Array<InviteeData> = [];
            const fileStream = fs.createReadStream(file.path).pipe(csvParser());
            const BATCH_SIZE = 5000; // Only store 5k invitees in memory at a time.
            // eslint-disable-next-line no-restricted-syntax
            for await (const fileData of fileStream) {
                if (inviteeData.length < BATCH_SIZE) {
                    inviteeData.push(fileData);
                } else {
                    inviteeData.push(fileData); // Push latest one
                    // Handle and reset dataList
                    const results = await Invite.inviteCSVList(
                        inviteeData,
                        data
                    );
                    info(JSON.stringify(results));
                    inviteeData.splice(0, BATCH_SIZE);
                }
            }
            // Remove file after use
            fs.unlink(file.path, (err) => {
                if (err) throw new Error(JSON.stringify(err));
            });
            if (inviteeData.length > 0) {
                // Handle any remaining data
                const results = await Invite.inviteCSVList(inviteeData, data);
                info(JSON.stringify(results));
            }
            res.status(200).send();
        } catch (e) {
            if (file) {
                // Remove file after use
                fs.unlink(file.path, (err) => {
                    if (err) throw new Error(JSON.stringify(err));
                });
            }
            if (e instanceof HttpError) throw createHttpError(e);
            else throw new Error(e);
        }
    }
    )
);

router.post('/subscribe', makeEndpoint(async (req, res) => {
    // TODO update body validation to use JOI middleware
    const data = req.body as SubscribeData;
    if (data.email === undefined || data.region === undefined) {
        throw createHttpError(400, 'Invalid Body');
    }
    const isSubscribed = await Notifications.isSubscribed(
        data.email,
        data.region
    );
    if (isSubscribed) {
        throw createHttpError(400, 'Already subscribed.');
    }
    const isUnsubscribed = await Notifications.isUnsubscribed(
        data.email,
        data.region
    );
    // By default any subscriber will be removed from the unsub list
    if (isUnsubscribed) {
        await Notifications.removeFromUnsubList(data.email, data.region);
        await Subscribe.mailgunDeleteFromUnsubList(data.email);
    }
    await Notifications.addToSubList(data.email, data.region);
    res.status(200).send();
}
));

router.post('/unsubscribe',
    makeEndpoint(async (req, res) => {
        const data = req.body as SubscribeData;
        if (data.email === undefined || data.region === undefined) {
            throw createHttpError(400, 'Invalid Body');
        }
        const isUnsubscribed = await Notifications.isUnsubscribed(
            data.email,
            data.region
        );
        if (isUnsubscribed) {
            throw createHttpError(400, 'Already unsubscribed');
        }
        const isSubscribed = await Notifications.isSubscribed(
            data.email,
            data.region
        );
        if (isSubscribed)
            // Remove email from subscribe list
            await Notifications.removeFromSubList(data.email, data.region);
        await Notifications.addToUnsubList(data.email, data.region);
        await Subscribe.mailgunUnsubscribe(data.email);
        res.status(200).send();
    })
);

export default router;