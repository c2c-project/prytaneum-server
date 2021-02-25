/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/indent */
import events from 'lib/events';
import { Socket } from 'socket.io';
import makeDebug from 'debug';

import shuffle from 'utils/shuffle';
import io from '../socket-io';

declare module '../socket-io' {
    interface Namespaces {
        '/chat-messages': true;
    }
}

const info = makeDebug('prytnaeum:ws/chat-messages');
const chatNamespace = io.of('/chat-messages');

export function getClients(townhallId: string) {
    const clients = chatNamespace.sockets.values();

    // extract relevant clients
    const relevantClients = Array.from(clients).filter((client) => client.rooms.has(townhallId));

    return relevantClients;
}

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

events.on('moderate-chat-message', (chatMessage) => {
    const { townhallId } = chatMessage.meta;
    chatNamespace.to(townhallId.toString()).emit('chat-message-state', {
        type: 'moderate-chat-message',
        payload: chatMessage,
    });
});

// TODO: this implementation is limited: cannot manage users per breakout room and cannot assign a user to one who joins late.
events.on('breakout-start', ({ townhallId, numRooms }) => {
    const clients = getClients(townhallId);

    // sanity check, can't create more rooms than 1/2 the number of connected clients (2 per room)
    if (numRooms > clients.length / 2) throw new Error('Nice try'); // TODO: better error message

    // per Kevin's request, shuffle the clients first before assigning to a breakout room
    const shuffledClients = shuffle(clients);

    // iterate through clients and assign to a breakout room
    for (let i = 0; i < shuffledClients.length; i += 1) {
        const socket = shuffledClients[i];
        const room = i % numRooms;

        // eslint-disable-next-line no-void
        void socket.join(`${townhallId}-breakout-${room}`); // TODO: promise.all
        socket.emit('chat-message-state', { type: 'breakout-start', payload: null });
    }
});

events.on('breakout-end', ({ townhallId }) => {
    const clients = getClients(townhallId);

    // iterate and remove from breakouts
    for (let i = 0; i < clients.length; i += 1) {
        const socket = clients[i];
        const breakoutRoom = Array.from(socket.rooms.keys()).find((room) => room.includes('breakout'));
        // eslint-disable-next-line no-void
        if (breakoutRoom) void socket.leave(breakoutRoom); // TODO: promise.all
    }
});
