import events from 'lib/events';
import { ChatMessage } from 'prytaneum-typings';
import { Socket } from 'socket.io';

import io from '../socket-io';

type CreatePayload = { type: 'create-chat-message'; payload: ChatMessage };
type UpdatePayload = { type: 'update-chat-message'; payload: ChatMessage };
type DeletePayload = { type: 'delete-chat-message'; payload: ChatMessage };

declare module '../socket-io' {
    interface ServerEmits {
        'chat-message-state': CreatePayload | UpdatePayload | DeletePayload;
    }
    interface Namespaces {
        '/chat-messages': true;
    }
}

const chatNamespace = io.of('/chat-messages');

chatNamespace.on('connection', (socket: Socket) => {
    socket.on('disconnect', () => {
        // TODO: meta event where we record the user joining the chatroom etc.
    });
    const { townhallId } = socket.handshake.query as { townhallId?: string };
    if (!townhallId) return;
    // eslint-disable-next-line no-void
    void socket.join(townhallId);
});

events.on('create-chat-message', (chatMessage) => {
    const { townhallId } = chatMessage.meta;
    chatNamespace.to(townhallId.toString()).emit('chat-message-state', {
        type: 'create-chat-message',
        payload: chatMessage,
    });
});

events.on('update-chat-message', (chatMessage) => {
    const { townhallId } = chatMessage.meta;
    chatNamespace.to(townhallId.toString()).emit('chat-message-state', {
        type: 'update-chat-message',
        payload: chatMessage,
    });
});

events.on('delete-chat-message', (chatMessage) => {
    const { townhallId } = chatMessage.meta;
    chatNamespace.to(townhallId.toString()).emit('chat-message-state', {
        type: 'delete-chat-message',
        payload: chatMessage,
    });
});
