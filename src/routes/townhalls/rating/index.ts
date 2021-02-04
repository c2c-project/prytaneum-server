import { Router } from 'express';
import Joi from 'joi';
import type { RatingForm } from 'prytaneum-typings';
import { ratingValidationObject } from 'modules/townhall/validators';
import API from 'modules/rating';

import { makeJoiMiddleware, makeEndpoint } from 'middlewares';
import { TownhallParams, RatingParams } from '../types';

const router = Router();

router.put<TownhallParams, void, RatingForm, RatingParams>(
    '/:townhallId/rating',
    makeJoiMiddleware({
        body: Joi.object(ratingValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { userId } = req.query;
        await API.addRating(req.body, townhallId, userId);
        res.status(200).send();
    })
);

export default router;
