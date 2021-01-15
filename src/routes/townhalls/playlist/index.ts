/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import type { Question } from 'prytaneum-typings';

import {
    addQuestionToList,
    addQuestionToQueue,
    nextQuestion,
    removeQuestionFromList,
    updateQueue,
} from 'modules/playlist';
import {
    makeEndpoint,
    requireLogin,
    RequireLoginLocals,
    requireModerator,
} from 'middlewares';

import { TownhallParams } from '../types';

const router = Router();

// TODO: later on I can maybe allow edits and notify the user that there's an edit to this question
//  that could be a PUT and the mdoerators can decide whether or not to accept the edit

/**
 * adds a new question to the list in the playlist field on townhalls
 */
router.post<
    TownhallParams,
    void,
    void,
    { questionId: string },
    RequireLoginLocals
>(
    '/:townhallId/playlist',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { questionId } = req.query;
        await addQuestionToList(townhallId, questionId);
        res.status(200);
    })
);
/**
 * deletes a particular question from the list in the playlist field
 */
router.delete<
    TownhallParams & { questionId: string },
    void,
    { questionId: string },
    void,
    RequireLoginLocals
>(
    '/:townhallId/playlist/:questionId',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId, questionId } = req.params;
        await removeQuestionFromList(townhallId, questionId);
        res.status(200);
    })
);

/**
 * adds an item to the queue
 */
router.post<
    TownhallParams,
    void,
    { questionId: string },
    void,
    RequireLoginLocals
>(
    '/:townhallId/playlist/queue',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { questionId } = req.body;
        await addQuestionToQueue(townhallId, questionId);
        res.sendStatus(200);
    })
);
/**
 * updates the queue order
 */
router.post<
    TownhallParams,
    void,
    { source: number; destination: number },
    void,
    RequireLoginLocals
>(
    '/:townhallId/playlist/queue',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { source, destination } = req.body;
        await updateQueue(townhallId, source, destination);
        res.sendStatus(200);
    })
);
/**
 * removes an item from the queue
 */
router.delete<
    TownhallParams,
    void,
    { questionId: string },
    void,
    RequireLoginLocals
>(
    '/:townhallId/playlist/queue',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { questionId } = req.body;
        await removeQuestionFromList(townhallId, questionId);
        res.sendStatus(200);
    })
);

/**
 * advances the question
 */
router.post<TownhallParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/playlist/next',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        await nextQuestion(townhallId);
        res.sendStatus(200);
    })
);

/**
 * decrements the question
 */
router.post<TownhallParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/playlist/previous',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        await nextQuestion(townhallId);
        res.sendStatus(200);
    })
);

export default router;
