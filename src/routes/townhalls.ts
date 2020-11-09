/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';

import { createTownhall, getTownhall } from 'modules/townhall';
import { makeJoiMiddleware, requireRoles } from 'middlewares';

const router = Router();

/**
 * gets the list of townhalls owned by the user
 */
router.get(
    '/',
    requireRoles(['organizer']),
    makeJoiMiddleware({
        body: Joi.object({
            page: Joi.number(),
            limit: Joi.number(),
            skip: Joi.number(),
            sort_by: Joi.string(),
            dir: Joi.string().equal('asc', 'desc'),
        }),
    }),
    // TODO: pagination middleware that does joi + extracts query to a mongodb query + any other validation needed
    (req, res, next) => {
        // const query = req.query as {
        //     page: number;
        //     limit: number;
        //     skip: number;
        //     sort_by: string;
        //     dir: 'asc' | 'desc';
        // };
    }
);
/**
 * creates a new townhall by the user
 */
router.post('/', requireRoles(['organizer'], ['admin']), () => {});

/**
 * gets a particular townhall, there's no private data, so all data is sent to the client
 * TODO: check if all of the data is actually not sensitive
 */
router.get('/:townhallId', () => {});
/**
 * updates a particular townhall
 */
router.put('/:townhallId', requireRoles(['organizer'], ['admin']), () => {});
/**
 * deletes a particular townhall
 */
router.delete('/:townhallId', requireRoles(['organizer'], ['admin']), () => {});

/**
 * gets questions associated with the townhalls
 */
router.get('/:townhallId/questions', () => {});
/**
 * creates a new question for the townhall
 */
router.post('/:townhallId/questions', () => {});
/**
 * updates a particular question
 */
router.put('/:townhallId/questions/:questionId', () => {});
/**
 * deletes a particular question
 */
router.delete('/:townhallId/questions/:questionId', () => {});

export default router;
