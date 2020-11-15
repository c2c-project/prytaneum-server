/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import {
    TownhallForm,
    QuestionForm,
    Question,
    Townhall,
} from 'prytaneum-typings';

import {
    createTownhall,
    getTownhall,
    getTownhalls,
    updateTownhall,
    deleteTownhall,
} from 'modules/townhall';
import {
    getQuestions,
    createQuestion,
    getQuestion,
    updateQuestion,
    deleteQuestion,
} from 'modules/questions';
import { townhallValidationObject } from 'modules/townhall/validators';
import { questionFormValidationObject } from 'modules/questions/validators';
import { makeObjectIdValidationObject } from 'utils/validators';
import {
    makeJoiMiddleware,
    makeEndpoint,
    requireLogin,
    RequireLoginLocals,
} from 'middlewares';

const router = Router();

/**
 * gets the list of townhalls owned by the user
 */
router.get<Express.EmptyParams, Townhall[]>(
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

type TownhallParams = { townhallId: string };

/**
 * validates all townhall id params
 */
router.all(
    '/:townhallId',
    makeJoiMiddleware({
        params: Joi.object(makeObjectIdValidationObject('townhallId')),
    })
);

/**
 * gets a particular townhall, there's no private data, so all data is sent to the client
 * TODO: check if all of the data is actually not sensitive
 */
router.get<TownhallParams, Townhall>(
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
        // NOTE: params should already be validated from the router.all above
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
 * gets questions associated with the townhalls
 */
router.get<TownhallParams, Question[]>(
    '/:townhallId/questions',
    // TODO: pagination
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const questions = await getQuestions(townhallId);
        res.status(200).send(questions);
    })
);
/**
 * creates a new question for the townhall
 * TODO: if townhall is private I will need to gatekeep here
 */
router.post<TownhallParams, void, QuestionForm, void, RequireLoginLocals>(
    '/:townhallId/questions',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object(questionFormValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        await createQuestion(req.body, townhallId, req.results.user);
        res.sendStatus(200);
    })
);

type QuestionParams = { questionId: string } & TownhallParams;

router.all(
    '/:townhallId/questions/:questionId',
    makeJoiMiddleware({
        params: Joi.object(makeObjectIdValidationObject('questionId')),
    })
);
/**
 * gets a particular question
 */
router.get<QuestionParams, Question, void, void, void>(
    '/:townhallId/questions/:questionId',
    makeEndpoint(async (req, res) => {
        const { questionId, townhallId } = req.params;
        const question = await getQuestion(questionId, townhallId);
        res.status(200).send(question);
    })
);
/**
 * updates a particular question
 */
router.put<QuestionParams, void, QuestionForm, void, RequireLoginLocals>(
    '/:townhallId/questions/:questionId',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object(questionFormValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { questionId, townhallId } = req.params;
        const { user } = req.results;
        await updateQuestion(questionId, townhallId, user._id, req.body);
        res.sendStatus(200);
    })
);

/**
 * deletes a particular question
 */
router.delete<QuestionParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/questions/:questionId',
    requireLogin(['organizer']),
    makeEndpoint(async (req, res) => {
        const { user } = req.results;
        const { questionId, townhallId } = req.params;
        await deleteQuestion(questionId, townhallId, user._id);
        res.sendStatus(200);
    })
);

export default router;
