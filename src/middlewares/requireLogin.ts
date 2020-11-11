import { RequestHandler, Request } from 'express';
import { ObjectID } from 'mongodb';
import createError from 'http-errors';
import { User } from 'prytaneum-typings';
import env from 'config/env';

import JWT from 'lib/jwt';
import { useCollection } from 'db';

type Cookies = Record<string, string | undefined>;
function getCookies(req: Request): Cookies {
    if (env.NODE_ENV === 'production') return req.signedCookies as Cookies;
    return req.cookies as Cookies;
}

export default function requireLogin(): RequestHandler {
    return async function verify(req, res, next) {
        try {
            // unpacking cookies
            const cookies = getCookies(req);
            if (!cookies.jwt) throw createError(401);
            const { jwt } = cookies;

            // finding user
            const { _id } = (await JWT.verify(jwt)) as User;
            const user = await useCollection('Users', (Users) =>
                Users.findOne({
                    _id: new ObjectID(_id),
                })
            );

            // set user if found
            if (!user) throw createError(404, 'User not found');
            req.user = user;

            // go to next middleware
            next();
        } catch (e) {
            next(e);
        }
    };
}
