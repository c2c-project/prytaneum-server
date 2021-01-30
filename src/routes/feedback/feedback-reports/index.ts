/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import { ObjectId } from 'mongodb';
import type { FeedbackReportForm, FeedbackReport } from 'prytaneum-typings';

import {
    createFeedbackReport,
    deleteFeedbackReport,
    getFeedbackReportById,
    getFeedbackReports,
    getFeedbackReportsByUser,
    replyToFeedbackReport,
    updateFeedbackReport,
    updateResolvedStatus,
} from 'modules/feedback-reports';
import {
    feedbackReportValidationObject,
    getFeedbackReportQueries,
    getFeedbackReportQueriesAdmin,
    updateResolvedStatusValidationObject,
    replyValidationObject,
} from 'modules/feedback-reports/validators';
import {
    makeJoiMiddleware,
    makeEndpoint,
    requireLogin,
    RequireLoginLocals,
} from 'middlewares';
import { makeObjectIdValidationObject } from 'utils/validators';
import {
    ReportQueryParams,
    ReportQueryParamsAdmin,
    ReportParams,
} from '../types';

const router = Router();

router.get<
    Express.EmptyParams,
    FeedbackReport<ObjectId>[],
    void,
    ReportQueryParams,
    RequireLoginLocals
>(
    '/',
    requireLogin(),
    makeJoiMiddleware({ query: Joi.object(getFeedbackReportQueries) }),
    makeEndpoint(async (req, res) => {
        const { page, sortByDate } = req.query;
        const { user } = req.results;
        const feedbackReports = await getFeedbackReportsByUser(
            parseInt(page, 10),
            sortByDate === 'true',
            user
        );
        res.status(200).send(feedbackReports);
    })
);

/**
 * gets the list of of all feedback reports, caller must have admin permission
 */
router.get<
    Express.EmptyParams,
    FeedbackReport<ObjectId>[],
    void,
    ReportQueryParamsAdmin
>(
    '/admin',
    requireLogin(['admin']),
    makeJoiMiddleware({ query: Joi.object(getFeedbackReportQueriesAdmin) }),
    makeEndpoint(async (req, res) => {
        const { page, sortByDate, resolved } = req.query;
        const feedbackReports = await getFeedbackReports(
            parseInt(page, 10),
            sortByDate === 'true',
            resolved === 'true'
        );
        res.status(200).send(feedbackReports);
    })
);
/**
 * creates a new feedback report by the user
 */
router.post<
    Express.EmptyParams,
    void,
    FeedbackReportForm,
    void,
    RequireLoginLocals
>(
    '/',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object(feedbackReportValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { description } = req.body;
        await createFeedbackReport(description, req.results.user);
        res.sendStatus(200);
    })
);

/**
 * validator used for validating the report id parameter
 */
const validateFeedbackReportParams = makeJoiMiddleware({
    params: Joi.object(makeObjectIdValidationObject('reportId')).unknown(true),
});

/**
 * validates all report id params that are exactly /:reportId
 */
router.use('/:reportId', validateFeedbackReportParams);

router.use('/:reportId/*', validateFeedbackReportParams);

/**
 * updates a particular feedback form (only the form fields)
 */
router.put<ReportParams, void, FeedbackReportForm, void, RequireLoginLocals>(
    '/:reportId',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object(feedbackReportValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { description } = req.body;
        const { reportId } = req.params;

        const { user } = req.results;
        const feedbackReport = await getFeedbackReportById(reportId);

        if (!feedbackReport) {
            throw Error('Feedback report does not exist');
        }
        if (feedbackReport.meta.createdBy._id !== user._id) {
            throw Error('Calling user is not owner of the report');
        }

        await updateFeedbackReport(reportId, description);
        res.sendStatus(200);
    })
);

/**
 * deletes a particular feedback report
 */
router.delete<ReportParams, void, void, void, RequireLoginLocals>(
    '/:reportId',
    makeEndpoint(async (req, res) => {
        const { reportId } = req.params;
        const { user } = req.results;
        const feedbackReport = await getFeedbackReportById(reportId);

        if (!feedbackReport) {
            throw Error('Feedback report does not exist');
        }
        if (feedbackReport.meta.createdBy._id !== user._id) {
            throw Error('Calling user is not owner of the report');
        }

        await deleteFeedbackReport(reportId);
        res.sendStatus(200);
    })
);

/**
 * updates the resolved status of a feedback report caller must have admin permission
 */

// TODO: Update the meta object to be updated by admin caller of this endpoint
router.put<ReportParams, void, { resolvedStatus: boolean }, void>(
    '/:reportId/update-resolved-status',
    requireLogin(['admin']),
    makeJoiMiddleware({
        body: Joi.object(updateResolvedStatusValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { reportId } = req.params;
        const { resolvedStatus } = req.body;
        await updateResolvedStatus(reportId, resolvedStatus);
        res.status(200);
    })
);

/**
 * adds a reply to particular feedback report caller must have admin permission
 */
router.put<ReportParams, void, { reply: string }, void, RequireLoginLocals>(
    '/:reportId/reply-to',
    requireLogin(['admin']),
    makeJoiMiddleware({
        body: Joi.object(replyValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { reportId } = req.params;
        const { reply } = req.body;
        const { user } = req.results;
        await replyToFeedbackReport(user, reportId, reply);
        res.status(200);
    })
);

export default router;
