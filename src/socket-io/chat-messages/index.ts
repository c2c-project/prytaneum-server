/* eslint-disable @typescript-eslint/indent */
import events from 'lib/events';
import { Socket } from 'socket.io';
import makeDebug from 'debug';

import io from '../socket-io';

declare module '../socket-io' {
    interface Namespaces {
        '/chat-messages': true;
    }
}

const info = makeDebug('prytnaeum:ws/chat-messages');
const chatNamespace = io.of('/chat-messages');

chatNamespace.on('connection', (socket: Socket) => {
    info('connected');
    socket.on('disconnect', () => {
        info('disconnected');
        // TODO: meta event where we record the user joining the chatroom etc.
    });
    const { townhallId } = socket.handshake.query as { townhallId?: string };
    if (!townhallId) return;

    // getChatMessages(townhallId)
    //     .then((messages) => {
    //         socket.emit('chat-message-state', {
    //             type: 'initial-state',
    //             payload: messages,
    //         });
    //     })
    //     .catch(info);

    // eslint-disable-next-line no-void
    void socket.join(townhallId);
});

events.on('ChatMessages', (payload) => {
    const { townhallId } = payload.data.meta;
    chatNamespace.to(townhallId.toHexString()).emit('ChatMessages', { type: payload.type, payload: payload.data });
});

// events.on('create-chat-message', (chatMessage) => {
//     const { townhallId } = chatMessage.meta;
//     chatNamespace.to(townhallId.toString()).emit('chat-message-state', {
//         type: 'create-chat-message',
//         payload: chatMessage,
//     });
// });

// events.on('update-chat-message', (chatMessage) => {
//     const { townhallId } = chatMessage.meta;
//     chatNamespace.to(townhallId.toString()).emit('chat-message-state', {
//         type: 'update-chat-message',
//         payload: chatMessage,
//     });
// });

// events.on('delete-chat-message', (chatMessage) => {
//     const { townhallId } = chatMessage.meta;
//     chatNamespace.to(townhallId.toString()).emit('chat-message-state', {
//         type: 'delete-chat-message',
//         payload: chatMessage,
//     });
// });

// events.on('moderate-chat-message', (chatMessage) => {
//     const { townhallId } = chatMessage.meta;
//     chatNamespace.to(townhallId.toString()).emit('chat-message-state', {
//         type: 'moderate-chat-message',
//         payload: chatMessage,
//     });
// });
