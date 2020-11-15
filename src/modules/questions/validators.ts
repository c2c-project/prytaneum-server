/* eslint-disable import/prefer-default-export */
import { QuestionForm } from 'prytaneum-typings';
import Joi from 'joi';

type QuestionValidator = Record<keyof QuestionForm, Joi.Schema>;
export const questionFormValidationObject: QuestionValidator = {
    question: Joi.string().required(), // TODO: limit text? something like 500 characters?
};
