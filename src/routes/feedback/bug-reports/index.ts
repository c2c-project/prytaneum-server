/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import { ObjectId } from 'mongodb';
import type { BugReportForm, BugReport, ReportReplyForm } from 'prytaneum-typings';

import {
    createBugReport,
    deleteBugReport,
    getBugReports,
    getBugReportsByUser,
    replyToBugReport,
    updateBugReport,
    updateResolvedStatus,
} from 'modules/bug-reports';

import {
    bugReportValidationObject,
    getBugReportQueries,
    getBugReportQueriesAdmin,
    updateResolvedStatusValidationObject,
    replyValidationObject,
} from 'modules/bug-reports/validators';

import { makeJoiMiddleware, makeEndpoint, requireLogin, RequireLoginLocals } from 'middlewares';
import { makeObjectIdValidationObject } from 'utils/validators';
import { ReportQueryParams, ReportQueryParamsAdmin, ReportParams, ReportsResult } from '../types';

const router = Router();

router.get<Express.EmptyParams, ReportsResult<BugReport<ObjectId>>, void, ReportQueryParams, RequireLoginLocals>(
    '/',
    requireLogin(),
    makeJoiMiddleware({ query: Joi.object(getBugReportQueries) }),
    makeEndpoint(async (req, res) => {
        const { page, sortByDate } = req.query;
        const { user } = req.results;
        const _sortByDate = sortByDate === '' || !sortByDate ? 'true' : sortByDate;
        const { bugReports, totalCount } = await getBugReportsByUser(
            parseInt(page, 10),
            _sortByDate === 'true',
            user._id
        );
        res.status(200).send({ reports: bugReports, count: totalCount });
    })
);

/**
 * gets a list of of all bug reports, caller must have admin permission
 */
router.get<Express.EmptyParams, ReportsResult<BugReport<ObjectId>>, void, ReportQueryParamsAdmin>(
    '/admin',
    requireLogin(['admin']),
    makeJoiMiddleware({ query: Joi.object(getBugReportQueriesAdmin) }),
    makeEndpoint(async (req, res) => {
        const { page, sortByDate, resolved } = req.query;
        const _sortByDate = sortByDate === '' || !sortByDate ? 'true' : sortByDate;
        const { bugReports, totalCount } = await getBugReports(
            parseInt(page, 10),
            _sortByDate === 'true',
            resolved === 'true'
        );
        res.status(200).send({ reports: bugReports, count: totalCount });
    })
);

/**
 * validator used for validating the townhallId parameter
 */
const validateBugReportTownHallIdParam = makeJoiMiddleware({
    params: Joi.object(makeObjectIdValidationObject('townhallId')).unknown(true),
});
router.use('/:townhallId', validateBugReportTownHallIdParam);

/**
 * creates a new bug report by the user
 */
router.post<ReportParams, void, BugReportForm, void, RequireLoginLocals>(
    '/:townhallId',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object(bugReportValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { description } = req.body;
        const { user } = req.results;
        await createBugReport(description, townhallId, user);
        res.sendStatus(200);
    })
);

/**
 * validator used for validating the report id parameter
 */
const validateBugReportParams = makeJoiMiddleware({
    params: Joi.object(makeObjectIdValidationObject('reportId')).unknown(true),
});

/**
 * validates all report id params that are exactly /:reportId
 */
router.use('/:reportId', validateBugReportParams);
router.use('/:reportId/*', validateBugReportParams);

/**
 * updates a bug report (only the form fields)
 */
router.put<ReportParams, void, BugReportForm, void, RequireLoginLocals>(
    '/:reportId',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object(bugReportValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { description } = req.body;
        const { reportId } = req.params;
        const { user } = req.results;
        await updateBugReport(reportId, description, user);
        res.sendStatus(200);
    })
);

/**
 * deletes a bug report
 */
router.delete<ReportParams, void, void, void, RequireLoginLocals>(
    '/:reportId',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { reportId } = req.params;
        await deleteBugReport(reportId);
        res.sendStatus(200);
    })
);

/**
 * updates the resolved status of a bug report caller must have admin permission
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
 * adds a reply to a bug report. Caller must be an admin
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
        await replyToBugReport(user, reportId, content);
        res.sendStatus(200);
    })
);

export default router;
