import { ObjectId } from 'mongodb';
import { useCollection } from 'db';
import type { RatingForm, Rating } from 'prytaneum-typings';

import createHttpError from 'http-errors';

const addRating = async (
    rating: RatingForm,
    townhallId: string
): Promise<void> => {
    const filter = { townhallId: new ObjectId(townhallId) };
    const update = { $push: { ratings: rating } };
    const options = { upsert: true, returnOriginal: true };
    const doc = await useCollection('Ratings', (Ratings) => {
        return Ratings.findOneAndUpdate(filter, update, options);
    });
    if (!doc) throw createHttpError(404, 'Townhall doc not found');
};

const getRatings = async (townhallId: string): Promise<Rating<ObjectId>> => {
    const filter = { townhallId: new ObjectId(townhallId) };
    const doc = await useCollection('Ratings', (Ratings) => {
        return Ratings.findOne(filter);
    });
    if (!doc) throw createHttpError(404, 'Townhall doc not found');
    return doc;
};

export default {
    addRating,
    getRatings
};
