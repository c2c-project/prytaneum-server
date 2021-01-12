import { ObjectID, ObjectId } from 'mongodb';

import { useCollection } from 'db';

/**
 * will check if the given townhall
 * has the user as a listed _id
 * or if the user is a the creator/owner
 * @example
 * ```
 * await isModerator(
 *  townhall._id,
 *  user.email.address,
 *  user._id
 * )
 * ```
 */
export default async function isModerator(
    townhallId: string,
    userEmail: string,
    userId: ObjectId
) {
    const found = await useCollection('Townhalls', (Townhalls) =>
        Townhalls.findOne({
            _id: new ObjectID(townhallId),
            // if the user is the moderator or organizer
            // organizer is the one who made the townhall
            $or: [
                { 'settings.moderators.list': userEmail },
                { 'meta.createdBy._id': userId },
            ],
        })
    );
    return Boolean(found);
}
