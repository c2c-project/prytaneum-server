import { RequestHandler } from 'express';
import createError from 'http-errors';

import { Roles, User } from 'prytaneum-typings';

/**
 * The requiredRoles array is logically OR'd, so any of the ones present may be used
 * NOTE: expects the req.user object to hold the current user which is usually done by
 * Example:
 * ```js
 * router.all('/',
 *  passport.authenticate('jwt', { session: false }),
 *  requireRoles(['admin']),
 * )
 *
 *```
 */
export default function requireRoles(requiredRoles: Roles[]): RequestHandler {
    return (req, res, next) => {
        const { roles } = req.user as User;
        const userRoleSet = new Set(roles);
        const found = requiredRoles.find((role) => userRoleSet.has(role));
        if (!found) next(createError(401, 'Insufficient Permissions'));
        else next();
    };
}
