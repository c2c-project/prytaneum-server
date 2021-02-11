import { Router } from 'express';
import { ObjectId } from 'mongodb';
import Joi from 'joi';
import type { RatingForm, Rating } from 'prytaneum-typings';
import { ratingValidationObject } from 'modules/townhall/validators';
import API from 'modules/rating';

import { makeJoiMiddleware, makeEndpoint } from 'middlewares';
import { TownhallParams, RatingParams } from '../types';

const router = Router();

router.put<TownhallParams, void, RatingForm, RatingParams>(
    '/:townhallId/ratings',
    makeJoiMiddleware({
        body: Joi.object(ratingValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        await API.addRating(req.body, townhallId);
        res.status(200).send();
    })
);

router.get<TownhallParams, Rating<ObjectId>, void, void>(
    '/:townhallId/ratings',
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const ratings = await API.getRatings(townhallId);
        res.status(200).send(ratings);
    })
);

export default router;
