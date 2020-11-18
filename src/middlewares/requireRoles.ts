import createHttpError from 'http-errors';

import { Roles } from 'prytaneum-typings';
import isAllowed from 'utils/isAllowed';
import { RequireLoginLocals } from './requireLogin';

/**
 * The requiredRoles array is logically OR'd, so any of the ones present may be used
 * NOTE: expects the req.results.user object to hold the current user which is usually done by
 * Example:
 * ```js
 * router.all('/',
 *  requireLogin(),
 *  requireRoles(['admin']),
 * )
 *
 *```
 */
export default function requireRoles<
    Params,
    ResBody,
    ReqBody,
    ReqQuery,
    MiddlewareResults extends RequireLoginLocals
>(
    requiredRoles: Roles[]
): Express.Middleware<Params, ResBody, ReqBody, ReqQuery, MiddlewareResults> {
    return (req, res, next) => {
        const { roles } = req.results.user;
        const found = isAllowed(roles, requiredRoles);
        if (!found) next(createHttpError(403, 'Insufficient Permissions'));
        else next();
    };
}
