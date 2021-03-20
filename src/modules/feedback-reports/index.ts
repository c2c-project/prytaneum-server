import { ObjectID, ObjectId } from 'mongodb';
import type { User } from 'prytaneum-typings';
import createHttpError from 'http-errors';

import { useCollection } from 'db';
import { makeMeta } from 'modules/common';

const numberOfDocumentsPerPage = 10;

/**
 * @description Creates a new feedback report
 * @param {string} description - Description of the feedback report
 * @param {User} user - Represents the submitter of the feedback report
 * @returns {Promise} Void promise
 * @throws {Error} If unable to insert the feedback report
 */
export async function createFeedbackReport(description: string, user: User<ObjectId>) {
    const { insertedCount } = await useCollection('FeedbackReports', (FeedbackReports) =>
        FeedbackReports.insertOne({
            description,
            resolved: false,
            replies: [],
            meta: makeMeta(user),
        })
    );

    if (insertedCount === 0) throw createHttpError(400, 'Unable to create feedback report');
}

/**
 * @description Retrieves at most 10 feedback reports, depending on the page number
 * @param {number} page - Page number to return. If the page number exceeds the number of available pages, 0 reports are returned
 * @param {boolean} sortByDate - Sort by date order. True for ascending. False for descending
 * @param {boolean} resolved - Resolved status of reports to retrieve
 * @returns {Promise} - Promise that will produce an array of feedback reports and the total count of feedback reports in the database
 */
export async function getFeedbackReports(page: number, sortByDate: boolean, resolved?: boolean) {
    const resolvedQuery = typeof resolved === 'boolean' ? { resolved } : {};
    const totalCount = await useCollection('FeedbackReports', (FeedbackReports) =>
        FeedbackReports.countDocuments(resolvedQuery)
    );
    const feedbackReports = await useCollection('FeedbackReports', (FeedbackReports) =>
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
 * @param {ObjectId} userId - Id of the user
 * @returns {Promise} - Promise that will produce an array of feedback reports and the total count of feedback reports submitted by the user
 */
export async function getFeedbackReportsByUser(page: number, sortByDate: boolean, userId: ObjectId) {
    const totalCount = await useCollection('FeedbackReports', (FeedbackReports) =>
        FeedbackReports.countDocuments({
            'meta.createdBy._id': new ObjectID(userId),
        })
    );

    const feedbackReports = await useCollection('FeedbackReports', (FeedbackReports) =>
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
 * @description Updates the description of a feedback report specified by its unique Id
 * @param {string} reportId - Id of the feedback report to update
 * @param {string} newDescription - New description of the feedback report
 * @param {User} user - User that made the request
 * @returns {Promise} Void promise
 * @throws {Error} If provided report id is invalid or if unable to update the specified feedback report
 */
export async function updateFeedbackReport(reportId: string, newDescription: string, user: User<ObjectId>) {
    if (!ObjectID.isValid(reportId)) throw createHttpError(400, 'Invalid report id provided');

    const { modifiedCount } = await useCollection('FeedbackReports', (FeedbackReports) =>
        FeedbackReports.updateOne(
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

    if (modifiedCount === 0)
        throw createHttpError(401, 'You must be the creator in order to modify the feedback report');
}

// TODO: extend this to write to a trash collection rather than actually delete
/**
 * @description Deletes a feedback report by Id
 * @param {string} reportId - Id of the feedback report to delete
 * @returns {Promise} Void promise
 * @throws {Error} If provided report id is invalid or if specified feedback report to delete does not exist
 */
export async function deleteFeedbackReport(reportId: string) {
    if (!ObjectID.isValid(reportId)) throw createHttpError(400, 'Invalid report id provided');

    const { deletedCount } = await useCollection('FeedbackReports', (FeedbackReports) =>
        FeedbackReports.deleteOne({ _id: new ObjectID(reportId) })
    );

    if (deletedCount === 0) throw createHttpError(404, 'Feedback report not found');
}

/**
 * @description Sets the resolved attribute of a feedback report to the new resolved status provided
 * @param {string} reportId - Id of the report
 * @param {boolean} newResolvedStatus - New resolved status
 * @param {User} user - User object of updater
 * @returns {Promise} Void promise
 * @throws {Error} If provided report id is invalid or if unable to update the status of the specified feedback report
 */
export async function updateResolvedStatus(reportId: string, newResolvedStatus: boolean, user: User<ObjectId>) {
    if (!ObjectID.isValid(reportId)) throw createHttpError(400, 'Invalid report id provided');

    const { modifiedCount } = await useCollection('FeedbackReports', (FeedbackReports) =>
        FeedbackReports.updateOne(
            {
                _id: new ObjectID(reportId),
            },
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

    if (modifiedCount === 0) throw createHttpError(404, 'Could not update resolved status of feedback report');
}

/**
 * @description Adds a reply to feedback a report
 * @param {User} user - User object of the replier
 * @param {string} reportId - Id of the report
 * @param {string} content - Content of the reply
 * @returns {Promise} Void promise
 * @throws {Error} If provided report id is invalid or if unable to add reply to feedback report
 */
export async function replyToFeedbackReport(user: User<ObjectId>, reportId: string, content: string) {
    const { modifiedCount } = await useCollection('FeedbackReports', (FeedbackReports) =>
        FeedbackReports.updateOne(
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
