import { Request } from 'express';
import { ObjectId, ObjectID } from 'mongodb';
import createHttpError from 'http-errors';
import { Roles, User } from 'prytaneum-typings';

import isAllowed from 'utils/isAllowed';
import env from 'config/env';
import JWT from 'lib/jwt';
import { useCollection } from 'db';

type Cookies = Record<string, string | undefined>;
function getCookies(req: Request): Cookies {
    if (env.NODE_ENV === 'production') return req.signedCookies as Cookies;
    return req.cookies as Cookies;
}

/**
 * Require that the user is logged in and optionally require which roles they must have
 */
export default function requireLogin(roles?: Roles[]): Express.Middleware {
    return async function verify(req, res, next) {
        try {
            // unpacking cookies
            const cookies = getCookies(req);
            if (!cookies.jwt) throw createHttpError(401);
            const { jwt } = cookies;

            // finding user
            const { _id } = (await JWT.verify(jwt)) as User;
            const user = await useCollection('Users', (Users) =>
                Users.findOne({
                    _id: new ObjectID(_id),
                })
            );

            // set user if found
            if (!user) throw createHttpError(404, 'User not found');
            req.results.user = user;
            // check permissions if needed
            if (roles) {
                // technically, this could be done at the query level, but then I don't know if the user was not found
                // versus an insuficient permission error
                const result = isAllowed(user.roles, roles);

                if (!result)
                    throw createHttpError(403, 'Insufficient Permissions');
            }

            // go to next middleware
            next();
        } catch (e) {
            next(e);
        }
    };
}

export type RequireLoginLocals = { user: User & { _id: ObjectId } };
