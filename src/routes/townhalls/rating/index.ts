import { Router } from 'express';
import Joi from 'joi';
import makeDebug from 'debug';
// eslint-disable-next-line import/no-extraneous-dependencies
import { RatingForm } from 'prytaneum-typings';
import { ratingValidationObject } from 'modules/townhall/validators';
import API from 'modules/rating';

import {
    makeJoiMiddleware,
    makeEndpoint,
    requireLogin,
    RequireLoginLocals,
} from 'middlewares';
import { TownhallParams } from '../types';

const info = makeDebug('prytaneum:db');

const router = Router();

router.put<TownhallParams, void, RatingForm, void, RequireLoginLocals>(
    '/:townhallId/rating',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object(ratingValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { user } = req.results;
        const { townhallId } = req.params;
        info(user, townhallId, user);
        await API.addRating(req.body, townhallId, user._id);
        res.status(200).send();
    })
);

export default router;
