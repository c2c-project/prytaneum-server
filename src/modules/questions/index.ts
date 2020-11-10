import { ObjectID } from 'mongodb';
import { useCollection } from 'db';

export async function getQuestions(townhallId: string) {
    return useCollection('Questions', (Questions) =>
        Questions.find({ 'meta.townhallId': townhallId }).toArray()
    );
}

export function getQuestion(questionId: string) {
    return useCollection('Questions', (Questions) =>
        Questions.findOne({ _id: new ObjectID(questionId) })
    );
}

export function updateQuestion(questionId: string, userId: string) {
    return useCollection('Questions', (Questions) =>
        Questions.findOne({
            _id: new ObjectID(questionId),
            'meta.user._id': new ObjectID(userId),
        })
    );
}

export function deleteQuestion(questionId: string) {}

export function moderateQuestion(questionId: string) {}
