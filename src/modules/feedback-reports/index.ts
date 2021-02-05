import { ObjectID } from 'mongodb';
import type { User } from 'prytaneum-typings';
import createHttpError from 'http-errors';

import { useCollection } from 'db';
import { makeMeta, makeUpdatedBy } from 'modules/common';

const numberOfDocumentsPerPage = 10;

/**
 * @description Creates a new feedback report
 * @param {string} description - Description of the feedback report
 * @param {User} user - Represents the submitter of the feedback report
 * @throws {Error} If unable to insert the feedback report
 * @returns MongoDB promise
 */
export async function createFeedbackReport(description: string, user: User) {
    const { createdAt, createdBy, updatedAt, updatedBy } = makeMeta(user);
    const { insertedCount } = await useCollection(
        'FeedbackReports',
        (FeedbackReports) =>
            FeedbackReports.insertOne({
                description,
                resolved: false,
                replies: [],
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

    if (insertedCount === 0)
        throw new Error('Unable to create feedback report');
}

/**
 * @description Retrieves at most 10 feedback reports, depending on the page number
 * @param {number} page - Page number to return. If the page number exceeds the number of available pages, 0 reports are returned
 * @param {boolean} sortByDate - Sort by date order. True for ascending. False for descending
 * @param {boolean} resolved - Resolved status of reports to retrieve
 * @returns {Promise<FeedbackReport[]>} - Promise that will produce an array of feedback reports
 */
export async function getFeedbackReports(
    page: number,
    sortByDate: boolean,
    resolved?: boolean
) {
    const resolvedQuery = typeof resolved === 'boolean' ? { resolved } : {};
    const totalCount = await useCollection(
        'FeedbackReports',
        (FeedbackReports) => FeedbackReports.countDocuments(resolvedQuery)
    );

    const feedbackReports = await useCollection(
        'FeedbackReports',
        (FeedbackReports) =>
            FeedbackReports.find(resolvedQuery)
                .sort({ date: sortByDate ? 1 : -1 })
                .skip(page > 0 ? numberOfDocumentsPerPage * (page - 1) : 0)
                .limit(numberOfDocumentsPerPage)
                .toArray()
    );

    return { feedbackReports, totalCount };
}

/**
 * @description Retrieves at most 10  feedback reports from a specific user, depending on the page number
 * @param {number} page - Page number to return. If the page number exceeds the number of available pages, 0 reports are returned
 * @param {boolean} sortByDate - Sort by date order. True for ascending. False for descending
 * @param {string} userId - Id of the user
 * @returns {Promise} - Promise that will produce an array of feedback reports
 */
export async function getFeedbackReportsByUser(
    page: number,
    sortByDate: boolean,
    userId: string
) {
    const totalCount = await useCollection(
        'FeedbackReports',
        (FeedbackReports) =>
            FeedbackReports.countDocuments({
                'meta.createdBy._id': new ObjectID(userId),
            })
    );

    const feedbackReports = await useCollection(
        'FeedbackReports',
        (FeedbackReports) =>
            FeedbackReports.find({
                'meta.createdBy._id': new ObjectID(userId),
            })
                .sort({ date: sortByDate ? 1 : -1 })
                .skip(page > 0 ? numberOfDocumentsPerPage * (page - 1) : 0)
                .limit(numberOfDocumentsPerPage)
                .toArray()
    );

    return { feedbackReports, totalCount };
}

/**
 * @description Retrieves one feedback report by Id
 * @param {string} reportId - Id of the feedback report to return
 * @returns {Promise<FeedbackReport | null>} - Promise that produces a feedback report or null if no feedback report was found in the collection
 */
export function getFeedbackReportById(reportId: string) {
    return useCollection('FeedbackReports', (FeedbackReports) =>
        FeedbackReports.findOne({ _id: new ObjectID(reportId) })
    );
}

/**
 * @description Updates the description of a feedback report specified by its unique Id
 * @param {string} reportId - Id of the feedback report to update
 * @param {string} newDescription - New description of the feedback report
 * @throws {Error} If unable to update the specified feedback report
 */
export async function updateFeedbackReport(
    reportId: string,
    newDescription: string
) {
    const { upsertedCount } = await useCollection(
        'FeedbackReports',
        (FeedbackReports) =>
            FeedbackReports.updateOne(
                { _id: new ObjectID(reportId) },
                { $set: { description: newDescription } }
            )
    );

    if (upsertedCount === 0)
        throw new Error('Unable to update feedback report');
}

/**
 * @description Deletes a feedback report by Id
 * @param {string} reportId - Id of the feedback report to delete
 */
export async function deleteFeedbackReport(reportId: string) {
    const { deletedCount } = await useCollection(
        'FeedbackReports',
        (FeedbackReports) =>
            FeedbackReports.deleteOne({ _id: new ObjectID(reportId) })
    );
    if (deletedCount === 0)
        throw createHttpError(404, 'Feedback report not found');
}

/**
 * @description Sets the resolved attribute of a feedback report to the new resolved status provided
 * @param {string} reportId - Id of the report
 * @param {boolean} newResolvedStatus - New resolved status
 * @returns Mongodb promise
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

    const { upsertedCount } = await useCollection(
        'FeedbackReports',
        (FeedbackReports) =>
            FeedbackReports.updateOne(
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
        throw new Error('Unable to update resolved status of feedback report');
}

/**
 * @description Adds a reply to feedback a report
 * @param {User} user - User object of the replier
 * @param {string} reportId - Id of the report
 * @param {string} replyContent - Content of the reply
 * @returns Mongodb promise
 * @throws {Error} If unable to push the new reply to the array of replies of the specified report
 */
export async function replyToFeedbackReport(
    user: User,
    reportId: string,
    replyContent: string
) {
    const { upsertedCount } = await useCollection(
        'FeedbackReports',
        (FeedbackReports) =>
            FeedbackReports.updateOne(
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
        throw new Error('Unable to reply to the feedback report');
}
