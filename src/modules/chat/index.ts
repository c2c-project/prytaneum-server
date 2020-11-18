import { useCollection } from 'db';
import createHttpError from 'http-errors';
import events from 'lib/events';
import { ObjectID } from 'mongodb';
import { ChatMessage, User } from 'prytaneum-typings';

declare module 'lib/events' {
    interface EventMap {
        'create-chat-message': ChatMessage;
        'update-chat-message': ChatMessage;
        'delete-chat-message': ChatMessage;
    }
}

export async function createChatMessage(
    message: string,
    townhallId: string,
    user: User
) {
    const { insertedCount, ops } = await useCollection(
        'ChatMessages',
        (ChatMessages) =>
            ChatMessages.insertOne({
                meta: {
                    createdAt: new Date(),
                    createdBy: {
                        _id: user._id,
                        name: user.name,
                    },
                    townhallId: new ObjectID(townhallId),
                },
                message,
            })
    );
    if (insertedCount === 0)
        throw new Error('Unable to insert new chat message');
    else events.emit('create-chat-message', ops[0]);
}
export async function updateChatMessage(
    message: string,
    messageId: string,
    townhallId: string,
    user: User
) {
    const { value } = await useCollection('ChatMessages', (ChatMessages) =>
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
    if (!value) throw createHttpError(403, 'You must be the message owner');
    else events.emit('update-chat-message', value);
}

/**
 * this is for when a message owner wants to delete the message
 */
export async function deleteChatMessage(
    messageId: string,
    townhallId: string,
    user: User
) {
    const { value } = await useCollection('ChatMessages', (ChatMessages) =>
        ChatMessages.findOneAndDelete({
            _id: new ObjectID(messageId),
            'meta.townhallId': new ObjectID(townhallId),
            'meta.createdBy._id': user._id,
        })
    );
    // this could also error when the message id or townhall id is invalid
    // but the assumption is that the user id does not match the message
    // since the message id and townhall id are validated before hand
    if (!value) throw createHttpError(403, 'You must be the message owner');
    else events.emit('delete-chat-message', value);
}
/**
 * TODO: filters
 */
export async function getChatMessages(townhallId: string) {
    return useCollection('ChatMessages', (ChatMessages) =>
        ChatMessages.find({
            'meta.townhallId': new ObjectID(townhallId),
        }).toArray()
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
 * TODO:
 */
export async function moderateMessage() {}
