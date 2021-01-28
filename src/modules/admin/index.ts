/* eslint-disable @typescript-eslint/indent */
import { Cursor, ObjectID, ObjectId } from 'mongodb';
import type { User, Roles } from 'prytaneum-typings';
import createHttpError from 'http-errors';

import { useCollection } from 'db';
import jwt from 'lib/jwt';

type FilteredUser = Pick<
    User<ObjectId>,
    '_id' | 'email' | 'meta' | 'name' | 'roles'
>;
function filterFields(cursor: Cursor<User>) {
    return cursor.project({
        _id: 1,
        email: 1,
        meta: 1,
        name: 1,
        roles: 1,
    });
}

export async function getUsers(query?: { email?: string }) {
    let _query = {};
    if (query?.email) _query = { ..._query, 'email.address': query.email };
    return useCollection('Users', (Users) =>
        filterFields(Users.find(_query)).toArray()
    );
}

export async function getUser(userId: string) {
    const user = await useCollection('Users', (Users) =>
        Users.findOne({ _id: new ObjectID(userId) })
    );
    if (!user) throw new Error('User not found');

    const filteredUser: FilteredUser = {
        _id: user._id,
        email: user.email,
        meta: user.meta,
        name: user.name,
        roles: user.roles,
    };
    return filteredUser;
}

export async function generateInviteLink(role: Roles, inviter: ObjectId) {
    const { insertedCount, insertedId } = await useCollection(
        'InviteLinks',
        (InviteLinks) =>
            InviteLinks.insertOne({
                inviter,
                roles: [role],
                limit: 1, // TODO: make this an option
                uses: 0,
            })
    );
    if (insertedCount !== 1) throw createHttpError(500);
    return jwt.sign({ _id: insertedId }, { expiresIn: '1d' });
}
