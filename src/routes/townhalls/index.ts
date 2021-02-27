/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import { ObjectId } from 'mongodb';
import type { TownhallForm, Townhall, TownhallSettings, BreakoutForm, RegisterForm } from 'prytaneum-typings';

import {
    createTownhall,
    getTownhall,
    getTownhalls,
    updateTownhall,
    deleteTownhall,
    configure,
    startTownhall,
    endTownhall,
} from 'modules/townhall';
import { startBreakout, endBreakout } from 'modules/chat';
import { townhallValidationObject } from 'modules/townhall/validators';
import { makeJoiMiddleware, makeEndpoint, requireLogin, RequireLoginLocals, requireModerator } from 'middlewares';
import { makeObjectIdValidationObject } from 'utils/validators';
import { register, registerForTownhall } from 'modules/user';

import { TownhallParams } from './types';
import questionRoutes from './questions';
import chatMessageRoutes from './chat-messages';
import ratingRoutes from './rating';
import playlistRoutes from './playlist';

const router = Router();

/**
 * gets the list of townhalls owned by the user
 */
router.get<Express.EmptyParams, Townhall<ObjectId>[], void, void, RequireLoginLocals>(
    '/',
    requireLogin(['organizer']),
    // TODO: pagination middleware that does joi + extracts query to a mongodb query + any other validation needed
    makeEndpoint(async (req, res) => {
        const { user } = req.results;
        const townhalls = await getTownhalls(user._id);
        res.status(200).send(townhalls);
    })
);
/**
 * creates a new townhall by the user
 */
router.post<Express.EmptyParams, { _id: string }, TownhallForm, void, RequireLoginLocals>(
    '/',
    requireLogin(['organizer', 'admin']),
    makeJoiMiddleware({
        body: Joi.object(townhallValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const townhallForm = req.body;
        const townhallId = await createTownhall(townhallForm, req.results.user);
        res.status(200).send({ _id: townhallId.toHexString() });
    })
);

/**
 * validator used for validating the townhall id parameter
 */
const validateTownhallParams = makeJoiMiddleware({
    params: Joi.object(makeObjectIdValidationObject('townhallId')).unknown(true),
});

/**
 * validates all townhall id params that are exactly /:townhallId
 */
router.use('/:townhallId', validateTownhallParams);
/**
 * validates all routes prefixed by the townhallId
 */
router.use('/:townhallId/*', validateTownhallParams);

/**
 * gets a particular townhall, there's no private data, so all data is sent to the client
 * TODO: check if all of the data is actually not sensitive
 */
router.get<TownhallParams, Townhall<ObjectId>>(
    '/:townhallId',
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const townhall = await getTownhall(townhallId);
        res.status(200).send(townhall);
    })
);
/**
 * updates a particular townhall (only the form fields)
 */
router.put<TownhallParams, { _id: string }, TownhallForm, void, RequireLoginLocals>(
    '/:townhallId',
    requireLogin(['organizer', 'admin']),
    makeJoiMiddleware({
        body: Joi.object(townhallValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const townhallForm = req.body;
        const { townhallId } = req.params;
        const { user } = req.results;
        await updateTownhall(townhallForm, townhallId, user);
        res.sendStatus(200).send({ _id: townhallId });
    })
);
/**
 * deletes a particular townhall
 */
router.delete<TownhallParams>(
    '/:townhallId',
    requireLogin(['organizer', 'admin']),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        await deleteTownhall(townhallId);
        res.sendStatus(200);
    })
);
/**
 * updates the townhall configuration the townhall settings
 */
router.post<TownhallParams, void, TownhallSettings, void, RequireLoginLocals>(
    '/:townhallId/configure',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { user } = req.results;
        await configure(req.body, townhallId, user._id);
        res.sendStatus(200);
    })
);

/**
 * starts a townhall
 */
router.post<TownhallParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/start',
    requireLogin(['organizer']),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { user } = req.results;
        await startTownhall(townhallId, user);
        res.sendStatus(200);
    })
);

/**
 * ends a townhall
 */
router.post<TownhallParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/end',
    requireLogin(['organizer']),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { user } = req.results;
        await endTownhall(townhallId, user);
        res.sendStatus(200);
    })
);

/**
 * start breakout rooms in townhall
 */
router.post<TownhallParams, void, BreakoutForm, void, RequireLoginLocals>(
    '/:townhallId/breakout-start',
    requireModerator(),
    makeJoiMiddleware({
        body: Joi.object({
            numRooms: Joi.number().required(),
        }),
    }),
    makeEndpoint((req, res) => {
        const { numRooms } = req.body;
        const { townhallId } = req.params;
        startBreakout(townhallId, numRooms);
        res.sendStatus(200);
    })
);

/**
 * ends breakout room in townhall
 */
router.post<TownhallParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/breakout-end',
    requireModerator(),
    makeEndpoint((req, res) => {
        const { townhallId } = req.params;
        endBreakout(townhallId);
        res.sendStatus(200);
    })
);

/**
 * pre-register a user, this is typically done via an external service
 * ex. eventbrite webhook to register a user for a townhall
 * ie this is not a "full" account, although this has no impact during the townhall
 * FIXME: this is completely insecure, just requires knowing the townhallId, fix ASAP -- but for now it's good enough
 * 1. User registers on eventbrite
 * 2. eventbrite calls this API endpoint
 * 3. user is registered (note: no password)
 * 4. user is sent an email containing a url to join this particular townhall of the form /join/:townhallId?token={token} // TODO: test that email is actually sent appropriately
 * 5. On user clicking user clicking link, on frontend if we see the user has a token, then we call the introspection endpoint // TODO:
 * 6. On the frontend, there's a little banner at the top that says complete your account
 */
router.post<
    Express.EmptyParams,
    void,
    Pick<RegisterForm, 'email' | 'firstName' | 'lastName'>,
    void,
    RequireLoginLocals
>(
    '/:townhallId/pre-register',
    makeEndpoint(async (req, res) => {
        // TODO: addresses fixme, but check if the user is an organizer based off the api token
        const { email, firstName, lastName } = req.body;
        const { townhallId } = req.params;
        await registerForTownhall({ email, firstName, lastName }, townhallId);
        res.sendStatus(200);
    })
);

router.use(questionRoutes);
router.use(chatMessageRoutes);
router.use(ratingRoutes);
router.use(playlistRoutes);

export default router;
