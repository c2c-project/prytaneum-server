/* eslint-disable import/prefer-default-export */
import Joi from 'joi';
import type { FeedbackReportForm } from 'prytaneum-typings';

type FeedbackReportValidator = Record<keyof FeedbackReportForm, Joi.Schema>;

export const feedbackReportValidationObject: FeedbackReportValidator = {
    description: Joi.string().required(),
};

export const updateResolvedStatusValidationObject = {
    resolvedStatus: Joi.boolean().required(),
};

export const replyValidationObject = {
    reply: Joi.string().required(),
};

// TODO: Add more robust validation for query params
export const getFeedbackReportQueries = {
    page: Joi.string().required(),
    sortByDate: Joi.string().required(),
};

export const getFeedbackReportQueriesAdmin = {
    ...getFeedbackReportQueries,
    resolved: Joi.string().required(),
};
