import { Router } from 'express';
import { ObjectId } from 'mongodb';
import Joi from 'joi';
import type { RatingForm, Rating, User } from 'prytaneum-typings';
import { ratingValidationObject } from 'modules/townhall/validators';
import API from 'modules/rating';
import JWT from 'lib/jwt';

import { makeJoiMiddleware, makeEndpoint, getCookies } from 'middlewares';
import { TownhallParams, RatingParams } from '../types';

const router = Router();

router.post<TownhallParams, void, RatingForm, RatingParams>(
    '/:townhallId/ratings',
    makeJoiMiddleware({
        body: Joi.object(ratingValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const cookies = getCookies(req);
        if (!cookies.jwt) {
            await API.addRating(req.body, townhallId);
        } else {
            const { jwt } = cookies;
            const { _id, name } = await JWT.verify<User>(jwt);
            await API.addRating(req.body, townhallId, _id, name);
        }

        res.status(200).send();
    })
);

router.get<TownhallParams, Array<Rating<ObjectId>>, void, void>(
    '/:townhallId/ratings',
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const ratings = await API.getRatings(townhallId);
        res.status(200).send(ratings);
    })
);

export default router;
