/* eslint-disable import/prefer-default-export */
import Joi from 'joi';
import type { BugReportForm } from 'prytaneum-typings';

type BugReportValidator = Record<keyof BugReportForm, Joi.Schema>;

export const bugReportValidationObject: BugReportValidator = {
    description: Joi.string().required(),
};

export const updateResolvedStatusValidationObject = {
    resolvedStatus: Joi.boolean().required(),
};

export const replyValidationObject = {
    reply: Joi.string().required(),
};

// TODO: Add more robust validation for query params.Right now they receive any strings. Or maybe that could  be handled in a global pagination middleware?
export const getBugReportQueries = {
    page: Joi.string().required(),
    sortByDate: Joi.string().required(),
};

export const getBugReportQueriesAdmin = {
    ...getBugReportQueries,
    resolved: Joi.string().required(),
};
