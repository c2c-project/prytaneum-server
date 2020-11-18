import { ObjectId, ObjectID } from 'mongodb';
import { QuestionForm, User, Question } from 'prytaneum-typings';
import createHttpError from 'http-errors';

import { useCollection } from 'db';
import events from 'lib/events';

// declaration merging
declare module 'lib/events' {
    interface EventMap {
        'create-question': Question;
        'update-question': Question;
        'delete-question': Question;
        'moderate-question': Question;
    }
}

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
    const { deletedCount } = await useCollection('Questions', (Questions) =>
        Questions.deleteOne({
            _id,
            'meta.townhallId': new ObjectId(townhallId),
            'meta.user._id': userId,
        })
    );
    if (deletedCount === 0) throw createHttpError(401, 'You must be the owner');
    else events.emit('delete-question', _id);
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
    else events.emit('create-question', ops[0]);
}
