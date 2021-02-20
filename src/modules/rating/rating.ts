import { ObjectId } from 'mongodb';
import { useCollection } from 'db';
import type { RatingForm, Rating, Name } from 'prytaneum-typings';

import createHttpError from 'http-errors';

const addRating = async (
    rating: RatingForm,
    townhallId: string,
    userId?: string,
    userName?: Name
): Promise<void> => {
    const ratingDoc: Pick<Rating<ObjectId>, 'meta' | 'ratings' | 'feedback'> = {
        meta: {
            townhallId: new ObjectId(townhallId),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        ratings: rating.values,
        feedback: rating.feedback,
    };
    if (userId && userName) {
        ratingDoc.meta.createdBy = { _id: userId, name: userName };
        ratingDoc.meta.updatedBy = { _id: userId, name: userName };
    }
    const doc = await useCollection('Ratings', (Ratings) => {
        return Ratings.insertOne(ratingDoc);
    });
    if (!doc) throw createHttpError(404, 'Error when adding rating');
};

const getRatings = async (townhallId: string): Promise<Array<Rating<ObjectId>>> => {
    const filter = { 'meta.townhallId': new ObjectId(townhallId) };
    const cursor = await useCollection('Ratings', (Ratings) => {
        return Ratings.find(filter);
    });
    if (!cursor || await cursor.count() === 0) throw createHttpError(404, 'Ratings not found');
    const docs = await cursor.toArray();
    return docs;
};

export default {
    addRating,
    getRatings,
};
