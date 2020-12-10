/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import { ObjectId } from 'mongodb';
import type {
    TownhallForm,
    Townhall,
    TownhallSettings,
} from 'prytaneum-typings';

import {
    createTownhall,
    getTownhall,
    getTownhalls,
    updateTownhall,
    deleteTownhall,
    configure,
    startTownhall,
    endTownhall,
    addQuestionToList,
    removeQuestionFromList,
} from 'modules/townhall';
import { townhallValidationObject } from 'modules/townhall/validators';
import {
    makeJoiMiddleware,
    makeEndpoint,
    requireLogin,
    RequireLoginLocals,
    requireModerator,
} from 'middlewares';
import { makeObjectIdValidationObject } from 'utils/validators';

import { TownhallParams } from './types';
import questionRoutes from './questions';
import chatMessageRoutes from './chat-messages';

const router = Router();

/**
 * gets the list of townhalls owned by the user
 */
router.get<Express.EmptyParams, Townhall<ObjectId>[]>(
    '/',
    requireLogin(['organizer']),
    // TODO: pagination middleware that does joi + extracts query to a mongodb query + any other validation needed
    makeEndpoint(async (req, res) => {
        const townhalls = await getTownhalls();
        res.status(200).send(townhalls);
    })
);
/**
 * creates a new townhall by the user
 */
router.post<Express.EmptyParams, void, TownhallForm, void, RequireLoginLocals>(
    '/',
    requireLogin(['organizer', 'admin']),
    makeJoiMiddleware({
        body: Joi.object(townhallValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const townhallForm = req.body;
        await createTownhall(townhallForm, req.results.user);
        res.sendStatus(200);
    })
);

/**
 * validator used for validating the townhall id parameter
 */
const validateTownhallParams = makeJoiMiddleware({
    params: Joi.object(makeObjectIdValidationObject('townhallId')).unknown(
        true
    ),
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
router.put<TownhallParams, void, TownhallForm, void, RequireLoginLocals>(
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
        res.sendStatus(200);
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
router.post<TownhallParams, void, TownhallSettings>(
    '/:townhallId/configure',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        await configure(req.body, townhallId);
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

// TODO: later on I can maybe allow edits and notify the user that there's an edit to this question
//  that could be a PUT and the mdoerators can decide whether or not to accept the edit

/**
 * adds a new question to the list in the playlist field on townhalls
 */
router.post<
    TownhallParams,
    void,
    { questionId: string },
    void,
    RequireLoginLocals
>(
    '/:townhallId/list',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { questionId } = req.body;
        await addQuestionToList(townhallId, questionId);
        res.status(200);
    })
);
/**
 * deletes a particular question from the list in the playlist field
 */
router.delete<
    TownhallParams,
    void,
    { questionId: string },
    void,
    RequireLoginLocals
>(
    '/:townhallId/list',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { questionId } = req.body;
        await removeQuestionFromList(townhallId, questionId);
        res.status(200);
    })
);

/**
 * adds an item to the queue
 */
router.post('/:townhallId/queue');
/**
 * updates the queue order
 */
router.put('/:townhallId/queue');
/**
 * removes an item from the queue
 */
router.delete('/:townhallId/queue');

/**
 * this has side effects, i.e. is NOT idempotent
 * 1. will replace currently playing question
 * 2. will move old currently playing question to the "played" field
 * 3. will remove the target question to play from the "queued" list
 */
router.post('/:townhallId/play');

router.use(questionRoutes);
router.use(chatMessageRoutes);

export default router;
