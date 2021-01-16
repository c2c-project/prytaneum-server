import { ObjectID } from 'mongodb';
import { useCollection } from 'db';
import createHttpError from 'http-errors';

export async function getRolesFromInvite(inviteId: string) {
    const result = await useCollection('InviteLinks', (InviteLinks) =>
        InviteLinks.findOne({ _id: new ObjectID(inviteId) })
    );
    if (!result) throw createHttpError(404, 'Invite not found');
    if (result.limit > result.uses) return result.roles;

    throw createHttpError(403, 'Invite has exceeded usage limit');
}

export async function incrementInviteUse(inviteId: string) {
    const result = await useCollection('InviteLinks', (InviteLinks) =>
        InviteLinks.updateOne(
            { _id: new ObjectID(inviteId) },
            { $inc: { uses: 1 } }
        )
    );
    if (result.matchedCount === 0)
        throw createHttpError(404, 'Invite not found');
}
