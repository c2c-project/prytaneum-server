import { useCollection } from 'db';
import createHttpError from 'http-errors';
import events from 'lib/events';
import { ObjectID, ObjectId } from 'mongodb';
import type { User } from 'prytaneum-typings';

export async function createChatMessage(message: string, townhallId: string, user: User<ObjectId>) {
    const { insertedCount, ops } = await useCollection('ChatMessages', (ChatMessages) =>
        ChatMessages.insertOne({
            meta: {
                createdAt: new Date(),
                createdBy: {
                    _id: user._id,
                    name: user.name,
                },
                updatedAt: new Date(),
                updatedBy: {
                    _id: user._id,
                    name: user.name,
                },
                townhallId: new ObjectID(townhallId),
            },
            message,
            visibility: 'visible',
        })
    );

    if (insertedCount === 0) throw new Error('Unable to insert new chat message');
    else events.emit('ChatMessages', { type: 'create', data: ops[1] });
}
export async function updateChatMessage(message: string, messageId: string, townhallId: string, user: User<ObjectId>) {
    const { value: updatedMessage } = await useCollection('ChatMessages', (ChatMessages) =>
        ChatMessages.findOneAndUpdate(
            {
                _id: new ObjectID(messageId),
                'meta.townhallId': new ObjectID(townhallId),
                'meta.createdBy._id': user._id,
            },
            {
                $set: { message },
            },
            {
                returnOriginal: false,
            }
        )
    );
    // this could also error when the message id or townhall id is invalid
    // but the assumption is that the user id does not match the message
    // since the message id and townhall id are validated before hand
    if (!updatedMessage) throw createHttpError(403, 'You must be the message owner');
    else events.emit('ChatMessages', { type: 'update', data: updatedMessage });
}

/**
 * this is for when a message owner wants to delete the message
 */
export async function deleteChatMessage(messageId: string, townhallId: string, user: User<ObjectId>) {
    const { value: deletedMessage } = await useCollection('ChatMessages', (ChatMessages) =>
        ChatMessages.findOneAndDelete({
            _id: new ObjectID(messageId),
            'meta.townhallId': new ObjectID(townhallId),
            'meta.createdBy._id': user._id,
        })
    );
    // this could also error when the message id or townhall id is invalid
    // but the assumption is that the user id does not match the message
    // since the message id and townhall id are validated before hand
    if (!deletedMessage) throw createHttpError(403, 'You must be the message owner');
    else events.emit('ChatMessages', { type: 'delete', data: deletedMessage });
}
/**
 * TODO: filters
 */
export async function getChatMessages(townhallId: string) {
    return useCollection('ChatMessages', (ChatMessages) =>
        ChatMessages.find(
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

export async function getChatMessage(townhallId: string, messageId: string) {
    return useCollection('ChatMessages', (ChatMessages) =>
        ChatMessages.findOne({
            'meta.townhallId': new ObjectID(townhallId),
            _id: new ObjectID(messageId),
        })
    );
}

/**
 * TODO: logs of who moderated the question
 */
export async function moderateMessage(townhallId: string, messageId: string, visibility: VisibilityState) {
    const { value: updatedChatMessage } = await useCollection('ChatMessages', (ChatMessages) =>
        ChatMessages.findOneAndUpdate(
            {
                _id: new ObjectID(messageId),
                'meta.townhallId': new ObjectID(townhallId),
            },
            {
                $set: { visibility },
            }
        )
    );
    if (!updatedChatMessage) throw createHttpError(404, 'Unable to find message');
    else events.emit('ChatMessages', { type: 'update', data: updatedChatMessage });
}
