/* eslint-disable @typescript-eslint/indent */
import { useCollection } from 'db';
import createHttpError from 'http-errors';
import { ObjectID } from 'mongodb';
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
            const found = await useCollection('Townhalls', (Townhalls) =>
                Townhalls.findOne({
                    _id: new ObjectID(townhallId),
                    // if the user is the moderator or organizer
                    // organizer is the one who made the townhall
                    $or: [
                        { 'settings.moderators.list': user._id.toHexString() },
                        { 'meta.createdBy._id': user._id },
                    ],
                })
            );
            if (!found) createHttpError(403, 'You must be a moderator.');
            next();
        } catch (e) {
            next(e);
        }
    };
}
