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
    content: Joi.string().required(),
};

export const getFeedbackReportQueries = {
    page: Joi.string()
        .pattern(/^[0-9]+$/)
        .required(),
    sortByDate: Joi.string().valid('true', 'false').optional(),
};

export const getFeedbackReportQueriesAdmin = {
    ...getFeedbackReportQueries,
    resolved: Joi.string().valid('true', 'false').required(),
};
