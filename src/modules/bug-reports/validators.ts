/* eslint-disable import/prefer-default-export */
import Joi from 'joi';
import type { BugReportForm } from 'prytaneum-typings';

type BugReportData = BugReportForm & { townhallId: string };

type BugReportValidator = Record<keyof BugReportData, Joi.Schema>;

export const feedbackReportValidationObject: BugReportValidator = {
    description: Joi.string().required(),
    townhallId: Joi.string().required(),
};
