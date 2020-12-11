import { ObjectID, ObjectId } from 'mongodb';
import createHttpError from 'http-errors';
import type {
    TownhallForm,
    TownhallSettings,
    User,
    Question,
    TownhallState,
} from 'prytaneum-typings';

import events from 'lib/events';
import { useCollection } from 'db';
import { makeMeta } from 'modules/common';
import { defaultSettings, defaultState } from './defaults';

declare module 'lib/events' {
    interface EventMap {
        'create-townhall': ObjectId;
        'start-townhall': string;
        'end-townhall': string;
        'townhall-state': TownhallState<ObjectId>;
    }
}

export async function createTownhall(form: TownhallForm, user: User<ObjectId>) {
    const { insertedCount, insertedId } = await useCollection(
        'Townhalls',
        (Townhalls) =>
            Townhalls.insertOne({
                form,
                meta: makeMeta(user),
                settings: defaultSettings,
                state: defaultState,
            })
    );

    if (insertedCount === 1) {
        events.emit('create-townhall', insertedId);
    } else {
        throw new Error('Unable to create townhall');
    }
}

export async function updateTownhall(
    form: TownhallForm,
    townhallId: string,
    user: User
) {
    if (!ObjectID.isValid(townhallId))
        throw createHttpError(400, 'Invalid townhall id provided');
    const { modifiedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            {
                _id: new ObjectID(townhallId),
                'meta.createdBy._id': new ObjectID(user._id),
            },
            {
                $set: {
                    'meta.updatedAt': new Date(),
                    'meta.updatedBy': user,
                    form,
                },
            },
            {
                upsert: false,
            }
        )
    );
    // assumption is that there is a valid townhall id, but if the request fails,
    // then it was probably due to the person not owning that townhall
    // but this could still fail due to an invalid townhall id, it is just much less likely
    if (modifiedCount === 0)
        throw createHttpError(
            401,
            'You must be the creator in order to modify'
        );
}

// TODO: extend this to write to a trash collection rather than actually delete
export async function deleteTownhall(townhallId: string) {
    const { deletedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.deleteOne({
            _id: new ObjectID(townhallId),
        })
    );
    if (deletedCount === 0) throw createHttpError(404, 'Townhall not found');
}

export async function getTownhall(townhallId: string) {
    const townhall = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.findOne({ _id: new ObjectID(townhallId) })
    );
    if (!townhall) throw createHttpError(404, 'Townhall not found');
    return townhall;
}

// TODO: limit this so it doesn't show all townhalls?
// TODO: queries
export function getTownhalls() {
    return useCollection('Townhalls', (Townhalls) =>
        Townhalls.find({}).toArray()
    );
}

export async function getBillInfo(townhallId: string) {
    const townhall = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.findOne({
            _id: new ObjectID(townhallId),
        })
    );
    if (!townhall) throw new Error('Invalid Townhall ID');

    // eventually after doing some other requests
    return {};
}

export async function configure(
    settings: TownhallSettings,
    townhallId: string
) {
    // TODO: sanity checks ex. enabled must be true within settings for other things to work even if set to true
    const { value } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.findOneAndUpdate(
            { _id: new ObjectID(townhallId) },
            { $set: { settings } },
            { returnOriginal: false }
        )
    );
    if (!value) throw createHttpError(404, 'Unable to find townhall');
}

async function toggleTownhall(townhallId: string, user: User, active: boolean) {
    let startEndUpdate = {};
    if (active) startEndUpdate = { 'state.start': new Date() };
    else startEndUpdate = { 'state.end': new Date() };
    const { value } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.findOneAndUpdate(
            {
                _id: new ObjectID(townhallId),
                'meta.createdBy._id': user._id,
            },
            { $set: { 'state.active': active, ...startEndUpdate } },
            { returnOriginal: false }
        )
    );
    if (!value) throw createHttpError(404, 'Unable to find townhall');
    return value;
}

export async function startTownhall(townhallId: string, user: User) {
    const { _id } = await toggleTownhall(townhallId, user, true);
    events.emit('start-townhall', _id.toHexString());
}

export async function endTownhall(townhallId: string, user: User) {
    const { _id } = await toggleTownhall(townhallId, user, false);
    events.emit('end-townhall', _id.toHexString());
}

export async function playQuestion(townhallId: string, questionId: string) {
    // FIXME: race condition
    // The fix is to make this a script that will interact with the mongo shell?
    // see: https://docs.mongodb.com/mongodb-shell/install
    // see: https://stackoverflow.com/questions/3974985/update-mongodb-field-using-value-of-another-field
    // see: https://docs.mongodb.com/manual/tutorial/update-documents-with-aggregation-pipeline/ (scroll down a bit for control + f ".updateOne")
    // see: https://docs.mongodb.com/master/reference/operator/aggregation/concatArrays/#exp._S_concatArrays
    const townhall = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.findOne({ _id: new ObjectID(townhallId) })
    );
    if (!townhall) throw createHttpError(404, 'Unable to find townhall');
    const question = await useCollection('Questions', (Questions) =>
        Questions.findOne({
            _id: new ObjectID(questionId),
            'meta.townhallId': new ObjectID(townhallId),
        })
    );
    if (!question) throw createHttpError(404, 'Unable to find question');

    // critical area begins here for the race condition
    const { state } = townhall; // only care about state
    const { playing, playlist } = state;
    const { queued } = playlist;
    const newQueued = queued.filter(
        (queuedQuestion) => queuedQuestion._id !== new ObjectID(questionId)
    );
    const { modifiedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            { _id: new ObjectID(townhallId) },
            {
                $set: {
                    'state.playlist.queued': newQueued,
                    'state.playing': question,
                },
                $addToSet: {
                    'state.playlist.played': playing,
                },
            }
        )
    );
    // end critical area for race condition
    if (modifiedCount) throw createHttpError(500);
}

/**
 * NOTE: There's a small race condition to where if the user updates the question and the update finishes as
 * the moderator clicks add to queue but w/e
 */
export async function addQuestionToQueue(
    townhallId: string,
    questionId: string
) {
    const question = await useCollection('Questions', (Questions) =>
        Questions.findOne({
            _id: new ObjectID(questionId),
            'meta.townhallId': new ObjectID(townhallId),
        })
    );
    if (!question) throw createHttpError(404, 'Unable to find question');
    const { matchedCount, modifiedCount } = await useCollection(
        'Townhalls',
        (Townhalls) =>
            Townhalls.updateOne(
                { _id: new ObjectID(townhallId) },
                { $addToSet: { 'state.playlist.queued': question } }
            )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0)
        throw createHttpError(409, 'This question is already queued');
}

export async function removeQuestionFromQueue(
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
                        'state.playlist.queued': {
                            _id: { $eq: new ObjectID(questionId) },
                        },
                    },
                }
            )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0)
        throw createHttpError(409, 'This question is not in the queue');
}

/**
 * changes the queue order
 */
export async function updateQueue(townhallId: string, queue: Question[]) {
    // replaces all id strings with object id's since the queue itself will be overwritten
    const newQueue: Question<ObjectId>[] = queue.map((question) => ({
        ...question,
        _id: new ObjectID(question._id),
        meta: {
            ...question.meta,
            createdBy: {
                ...question.meta.createdBy,
                _id: new ObjectID(question.meta.createdBy._id),
            },
            updatedBy: {
                ...question.meta.updatedBy,
                _id: new ObjectID(question.meta.updatedBy._id),
            },
            townhallId: new ObjectID(question.meta.townhallId),
        },
    }));
    const { matchedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.updateOne(
            { _id: new ObjectID(townhallId) },
            {
                $set: {
                    'state.playlist.queued': newQueue,
                },
            }
        )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
}

export async function addQuestionToList(
    townhallId: string,
    questionId: string
) {
    const question = await useCollection('Questions', (Questions) =>
        Questions.findOne({ _id: new ObjectID(questionId) })
    );
    if (!question) throw createHttpError(404, 'Unable to find question');

    const { matchedCount, modifiedCount } = await useCollection(
        'Townhalls',
        (Townhalls) =>
            Townhalls.updateOne(
                { _id: new ObjectID(townhallId) },
                {
                    $addToSet: {
                        'state.playlist.list': question,
                    },
                }
            )
    );
    if (matchedCount === 0)
        throw createHttpError(404, 'Unable to find townhall');
    if (modifiedCount === 0)
        throw createHttpError(409, 'This question is already part of the list');
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
}
