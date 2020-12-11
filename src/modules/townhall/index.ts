import { ObjectID, ObjectId } from 'mongodb';
import createHttpError from 'http-errors';
import type { TownhallForm, TownhallSettings, User } from 'prytaneum-typings';

import events from 'lib/events';
import { useCollection } from 'db';
import { makeMeta } from 'modules/common';
import { defaultSettings } from './defaults';

declare module 'lib/events' {
    interface EventMap {
        'create-townhall': ObjectId;
        'start-townhall': string;
        'end-townhall': string;
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
                state: {
                    active: false,
                    start: null,
                    end: null,
                    attendees: {
                        current: 0,
                        max: 0,
                    },
                },
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

// TODO: add active field to typings
export async function startTownhall(townhallId: string, user: User) {
    const { _id } = await toggleTownhall(townhallId, user, true);
    events.emit('start-townhall', _id.toHexString());
}

// TODO: add active field to typings
export async function endTownhall(townhallId: string, user: User) {
    const { _id } = await toggleTownhall(townhallId, user, false);
    events.emit('end-townhall', _id.toHexString());
}
