/* eslint-disable import/prefer-default-export */
import Joi from 'joi';
import type { FeedbackReportForm } from 'prytaneum-typings';

type FeedbackReportValidator = Record<keyof FeedbackReportForm, Joi.Schema>;

export const feedbackReportValidationObject: FeedbackReportValidator = {
    description: Joi.string().required(),
};
