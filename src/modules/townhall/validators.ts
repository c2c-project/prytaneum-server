/* eslint-disable import/prefer-default-export */
import Joi from 'joi';
import { TownhallForm } from 'prytaneum-typings';

type TownhallValidator = Record<keyof TownhallForm, Joi.Schema>;
export const townhallValidationObject: TownhallValidator = {
    title: Joi.string().required(),
    date: Joi.string().required(),
    description: Joi.string().required(),
    private: Joi.bool().required(),
    topic: Joi.string().required(),
};
