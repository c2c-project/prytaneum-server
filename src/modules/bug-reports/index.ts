import { ObjectID, ObjectId } from 'mongodb';
import type { User } from 'prytaneum-typings';
import createHttpError from 'http-errors';

import { useCollection } from 'db';
import { makeMeta } from 'modules/common';

const numberOfDocumentsPerPage = 10;
/**
 * @description Creates a new bug report
 * @param {string} description - Description of the bug report
 * @param {string} townhallId - Id of the townhall session where the bug occurred
 * @param {User} user - Represents the submitter of the bug report
 * @returns Void promise
 * @throws {Error} If unable to insert the bug report
 */
export async function createBugReport(description: string, townhallId: string, user: User<ObjectId>) {
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

    if (insertedCount === 0) throw createHttpError(400, 'Unable to create bug report');
}

/**
 * @description Retrieves at most 10 bug reports, depending on the page number
 * @param {number} page - Page number to return. If the page number exceeds the number of available pages, 0 reports are returned
 * @param {boolean} sortByDate - Sort by date order. True for ascending. False for descending
 * @param {boolean} resolved - Resolved status of reports to retrieve
 * @returns {Promise} - promise that will produce an array of bug reports and the total count of bug reports in the database
 */
export async function getBugReports(page: number, sortByDate: boolean, resolved?: boolean) {
    const resolvedQuery = typeof resolved === 'boolean' ? { resolved } : {};
    const totalCount = await useCollection('BugReports', (BugReports) => BugReports.countDocuments(resolvedQuery));
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
export async function getBugReportsByUser(page: number, sortByDate: boolean, userId: ObjectId) {
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
 * @description Updates the description of a bug report specified by its unique Id
 * @param {string} reportId - Id of the bug report to update
 * @param {string} newDescription - New description of the bug report
 * @param {User} user - User that made the request
 * @returns {Promise} Void promise
 * @throws {Error} If provided report id is invalid or if unable to update the specified bug report
 */
export async function updateBugReport(reportId: string, newDescription: string, user: User<ObjectId>) {
    if (!ObjectID.isValid(reportId)) throw createHttpError(400, 'Invalid report id provided');

    const { modifiedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            {
                _id: new ObjectID(reportId),
                'meta.createdBy._id': new ObjectID(user._id),
            },
            {
                $set: {
                    'meta.updatedAt': new Date(),
                    'meta.updatedBy': user,
                    description: newDescription,
                },
            },
            {
                upsert: false,
            }
        )
    );

    if (modifiedCount === 0) throw createHttpError(401, 'You must be the creator in order to modify the bug report');
}

// TODO: extend this to write to a trash collection rather than actually delete
/**
 * @description Deletes a bug report by Id
 * @param {string} reportId - Id of the bug report to delete
 * @returns {Promise} Void promise
 * @throws {Error} If provided report id is invalid or if specified bug report to delete does not exist
 */
export async function deleteBugReport(reportId: string) {
    if (!ObjectID.isValid(reportId)) throw createHttpError(400, 'Invalid report id provided');

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
 * @throws {Error} If provided report id is invalid or if unable to update the status of the specified bug report
 */
export async function updateResolvedStatus(reportId: string, newResolvedStatus: boolean, user: User<ObjectId>) {
    if (!ObjectID.isValid(reportId)) throw createHttpError(400, 'Invalid report id provided');

    const { modifiedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            { _id: new ObjectID(reportId) },
            {
                $set: {
                    'meta.updatedAt': new Date(),
                    'meta.updatedBy.by': user,
                    resolved: newResolvedStatus,
                },
            },
            {
                upsert: false,
            }
        )
    );

    if (modifiedCount === 0) throw createHttpError(404, 'Could not update resolved status of bug report');
}

/**
 * @description Adds a reply to bug a report
 * @param {Object} user - User object of the replier
 * @param {string} reportId - Id of the report
 * @param {string} content - Content of the reply
 * @returns Void promise
 * @throws {Error} If provided report id is invalid or if unable to add reply to bug report
 */
export async function replyToBugReport(user: User<ObjectId>, reportId: string, content: string) {
    const { modifiedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            { _id: new ObjectID(reportId) },
            {
                $push: {
                    replies: {
                        $each: [
                            {
                                content,
                                meta: makeMeta(user),
                            },
                        ],
                        $sort: { repliedDate: 1 },
                    },
                },
                $set: {
                    'meta.updatedAt': new Date(),
                    'meta.updatedBy': user,
                },
            },
            {
                upsert: false,
            }
        )
    );

    if (modifiedCount === 0) throw createHttpError(400, 'Could not submit reply');
}
