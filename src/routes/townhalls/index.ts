/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import passport from 'passport';

import {
    createTownhall,
    getTownhall,
    getTownhalls,
    updateTownhall,
    deleteTownhall,
} from 'modules/townhall';
import { getQuestions } from 'modules/questions';
import { townhallValidationObject } from 'modules/townhall/validators';
import { makeJoiMiddleware, requireRoles, makeEndpoint } from 'middlewares';
import { TownhallForm, User } from 'prytaneum-typings';

const router = Router();

/**
 * gets the list of townhalls owned by the user
 */
router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    requireRoles(['organizer']),
    // TODO: pagination middleware that does joi + extracts query to a mongodb query + any other validation needed
    makeEndpoint(async (req, res) => {
        const townhalls = await getTownhalls();
        res.status(200).send(townhalls);
    })
);
/**
 * creates a new townhall by the user
 */
router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    requireRoles(['organizer', 'admin']),
    makeJoiMiddleware({
        body: Joi.object(townhallValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const townhallForm = req.body as TownhallForm;
        await createTownhall(townhallForm, req.user as User);
        res.sendStatus(200);
    })
);

/**
 * validates all townhall id params
 */
router.all(
    '/:townhallId',
    makeJoiMiddleware({
        params: Joi.object({
            townhallId: Joi.string().required(),
        }),
    })
);

/**
 * gets a particular townhall, there's no private data, so all data is sent to the client
 * TODO: check if all of the data is actually not sensitive
 */
router.get(
    '/:townhallId',
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params as { townhallId: string };
        const townhall = await getTownhall(townhallId);
        res.status(200).send(townhall);
    })
);
/**
 * updates a particular townhall (only the form fields)
 */
router.put(
    '/:townhallId',
    passport.authenticate('jwt', { session: false }),
    requireRoles(['organizer', 'admin']),
    makeJoiMiddleware({
        body: Joi.object(townhallValidationObject),
        // NOTE: params should already be validated from the router.all above
    }),
    makeEndpoint(async (req, res) => {
        const townhallForm = req.body as TownhallForm;
        const { townhallId } = req.params as { townhallId: string };
        const { user } = req as { user: User };
        await updateTownhall(townhallForm, townhallId, user);
        res.sendStatus(200);
    })
);
/**
 * deletes a particular townhall
 */
router.delete(
    '/:townhallId',
    passport.authenticate('jwt', { session: false }),
    requireRoles(['organizer', 'admin']),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params as { townhallId: string };
        await deleteTownhall(townhallId);
        res.sendStatus(200);
    })
);

/**
 * gets questions associated with the townhalls
 */
router.get(
    '/:townhallId/questions',
    // TODO: pagination
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params as { townhallId: string };
        const questions = await getQuestions(townhallId);
        res.status(200).send(questions);
    })
);
/**
 * creates a new question for the townhall
 */
router.post(
    '/:townhallId/questions',
    makeEndpoint(() => {})
);
/**
 * gets a particular question
 */
router.get(
    '/:townhallId/questions/:questionId',
    makeEndpoint(() => {})
);
/**
 * updates a particular question
 */
router.put(
    '/:townhallId/questions/:questionId',
    makeEndpoint(() => {})
);
/**
 * deletes a particular question
 */
router.delete(
    '/:townhallId/questions/:questionId',
    makeEndpoint(() => {})
);

export default router;
