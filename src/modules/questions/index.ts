import { ObjectId, ObjectID } from 'mongodb';
import type { QuestionForm, User, Question } from 'prytaneum-typings';
import createHttpError from 'http-errors';

import { useCollection } from 'db';
import events from 'lib/events';
import { makeMeta } from 'modules/common';
import isModerator from 'utils/isModerator';

// declaration merging
declare module 'lib/events' {
    interface EventMap {
        'create-question': Question<ObjectId>;
        'update-question': Question<ObjectId>;
        'delete-question': Question<ObjectId>;
        'moderate-question': Question<ObjectId>;
    }
}

// TODO: replies as a subcollection

export async function getQuestions(townhallId: string) {
    return useCollection('Questions', (Questions) =>
        Questions.find(
            {
                'meta.townhallId': new ObjectID(townhallId),
            },
            {
                sort: {
                    'meta.createdAt': 1,
                },
            }
        ).toArray()
    );
}

export async function getQuestion(questionId: string, townhallId: string) {
    const doc = await useCollection('Questions', (Questions) =>
        Questions.findOne({
            _id: new ObjectID(questionId),
            'meta.townhallId': new ObjectID(townhallId),
        })
    );
    if (!doc) throw createHttpError(404, 'Question not found');
    return doc;
}

export async function updateQuestion(
    questionId: string,
    townhallId: string,
    userId: ObjectId,
    form: QuestionForm
) {
    const { value } = await useCollection('Questions', (Questions) =>
        Questions.findOneAndUpdate(
            {
                _id: new ObjectID(questionId),
                'meta.townhallId': new ObjectID(townhallId),
                'meta.user._id': userId,
            },
            {
                $set: {
                    question: form.question,
                },
            },
            {
                // this is so that it returns the updated document instead
                // also means that if no document was found, the value key in the return object
                // is now null -- assuming upserted is false, which it is by default
                returnOriginal: false,
            }
        )
    );
    // probably fails if the user is not the owner
    if (!value) throw createHttpError(401, 'Unable to update question');
    else events.emit('update-question', value);
}

export async function deleteQuestion(
    questionId: string,
    townhallId: string,
    userId: ObjectId
) {
    const _id = new ObjectId(questionId);
    const { value } = await useCollection('Questions', (Questions) =>
        Questions.findOneAndDelete({
            _id,
            'meta.townhallId': new ObjectId(townhallId),
            'meta.user._id': userId,
        })
    );
    if (!value) throw createHttpError(401, 'You must be the owner');
    else events.emit('delete-question', value);
}

export async function moderateQuestion(
    townhallId: string,
    questionId: string,
    visibility: VisibilityState
) {
    const { value } = await useCollection('Questions', (Questions) =>
        Questions.findOneAndUpdate(
            {
                _id: new ObjectID(questionId),
                'meta.townhallId': new ObjectID(townhallId),
            },
            {
                $set: { visibility },
            }
        )
    );
    if (!value) throw createHttpError(404, 'Unable to find question');
}

export async function createQuestion(
    form: QuestionForm,
    townhallId: string,
    user: User<ObjectId>
) {
    let quote: Question<ObjectId> | null = null;
    if (form.quoteId) quote = await getQuestion(form.quoteId, townhallId);

    const { insertedCount, ops } = await useCollection(
        'Questions',
        (Questions) =>
            Questions.insertOne({
                meta: {
                    townhallId: new ObjectID(townhallId),
                    ...makeMeta(user),
                },
                question: form.question,
                state: '', // initial state is always empty
                likes: [],
                aiml: {
                    labels: [],
                },
                visibility: 'visible',
                replies: [],
                quote,
            })
    );
    if (insertedCount === 0) throw new Error('Unable to create question');
    else events.emit('create-question', ops[0]);
}

export async function likeQuestion(
    questionId: string,
    townhallId: string,
    userId: ObjectId
) {
    const { matchedCount, modifiedCount } = await useCollection(
        'Questions',
        (Questions) =>
            Questions.updateOne(
                {
                    _id: new ObjectID(questionId),
                    'meta.townhallId': new ObjectID(townhallId),
                },
                {
                    $addToSet: {
                        likes: userId,
                    },
                }
            )
    );
    if (matchedCount === 0) throw createHttpError(404);
    if (modifiedCount === 0)
        // prettier is dumb https://github.com/prettier/prettier/issues/973
        throw createHttpError(409, "You've already liked this question!");
}

export async function deleteLike(
    questionId: string,
    townhallId: string,
    userId: ObjectId
) {
    const { matchedCount, modifiedCount } = await useCollection(
        'Questions',
        (Questions) =>
            Questions.updateOne(
                {
                    _id: new ObjectID(questionId),
                    'meta.townhallId': new ObjectID(townhallId),
                },
                {
                    $pull: {
                        likes: userId,
                    },
                }
            )
    );
    if (matchedCount === 0) throw createHttpError(404);
    if (modifiedCount === 0)
        // prettier is dumb https://github.com/prettier/prettier/issues/973
        throw createHttpError(
            409,
            "You've already unliked this question! (or never liked it)"
        );

    // TODO: let clients know/emit that there is a new like
    // if (modifiedCount === 1)
}
