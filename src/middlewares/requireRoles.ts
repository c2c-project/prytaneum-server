import { RequestHandler } from 'express';
import createError from 'http-errors';
import { ObjectID } from 'mongodb';

import { useCollection } from 'db';
import JWT from 'lib/jwt';
import { Roles } from 'prytaneum-typings';
import requireLogin from './requireLogin';

/**
 * the requiredRoles array is logically AND'd, so all must be present on the users's database document to pass
 */
export default function requireRoles(
    requiredRoles: Roles[],
    optionalRoles?: Roles[]
): RequestHandler[] {
    return [
        requireLogin(),
        async (req, res, next) => {
            const cookies = req.signedCookies as { jwt: string };
            const { jwt } = cookies;
            const { _id } = (await JWT.verify(jwt)) as { _id: string };
            const requiredRolesQuery = requiredRoles.map((role) => ({
                roles: role,
            }));
            const optionalRolesQuery = optionalRoles?.map((role) => ({
                roles: role,
            }));
            const user = await useCollection('Users', (Users) =>
                Users.findOne({
                    _id: new ObjectID(_id),
                    $and: requiredRolesQuery, // TODO: fix bug
                    $or: optionalRolesQuery,
                })
            );
            if (!user) next(createError(401, 'Insufficient Permissions'));
            else next();
        },
    ];
}
