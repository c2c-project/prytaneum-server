/* eslint-disable @typescript-eslint/indent */
import { ObjectID, ObjectId } from 'mongodb';
import createHttpError from 'http-errors';
import type { TownhallQueueUpdates } from 'prytaneum-typings';

import events from 'lib/events';
import { useCollection } from 'db';

declare module 'lib/events' {
    interface EventMap {
        'playlist-add': { questionId: string; townhallId: string };
        'playlist-remove': { questionId: string; townhallId: string };
        'playlist-queue-event': {
            townhallId: string;
            update: TownhallQueueUpdates<ObjectId>;
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
    const update: TownhallQueueUpdates<ObjectId> = {
        type: 'PREVIOUS',
        payload: undefined,
        timestamp: new Date(),
    };
    const { matchedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            {
                _id: new ObjectID(townhallId),
            },
            {
                $push: {
                    'state.playlist.queue': update,
                },
            }
        )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    events.emit('playlist-queue-event', { townhallId, update });
}

export async function previousQuestion(townhallId: string) {
    const update: TownhallQueueUpdates<ObjectId> = {
        type: 'PREVIOUS',
        payload: undefined,
        timestamp: new Date(),
    };
    const { matchedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            {
                _id: new ObjectID(townhallId),
            },
            {
                $push: {
                    'state.playlist.queue': update,
                },
            }
        )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    events.emit('playlist-queue-event', { townhallId, update });
}

export async function addQuestionToQueue(
    townhallId: string,
    questionId: string
) {
    const update: TownhallQueueUpdates<ObjectId> = {
        type: 'ADD_QUESTION',
        payload: new ObjectID(questionId),
        timestamp: new Date(),
    };
    const { matchedCount, modifiedCount } = await useCollection(
        'Townhalls',
        (Townhalls) =>
            Townhalls.updateOne(
                { _id: new ObjectID(townhallId) },
                {
                    $push: {
                        'state.playlist.queue': update,
                    },
                }
            )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0)
        throw createHttpError(409, 'This question is already in the queue');

    events.emit('playlist-queue-event', { townhallId, update });
}

export async function removeQuestionFromQueue(
    townhallId: string,
    questionId: string
) {
    const update: TownhallQueueUpdates<ObjectId> = {
        type: 'REMOVE_QUESTION',
        payload: new ObjectID(questionId),
        timestamp: new Date(),
    };
    const { matchedCount, modifiedCount } = await useCollection(
        'Townhalls',
        (Townhalls) =>
            Townhalls.updateOne(
                { _id: new ObjectID(townhallId) },
                {
                    $push: {
                        'state.playlist.queue': update,
                    },
                }
            )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0)
        throw createHttpError(409, 'This question is not in the queue');

    events.emit('playlist-queue-event', { townhallId, update });
}

/**
 * changes the queue order
 */
export async function updateQueue(
    townhallId: string,
    source: number,
    destination: number
) {
    const update: TownhallQueueUpdates = {
        type: 'REORDER',
        payload: {
            source,
            destination,
        },
        timestamp: new Date(),
    };
    const { matchedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            {
                _id: new ObjectID(townhallId),
            },
            {
                $push: {
                    'state.playlist.queue': update,
                },
            }
        )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');

    events.emit('playlist-queue-event', { townhallId, update });
}

export async function addQuestionToList(
    townhallId: string,
    questionId: string
) {
    const { matchedCount, modifiedCount } = await useCollection(
        'Townhalls',
        (Townhalls) =>
            Townhalls.updateOne(
                { _id: new ObjectID(townhallId) },
                {
                    $addToSet: {
                        'state.playlist.list': new ObjectID(questionId),
                    },
                }
            )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0)
        throw createHttpError(409, 'This question is already part of the list');

    events.emit('playlist-add', { questionId, townhallId });
}

export async function removeQuestionFromList(
    townhallId: string,
    questionId: string
) {
    const { matchedCount, modifiedCount } = await useCollection(
        'Townhalls',
        (Townhalls) =>
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
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0)
        throw createHttpError(409, 'This question is not in the list');

    events.emit('playlist-remove', { townhallId, questionId });
}
