/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import type { QuestionForm, Question } from 'prytaneum-typings';
import { ObjectId } from 'mongodb';

import {
    getQuestions,
    createQuestion,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    likeQuestion,
    deleteLike,
} from 'modules/questions';
import { questionFormValidationObject } from 'modules/questions/validators';
import { addQuestionToList, removeQuestionFromList } from 'modules/playlist'; // TODO: remove
import { makeObjectIdValidationObject } from 'utils/validators';
import isModerator from 'utils/isModerator';
import {
    makeJoiMiddleware,
    makeEndpoint,
    requireLogin,
    RequireLoginLocals,
} from 'middlewares';
import { TownhallParams } from '../types';

const router = Router();

/**
 * gets questions associated with the townhalls
 */
router.get<TownhallParams, Question<ObjectId>[]>(
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

router.use(
    '/:townhallId/questions/:questionId',
    makeJoiMiddleware({
        params: Joi.object(makeObjectIdValidationObject('questionId')).unknown(
            true
        ),
    })
);
/**
 * gets a particular question
 */
router.get<QuestionParams, Question<ObjectId>, void, void, void>(
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
    requireLogin(['organizer', 'admin']),
    makeEndpoint(async (req, res) => {
        const { user } = req.results;
        const { questionId, townhallId } = req.params;
        await deleteQuestion(questionId, townhallId, user._id);
        res.sendStatus(200);
    })
);

/**
 * likes a question
 */
router.put<QuestionParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/questions/:questionId/like',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { user } = req.results;
        const { questionId, townhallId } = req.params;
        await likeQuestion(questionId, townhallId, user._id);
        // TODO: remove this, shouldn't be here but for now it gets the job done
        const isMod = await isModerator(
            townhallId,
            user.email.address,
            user._id
        );
        if (isMod) await addQuestionToList(townhallId, questionId);
        // ******************************************************************

        res.sendStatus(200);
    })
);

/**
 * removes a like from a question
 */
router.delete<QuestionParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/questions/:questionId/like',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { user } = req.results;
        const { questionId, townhallId } = req.params;
        await deleteLike(questionId, townhallId, user._id);

        // TODO: remove this, shouldn't be here but for now it gets the job done
        const isMod = await isModerator(
            townhallId,
            user.email.address,
            user._id
        );
        if (isMod) await removeQuestionFromList(townhallId, questionId);
        // ******************************************************************

        res.sendStatus(200);
    })
);

export default router;
