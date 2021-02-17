/* eslint-disable @typescript-eslint/indent */
import { ObjectID, ObjectId } from 'mongodb';
import createHttpError from 'http-errors';
import type { Question } from 'prytaneum-typings';

import events from 'lib/events';
import { useCollection } from 'db';

declare module 'lib/events' {
    interface EventMap {
        'playlist-add': Question<ObjectId>;
        'playlist-remove': { questionId: string; townhallId: string };
        'playlist-queue-add': Question<ObjectId>;
        'playlist-queue-remove': { questionId: string; townhallId: string };
        'playlist-queue-order': Question<string>[];
        'playlist-queue-next': string;
        'playlist-queue-previous': string;
        'playlist-like-remove': {
            questionId: string;
            townhallId: string;
            userId: string;
        };
        'playlist-like-add': {
            questionId: string;
            townhallId: string;
            userId: string;
        };
    }
}

// export async function playQuestion(townhallId: string, questionId: string) {
//     // FIXME: race condition
//     // The fix is to make this a script that will interact with the mongo shell?
//     // see: https://docs.mongodb.com/mongodb-shell/install
//     // see: https://stackoverflow.com/questions/3974985/update-mongodb-field-using-value-of-another-field
//     // see: https://docs.mongodb.com/manual/tutorial/update-documents-with-aggregation-pipeline/ (scroll down a bit for control + f ".updateOne")
//     // see: https://docs.mongodb.com/master/reference/operator/aggregation/concatArrays/#exp._S_concatArrays
//     const townhall = await useCollection('Townhalls', (Townhalls) =>
//         Townhalls.findOne({ _id: new ObjectID(townhallId) })
//     );
//     if (!townhall) throw createHttpError(404, 'Unable to find townhall');
//     const question = await useCollection('Questions', (Questions) =>
//         Questions.findOne({
//             _id: new ObjectID(questionId),
//             'meta.townhallId': new ObjectID(townhallId),
//         })
//     );
//     if (!question) throw createHttpError(404, 'Unable to find question');

//     // critical area begins here for the race condition
//     const { state } = townhall; // only care about state
//     const { playlist } = state;
//     const { queue, position, list } = playlist;
//     const { modifiedCount } = await useCollection('Townhalls', (Townhalls) =>
//         Townhalls.updateOne(
//             { _id: new ObjectID(townhallId) },
//             {
//                 $set: {
//                     'state.playlist.queued': newQueued,
//                     'state.playing': question,
//                 },
//                 $addToSet: playing
//                     ? {
//                           'state.playlist.played': playing,
//                       }
//                     : {},
//             }
//         )
//     );
//     // end critical area for race condition
//     if (modifiedCount) throw createHttpError(500);

//     events.emit('playlist-play', question);
//     events.emit('playlist-queue-order', newQueued);
// }

export async function nextQuestion(townhallId: string) {
    const { matchedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            {
                _id: new ObjectID(townhallId),
            },
            {
                $inc: {
                    'state.playlist.position.current': 1,
                },
            }
        )
    );
    if (matchedCount === 0) throw createHttpError(404, 'Unable to find townhall');
    events.emit('playlist-queue-next', townhallId);
}

export async function previousQuestion(townhallId: string) {
    const { matchedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            {
                _id: new ObjectID(townhallId),
            },
            {
                $inc: {
                    'state.playlist.position.current': -1,
                },
            }
        )
    );
    if (matchedCount === 0) throw createHttpError(404, 'Unable to find townhall');
    events.emit('playlist-queue-previous', townhallId);
}

/**
 * NOTE: There's a small race condition to where if the user updates the question and the update finishes as
 * the moderator clicks add to queue but w/e
 */
export async function addQuestionToQueue(townhallId: string, questionId: string) {
    // TODO: notify the user that there is a duplictae detected on the frontend if there is one
    // $addToSet does not guarantee order when it matters here
    const question = await useCollection('Questions', (Questions) =>
        Questions.findOne({
            _id: new ObjectID(questionId),
            'meta.townhallId': new ObjectID(townhallId),
        })
    );
    if (!question) throw createHttpError(404, 'Unable to find question');
    const { matchedCount, modifiedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne({ _id: new ObjectID(townhallId) }, { $addToSet: { 'state.playlist.queue': question } })
    );
    if (matchedCount === 0) throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0) throw createHttpError(409, 'This question is already in the queue');

    events.emit('playlist-queue-add', question);
}

export async function removeQuestionFromQueue(townhallId: string, questionId: string) {
    const { matchedCount, modifiedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            { _id: new ObjectID(townhallId) },
            {
                $pull: {
                    'state.playlist.queue': {
                        _id: { $eq: new ObjectID(questionId) },
                    },
                },
            }
        )
    );
    if (matchedCount === 0) throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0) throw createHttpError(409, 'This question is not in the queue');

    events.emit('playlist-queue-remove', { questionId, townhallId });
}

/**
 * changes the queue order
 */
export async function updateQueue(townhallId: string, queue: Question[]) {
    const { value } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.findOneAndUpdate(
            { _id: new ObjectID(townhallId) },
            {
                $set: {
                    'state.playlist.queue': queue,
                },
            },
            {
                returnOriginal: false,
            }
        )
    );
    if (!value) throw createHttpError(404, 'Unable to find townhall');

    events.emit('playlist-queue-order', queue);
    return value;
}

export async function addQuestionToList(townhallId: string, questionId: string) {
    const question = await useCollection('Questions', (Questions) =>
        Questions.findOne({ _id: new ObjectID(questionId) })
    );
    if (!question) throw createHttpError(404, 'Unable to find question');

    const { matchedCount, modifiedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            { _id: new ObjectID(townhallId) },
            {
                $addToSet: {
                    'state.playlist.list': question,
                },
            }
        )
    );
    if (matchedCount === 0) throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0) throw createHttpError(409, 'This question is already part of the list');

    events.emit('playlist-add', question);
}

export async function removeQuestionFromList(townhallId: string, questionId: string) {
    const { matchedCount, modifiedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            { _id: new ObjectID(townhallId) },
            {
                $pull: {
                    'state.playlist.list': {
                        _id: { $eq: new ObjectID(questionId) },
                    },
                },
            }
        )
    );
    if (matchedCount === 0) throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0) throw createHttpError(409, 'This question is not in the list');

    events.emit('playlist-remove', { townhallId, questionId });
}
