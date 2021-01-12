/* eslint-disable @typescript-eslint/indent */
import createHttpError from 'http-errors';

import isModerator from 'utils/isModerator';
import { RequireLoginLocals } from './requireLogin';

type Params = { townhallId: string };

/**
 * assumes townhall id is present
 */
export default function requireModerator<
    ReqParams extends Params,
    ResBody,
    ReqBody,
    ReqQuery,
    MiddlewareResults extends RequireLoginLocals
>(): Express.Middleware<
    ReqParams,
    ResBody,
    ReqBody,
    ReqQuery,
    MiddlewareResults
> {
    return async (req, res, next) => {
        try {
            const { townhallId } = req.params;
            const { user } = req.results;
            const found = await isModerator(
                townhallId,
                user.email.address,
                user._id
            );

            if (!found) throw createHttpError(403, 'You must be a moderator.');
            next();
        } catch (e) {
            next(e);
        }
    };
}
