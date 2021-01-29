import { ObjectId } from 'mongodb';
import { useCollection } from 'db';
// eslint-disable-next-line import/no-extraneous-dependencies
import { RatingForm } from 'prytaneum-typings';

import createHttpError from 'http-errors';

const addRating = async (
    rating: RatingForm,
    townhallId: string,
    userId?: string
): Promise<void> => {
    const filter = { _id: new ObjectId(townhallId) };
    const update = userId
        ? {
            $push: { ratings: { userId: new ObjectId(userId), ...rating } },
        }
        : { $push: { ratings: rating } };
    const options = { upsert: true, returnOriginal: true };
    const doc = await useCollection('Ratings', (Ratings) => {
        return Ratings.findOneAndUpdate(filter, update, options);
    });
    if (!doc) throw createHttpError(404, 'Townhall doc not found');
};

export default {
    addRating,
};
