import { ObjectID } from 'mongodb';
import createError from 'http-errors';

import emitter from 'lib/events';
import { useCollection } from 'db';
import { TownhallForm, User } from 'prytaneum-typings';
import { defaultSettings } from './defaults';

export async function createTownhall(form: TownhallForm, user: User) {
    const { insertedCount, insertedId } = await useCollection(
        'Townhalls',
        (Townhalls) =>
            Townhalls.insertOne({
                form,
                meta: {
                    createdAt: new Date(),
                    createdBy: {
                        _id: user._id,
                        name: user.name,
                    },
                },
                settings: defaultSettings,
            })
    );

    if (insertedCount === 1) {
        emitter.emit('create-townhall', insertedId);
    } else {
        throw createError(400, 'Unable to create townhall');
    }
}

export async function updateTownhall(
    form: TownhallForm,
    townhallId: string,
    user: User
) {
    if (!ObjectID.isValid(townhallId))
        throw createError(400, 'Invalid townhall id provided');
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
        throw createError(401, 'You must be the creator in order to modify');
}

// TODO: extend this to write to a trash collection rather than actually delete
export async function deleteTownhall(townhallId: string) {
    if (!ObjectID.isValid(townhallId))
        throw createError(400, 'Invalid townhall id provided');
    const { deletedCount } = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.deleteOne({
            _id: new ObjectID(townhallId),
        })
    );
    if (deletedCount === 0) throw createError(404, 'Townhall not found');
}

export function getTownhall(townhallId: string) {
    if (!ObjectID.isValid(townhallId))
        throw createError(400, 'Invalid townhall id provided');
    return useCollection('Townhalls', (Townhalls) =>
        Townhalls.findOne({ _id: new ObjectID(townhallId) })
    );
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
