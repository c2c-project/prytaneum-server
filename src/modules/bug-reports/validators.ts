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
    content: Joi.string().required(),
};

export const getBugReportQueries = {
    page: Joi.string()
        .pattern(/^[0-9]+$/)
        .required(),
    sortByDate: Joi.string().valid('true', 'false').required(),
};

export const getBugReportQueriesAdmin = {
    ...getBugReportQueries,
    resolved: Joi.string().valid('true', 'false').required(),
};
