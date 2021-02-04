import { ObjectId } from 'mongodb';
import { useCollection } from 'db';
import type { RatingForm } from 'prytaneum-typings';

import createHttpError from 'http-errors';

const addRating = async (
    rating: RatingForm,
    townhallId: string
): Promise<void> => {
    const filter = { _id: new ObjectId(townhallId) };
    const update = { $push: { ratings: rating } };
    const options = { upsert: true, returnOriginal: true };
    const doc = await useCollection('Ratings', (Ratings) => {
        return Ratings.findOneAndUpdate(filter, update, options);
    });
    if (!doc) throw createHttpError(404, 'Townhall doc not found');
};

export default {
    addRating,
};
