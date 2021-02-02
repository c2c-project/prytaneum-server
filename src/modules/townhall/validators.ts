/* eslint-disable import/no-extraneous-dependencies */
import Joi from 'joi';
import { TownhallForm, RatingForm } from 'prytaneum-typings';

type TownhallValidator = Record<keyof TownhallForm, Joi.Schema>;
export const townhallValidationObject: TownhallValidator = {
    title: Joi.string().required(),
    date: Joi.string().required(),
    description: Joi.string().required(),
    private: Joi.bool().required(),
    topic: Joi.string().required(),
};

type TownhallRatingValidator = Record<keyof RatingForm, Joi.Schema>;
export const ratingValidationObject: TownhallRatingValidator = {
    values: Joi.array().required(),
    feedback: Joi.string().required()
};
