import { ObjectID } from 'mongodb';
import type { User } from 'prytaneum-typings';
import createHttpError from 'http-errors';

import { useCollection } from 'db';
import { makeMeta, makeUpdatedBy } from 'modules/common';

const numberOfDocumentsPerPage = 10;
/**
 * @description Creates a new bug report
 * @param {string} description - Description of the bug report
 * @param {string} townhallId - Id of the townhall session where the bug occurred
 * @param {User} user - Represents the submitter of the bug report
 * @returns Void promise
 * @throws {Error} If unable to insert the bug report
 */
export async function createBugReport(
    description: string,
    townhallId: string,
    user: User
) {
    const { createdAt, createdBy, updatedAt, updatedBy } = makeMeta(user);
    const { insertedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.insertOne({
            description,
            resolved: false,
            replies: [],
            townhallId: new ObjectID(townhallId),
            meta: {
                createdAt,
                updatedAt,
                updatedBy: {
                    ...updatedBy,
                    _id: new ObjectID(updatedBy._id),
                },
                createdBy: {
                    ...createdBy,
                    _id: new ObjectID(createdBy._id),
                },
            },
        })
    );
    if (insertedCount === 0) throw new Error('Unable to create bug report');
}

/**
 * @description Retrieves at most 10 bug reports, depending on the page number
 * @param {number} page - Page number to return. If the page number exceeds the number of available pages, 0 reports are returned
 * @param {boolean} sortByDate - Sort by date order. True for ascending. False for descending
 * @param {boolean} resolved - Resolved status of reports to retrieve
 * @returns {Promise} - promise that will produce an array of bug reports and the total count of bug reports in the database
 */
export async function getBugReports(
    page: number,
    sortByDate: boolean,
    resolved?: boolean
) {
    const resolvedQuery = typeof resolved === 'boolean' ? { resolved } : {};
    const totalCount = await useCollection('BugReports', (BugReports) =>
        BugReports.countDocuments(resolvedQuery)
    );
    const bugReports = await useCollection('BugReports', (BugReports) =>
        BugReports.find(resolvedQuery)
            .sort({ date: sortByDate ? 1 : -1 })
            .skip(page > 0 ? numberOfDocumentsPerPage * (page - 1) : 0)
            .limit(numberOfDocumentsPerPage)
            .toArray()
    );
    return { bugReports, totalCount };
}

/**
 * @description Retrieves at most 10 bug reports from a specific user, depending on the page number
 * @param {number} page - Page number to return. If the page number exceeds the number of available pages, 0 reports are returned
 * @param {boolean} sortByDate - Sort by date order. True for ascending. False for descending
 * @param {string} userId - Id of the user
 * @returns {Promise} - Promise that will produce an array of bug reports and the total count of bug reports submitted by the user
 */
export async function getBugReportsByUser(
    page: number,
    sortByDate: boolean,
    userId: string
) {
    const totalCount = await useCollection('BugReports', (BugReports) =>
        BugReports.countDocuments({
            'meta.createdBy._id': new ObjectID(userId),
        })
    );
    const bugReports = await useCollection('BugReports', (BugReports) =>
        BugReports.find({
            'meta.createdBy._id': new ObjectID(userId),
        })
            .sort({ date: sortByDate ? 1 : -1 })
            .skip(page > 0 ? numberOfDocumentsPerPage * (page - 1) : 0)
            .limit(numberOfDocumentsPerPage)
            .toArray()
    );
    return { bugReports, totalCount };
}

/**
 * @description Retrieves one bug report by Id
 * @param {string} _id - Id of the bug report to return
 * @returns {Promise<BugReport | null>} - Promise that produces a bug report or null if no bug report was found in the collection
 */
export function getBugReportById(_id: string) {
    return useCollection('BugReports', (BugReports) =>
        BugReports.findOne({ _id: new ObjectID(_id) })
    );
}

/**
 * @description Updates the description of a bug report specified by its unique Id
 * @param {string} reportId - Id of the bug report to update
 * @param {string} newDescription - New description of the bug report
 * @returns {Promise} Void promise
 * @throws {Error} If unable to update the specified bug report
 */
export async function updateBugReport(
    reportId: string,
    newDescription: string
) {
    const { upsertedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            { _id: new ObjectID(reportId) },
            { $set: { description: newDescription } }
        )
    );
    if (upsertedCount === 0) throw new Error('Unable to update bug report');
}

/**
 * @description Deletes a bug report by Id
 * @param {string} reportId - Id of the feedback report to delete
 * @returns {Promise} Void promise
 * @throws {Error} If specified feedback report to delete does not exist
 */
export async function deleteBugReport(reportId: string) {
    const { deletedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.deleteOne({ _id: new ObjectID(reportId) })
    );
    if (deletedCount === 0) throw createHttpError(404, 'Bug report not found');
}

/**
 * @description Sets the resolved attribute of a bug report to the new resolved status provided
 * @param {string} reportId - Id of the report
 * @param {boolean} newResolvedStatus - new resolved status
 * @param {User} user - User object of updater
 * @returns {Promise} Void promise
 * @throws {Error} If unable to update the status of the specified feedback report
 */
export async function updateResolvedStatus(
    reportId: string,
    newResolvedStatus: boolean,
    user: User
) {
    const {
        updatedAt,
        updatedBy: { _id, name },
    } = makeUpdatedBy(user);
    const { upsertedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            { _id: new ObjectID(reportId) },
            {
                $set: {
                    resolved: newResolvedStatus,
                    'meta.updatedAt': updatedAt,
                    'meta.updatedBy._id': new ObjectID(_id),
                    'meta.updatedBy.name': name,
                },
            }
        )
    );
    if (upsertedCount === 0)
        throw new Error('Unable to update resolved status of bug report');
}

/**
 * @description Adds a reply to bug a report
 * @param {Object} user - User object of the replier
 * @param {string} reportId - Id of the report
 * @param {string} replyContent - Content of the reply
 * @returns Void promise
 * @throws {Error} If unable to add reply to bug report
 */
export async function replyToBugReport(
    user: User,
    reportId: string,
    replyContent: string
) {
    const { upsertedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            { _id: new ObjectID(reportId) },
            {
                $push: {
                    replies: {
                        $each: [
                            {
                                content: replyContent,
                                meta: makeMeta(user),
                            },
                        ],
                        $sort: { repliedDate: 1 },
                    },
                },
            }
        )
    );
    if (upsertedCount === 0)
        throw new Error('Unable to reply to the bug report');
}
