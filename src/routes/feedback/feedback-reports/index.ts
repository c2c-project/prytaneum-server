/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import { ObjectId } from 'mongodb';
import type { FeedbackReportForm, FeedbackReport, ReportReplyForm } from 'prytaneum-typings';

import {
    createFeedbackReport,
    deleteFeedbackReport,
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
import { makeJoiMiddleware, makeEndpoint, requireLogin, RequireLoginLocals } from 'middlewares';
import { makeObjectIdValidationObject } from 'utils/validators';
import { ReportQueryParams, ReportQueryParamsAdmin, ReportParams, ReportsResult } from '../types';

const router = Router();

router.get<Express.EmptyParams, ReportsResult<FeedbackReport<ObjectId>>, void, ReportQueryParams, RequireLoginLocals>(
    '/',
    requireLogin(),
    makeJoiMiddleware({ query: Joi.object(getFeedbackReportQueries) }),
    makeEndpoint(async (req, res) => {
        const { page, sortByDate } = req.query;
        const { user } = req.results;
        const _sortByDate = sortByDate === '' || !sortByDate ? 'true' : sortByDate;
        const { feedbackReports, totalCount } = await getFeedbackReportsByUser(
            parseInt(page, 10),
            _sortByDate === 'true',
            user._id
        );
        res.status(200).send({ reports: feedbackReports, count: totalCount });
    })
);

/**
 * gets a list of of all feedback reports, caller must have admin permission
 */
router.get<Express.EmptyParams, ReportsResult<FeedbackReport<ObjectId>>, void, ReportQueryParamsAdmin>(
    '/admin',
    requireLogin(['admin']),
    makeJoiMiddleware({ query: Joi.object(getFeedbackReportQueriesAdmin) }),
    makeEndpoint(async (req, res) => {
        const { page, sortByDate, resolved } = req.query;
        const _sortByDate = sortByDate === '' || !sortByDate ? 'true' : sortByDate;
        const { feedbackReports, totalCount } = await getFeedbackReports(
            parseInt(page, 10),
            _sortByDate === 'true',
            resolved === 'true'
        );
        res.status(200).send({ reports: feedbackReports, count: totalCount });
    })
);
/**
 * creates a new feedback report by the user
 */
router.post<Express.EmptyParams, void, FeedbackReportForm, void, RequireLoginLocals>(
    '/',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object(feedbackReportValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { description } = req.body;
        const { user } = req.results;
        await createFeedbackReport(description, user);
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
 * updates a feedback report (only the form fields)
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
        await updateFeedbackReport(reportId, description, user);
        res.sendStatus(200);
    })
);

/**
 * deletes a feedback report
 */
router.delete<ReportParams, void, void, void, RequireLoginLocals>(
    '/:reportId',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { reportId } = req.params;
        await deleteFeedbackReport(reportId);
        res.sendStatus(200);
    })
);

/**
 * updates the resolved status of a feedback report caller must have admin permission
 */
router.put<ReportParams, void, { resolvedStatus: boolean }, void, RequireLoginLocals>(
    '/:reportId/resolved-status',
    requireLogin(['admin']),
    makeJoiMiddleware({
        body: Joi.object(updateResolvedStatusValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { reportId } = req.params;
        const { resolvedStatus } = req.body;
        const { user } = req.results;
        await updateResolvedStatus(reportId, resolvedStatus, user);
        res.sendStatus(200);
    })
);

/**
 * adds a reply to a feedback report. Caller must be an admin
 */
router.put<ReportParams, void, ReportReplyForm, void, RequireLoginLocals>(
    '/:reportId/reply',
    requireLogin(['admin']),
    makeJoiMiddleware({
        body: Joi.object(replyValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { reportId } = req.params;
        const { content } = req.body;
        const { user } = req.results;
        await replyToFeedbackReport(user, reportId, content);
        res.sendStatus(200);
    })
);

export default router;
