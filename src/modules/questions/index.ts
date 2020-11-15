import { ObjectId, ObjectID } from 'mongodb';
import { QuestionForm, User } from 'prytaneum-typings';
import createError from 'http-errors';

import { useCollection } from 'db';
import eventEmitter from 'lib/events';

// TODO: replies as a subcollection

export async function getQuestions(townhallId: string) {
    return useCollection('Questions', (Questions) =>
        Questions.find({ 'meta.townhallId': townhallId }).toArray()
    );
}

export async function getQuestion(questionId: string, townhallId: string) {
    const doc = await useCollection('Questions', (Questions) =>
        Questions.findOne({
            _id: new ObjectID(questionId),
            'meta.townhallId': new ObjectID(townhallId),
        })
    );
    if (!doc) throw createError(404, 'Question not found');
    return doc;
}

export async function updateQuestion(
    questionId: string,
    townhallId: string,
    userId: ObjectId,
    form: QuestionForm
) {
    const { modifiedCount } = await useCollection('Questions', (Questions) =>
        Questions.updateOne(
            {
                _id: new ObjectID(questionId),
                'meta.townhallId': new ObjectID(townhallId),
                'meta.user._id': userId,
            },
            {
                $set: {
                    question: form.question,
                },
            }
        )
    );
    if (modifiedCount === 0)
        throw createError(401, 'Unable to update question');
    // probably because it's not the owner
    // TODO:
    // else eventEmitter.emit('update-question');
}

export async function deleteQuestion(
    questionId: string,
    townhallId: string,
    userId: ObjectId
) {
    const { deletedCount } = await useCollection('Questions', (Questions) =>
        Questions.deleteOne({
            _id: new ObjectId(questionId),
            'meta.townhallId': new ObjectId(townhallId),
            'meta.user._id': userId,
        })
    );
    if (deletedCount === 0) throw createError(401, 'You must be the owner');
}

export function moderateQuestion(questionId: string) {}

export async function createQuestion(
    form: QuestionForm,
    townhallId: string,
    user: User
) {
    const { insertedCount, ops } = await useCollection(
        'Questions',
        (Questions) =>
            Questions.insertOne({
                meta: {
                    townhallId: new ObjectID(townhallId),
                    user: {
                        _id: new ObjectID(user._id),
                        name: user.name,
                    },
                    timestamp: new Date(),
                },
                question: form.question,
                state: '', // initial state is always empty
                likes: [],
                aiml: {
                    labels: [],
                },
            })
    );
    if (insertedCount === 0) throw new Error('Unable to create question');
    else eventEmitter.emit('create-question', ops[0]);
}
