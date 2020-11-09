import { RequestHandler } from 'express';
import createError from 'http-errors';
import JWT from 'lib/jwt';

type Cookies = Record<string, string | undefined>;
export default function requireLogin(): RequestHandler {
    return async (req, res, next) => {
        const cookies = req.signedCookies as Cookies;
        const jwt = cookies?.jwt;
        if (jwt) {
            const decodedjwt = await JWT.verify(jwt).catch(() =>
                next(createError(401, 'Invalid token'))
            );
            if (decodedjwt) next();
        } else next(createError(401, 'No user logged in'));
    };
}
