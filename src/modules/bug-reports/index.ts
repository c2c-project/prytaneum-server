import { ObjectID } from 'mongodb';
import type { User } from 'prytaneum-typings';

import { useCollection } from 'db';
import { makeMeta } from 'modules/common';

const numberOfDocumentsPerPage = 10;
/**
 * @description Creates a new bug report
 * @param {string} description - Description of the bug report
 * @param {string} townhallId - Id of the townhall session where the bug occurred
 * @param {User} user - Represents the submitter of the bug report
 * @throws {Error} If unable to insert the bug report
 * @returns MongoDB promise
 */
export async function createBugReport(
    description: string,
    townhallId: string,
    user: User
) {
    const { insertedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.insertOne({
            description,
            resolved: false,
            replies: [],
            townhallId: new ObjectID(townhallId),
            meta: makeMeta(user), // what's wrong?
        })
    );

    if (insertedCount === 0) throw new Error('Unable to create bug report');
}

/**
 * @description Retrieves at most 10 bug reports, depending on the page number
 * @param {number} page - Page number to return. If the page number exceeds the number of available pages, 0 reports are returned
 * @param {boolean} sortByDate - Sort by date order. True for ascending. False for descending
 * @param {boolean} resolved - Resolved status of reports to retrieve
 * @returns {Promise<Bug[]>} - promise that will produce an array of bug reports
 */
export function getBugReports(
    page: number,
    sortByDate: boolean,
    resolved?: boolean
) {
    const resolvedQuery = typeof resolved === 'boolean' ? { resolved } : {};

    return useCollection('BugReports', (BugReports) =>
        BugReports.find(resolvedQuery)
            .sort({ date: sortByDate ? 1 : -1 })
            .skip(page > 0 ? numberOfDocumentsPerPage * (page - 1) : 0)
            .limit(numberOfDocumentsPerPage)
            .toArray()
    );
}

/**
 * @description Retrieves at most 10 bug reports from a specific submitter, depending on the page number
 * @param {number} page - Page number to return. If the page number exceeds the number of available pages, 0 reports are returned
 * @param {boolean} sortByDate - Sort by date order. True for ascending. False for descending
 * @param {string} submitterId - Id of the submitter
 * @returns {Promise<BugReport[]>} - Promise that will produce an array of bug reports
 */
export function getBugReportsBySubmitter(
    page: number,
    sortByDate: boolean,
    submitterId: string
) {
    return useCollection('BugReports', (BugReports) =>
        BugReports.find({
            'meta.createdBy._id': new ObjectID(submitterId),
        })
            .sort({ date: sortByDate ? 1 : -1 })
            .skip(page > 0 ? numberOfDocumentsPerPage * (page - 1) : 0)
            .limit(numberOfDocumentsPerPage)
            .toArray()
    );
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
 * @param {string} _id - Id of the bug report to update
 * @param {string} newDescription - New description of the bug report
 * @throws {Error} If unable to update the specified bug report
 */
export async function updateBugReport(_id: string, newDescription: string) {
    const { upsertedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            { _id: new ObjectID(_id) },
            { $set: { description: newDescription } }
        )
    );

    if (upsertedCount === 0) throw new Error('Unable to update bug report');
}

/**
 * @description Deletes a bug report by Id
 * @param {string} _id - Id of the bug report to delete
 */
export function deleteBugReport(_id: string) {
    return useCollection('BugReports', (BugReports) =>
        BugReports.deleteOne({ _id: new ObjectID(_id) })
    );
}

// /**
//  * @description Returns the total count of reports in the feedback-reports collection
//  * @param {boolean} resolved Function counts reports that match this resolved status
//  * @returns total count of feedback reports
//  */
// export const getNumberOfFeedbackReports = (
//     resolved?: boolean
// ): Promise<number> => {
//     const resolvedQuery = typeof resolved === 'boolean' ? { resolved } : {};
//     return Collections.FeedbackReport().countDocuments(resolvedQuery);
// };

// /**
//  * @description Returns the count of feedback reports submitted by a specific user
//  * @param {string} submitterId - Id of user
//  * @returns count of feedback reports
//  */
// export const getNumberOfFeedbackReportsBySubmitter = (
//     submitterId: string
// ): Promise<number> => {
//     return Collections.FeedbackReport().countDocuments({ submitterId });
// };

/**
 * @description Sets the resolved attribute of a bug report to the new resolved status provided
 * @param {string} _id - Id of the report
 * @param {boolean} newResolvedStatus - new resolved status
 * @returns Mongodb promise
 * @throws {Error} If unable to update the status of the specified bug report
 */

export async function updateResolvedStatus(
    _id: string,
    newResolvedStatus: boolean
) {
    const { upsertedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            { _id: new ObjectID(_id) },
            { $set: { resolved: newResolvedStatus } }
        )
    );

    if (upsertedCount === 0)
        throw new Error('Unable to update resolved status of bug report');
}

/**
 * @description Adds a reply to bug a report
 * @param {Object} user - User object of the replier
 * @param {string} _id - Id of the report
 * @param {string} replyContent - Content of the reply
 * @returns Mongodb promise
 * @throws {Error} If unable to push the new reply to the array of replies of the specified report
 */
export async function replyToBugReport(
    user: User,
    _id: string,
    replyContent: string
) {
    const { upsertedCount } = await useCollection('BugReports', (BugReports) =>
        BugReports.updateOne(
            { _id: new ObjectID(_id) },
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
