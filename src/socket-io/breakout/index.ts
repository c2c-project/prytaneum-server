/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/indent */
import events from 'lib/events';
import { Socket } from 'socket.io';
import makeDebug from 'debug';
import type { Breakout } from 'prytaneum-typings';
import { ObjectID, ObjectId } from 'mongodb';

import { useCollection } from 'db';
import { findMyBreakout } from 'modules/chat';
import shuffle from 'utils/shuffle';
import io from '../socket-io';
import { init, cookieParser, requireLogin } from '../middlewares';
import { getClients, storeSocketId, removeSocketId, findBySocketId, hasUser, hasResults } from '../utils';

declare module '../socket-io' {
    interface Namespaces {
        '/breakout-rooms': true;
    }
}

async function createBreakoutRoom(doc: Omit<Breakout<ObjectId>, '_id'>) {
    return useCollection('BreakoutRooms', (BreakoutRooms) => BreakoutRooms.insertOne(doc));
}

async function endBreakoutRooms(townhallId: string) {
    return useCollection('BreakoutRooms', (BreakoutRooms) =>
        BreakoutRooms.updateMany({ townhallId: new ObjectID(townhallId) }, { $set: { active: false } })
    );
}

// declarations
const info = makeDebug('prytaneum:ws/breakout-rooms');
export const breakoutNamespace = io.of('/breakout-rooms');

// middlewares required for this namespace
breakoutNamespace.use(init);
breakoutNamespace.use(cookieParser);
breakoutNamespace.use(requireLogin());

breakoutNamespace.on('connection', (socket: Socket) => {
    info('connected');
    storeSocketId(socket).catch((e) => {
        info(e);
        socket.disconnect();
    });

    socket.on('disconnect', () => {
        info('disconnected');
        removeSocketId(socket).catch(info);
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
    if (hasResults(socket.request) && hasUser(socket.request.results))
        findMyBreakout(townhallId, socket.request.results.user._id)
            .then((_id) => socket.join(_id.toHexString()))
            .catch(info);
});

events.on('create-chat-message', (chatMessage) => {
    const { breakoutId } = chatMessage.meta;
    breakoutNamespace.to(breakoutId.toString()).emit('chat-message-state', {
        type: 'create-chat-message',
        payload: chatMessage,
    });
});

events.on('update-chat-message', (chatMessage) => {
    const { breakoutId } = chatMessage.meta;
    breakoutNamespace.to(breakoutId.toString()).emit('chat-message-state', {
        type: 'update-chat-message',
        payload: chatMessage,
    });
});

events.on('delete-chat-message', (chatMessage) => {
    const { breakoutId } = chatMessage.meta;
    breakoutNamespace.to(breakoutId.toString()).emit('chat-message-state', {
        type: 'delete-chat-message',
        payload: chatMessage,
    });
});

events.on('moderate-chat-message', (chatMessage) => {
    const { breakoutId } = chatMessage.meta;
    breakoutNamespace.to(breakoutId.toString()).emit('chat-message-state', {
        type: 'moderate-chat-message',
        payload: chatMessage,
    });
});

// TODO: this implementation is limited: cannot manage users per breakout room and cannot assign a user to one who joins late.
events.on('breakout-start', ({ townhallId, numRooms }) => {
    const clients = getClients(breakoutNamespace, townhallId);

    // sanity check, can't create more rooms than 1/2 the number of connected clients (2 per room)
    if (numRooms > Math.ceil(clients.length / 2)) throw new Error('Nice try'); // TODO: better error message

    // per Kevin's request, shuffle the clients first before assigning to a breakout room
    const shuffledClients = shuffle(clients);
    const roomDocs: Breakout<ObjectId>[] = new Array(numRooms).fill(0).map((_unused, idx) => ({
        _id: new ObjectID(),
        townhallId: new ObjectID(townhallId),
        roomId: idx,
        sockets: [],
        active: true,
    }));

    // retrieve user id's
    findBySocketId(clients)
        .then((users) => {
            if (users.length === 0) throw new Error('No users present');
            const socketSet = new Set(shuffledClients.map(({ id }) => id));

            // stitch together users and their socket id's
            const socketUserMap: { [index: string]: string | undefined } = users.reduce((accum, { sockets, _id }) => {
                // intersection between sockets found in user doc and sockets for this particular namespace
                // should have a size of 1
                const intersection = new Set(sockets.filter((socket) => socketSet.has(socket)));
                if (intersection.size === 1) {
                    const firstEntry = (intersection.values().next().value as unknown) as string;
                    return { ...accum, [firstEntry]: _id.toHexString() };
                }
                return accum;
            }, {});

            // iterate through clients and assign to a breakout room
            for (let i = 0; i < shuffledClients.length; i += 1) {
                // extract socket
                const socket = shuffledClients[i];

                // determine room number based on remainder
                const room = i % numRooms;

                // get the mapped user id for this socket
                const userId = socketUserMap[socket.id];

                // if there's a userId mapped to the socket
                if (userId) {
                    // add the userid to the corresponding room
                    roomDocs[room].sockets.push(userId);

                    // eslint-disable-next-line no-void
                    void socket.join(roomDocs[room]._id.toHexString()); // TODO: promise.all
                }
            }

            // create corresponding db documents
            const breakouts: ReturnType<typeof createBreakoutRoom>[] = [];
            for (let i = 0; i < roomDocs.length; i += 1) {
                breakouts.push(createBreakoutRoom(roomDocs[i]));
            }

            Promise.all(breakouts)
                .then(() => {
                    // after the breakout rooms are all created, then let the clients know that the breakouts are ready
                    for (let i = 0; i < shuffledClients.length; i += 1) {
                        const roomDoc = roomDocs[i % numRooms];
                        shuffledClients[i].emit('chat-message-state', { type: 'breakout-start', payload: roomDoc._id });
                    }
                })
                .catch(info);
        })
        .catch(info);
});

events.on('breakout-end', ({ townhallId }) => {
    const clients = getClients(breakoutNamespace, townhallId);

    const removals: ReturnType<typeof removeSocketId>[] = [];

    // iterate and remove from breakouts
    for (let i = 0; i < clients.length; i += 1) {
        const socket = clients[i];
        const breakoutRoom = Array.from(socket.rooms.keys()).find((room) => room.includes('breakout'));
        // eslint-disable-next-line no-void
        if (breakoutRoom) void socket.leave(breakoutRoom); // TODO: promise.all
        socket.emit('chat-message-state', { type: 'breakout-end', payload: null });
        removals.push(removeSocketId(socket));
    }

    Promise.all(removals)
        .catch(info)
        .then(() => endBreakoutRooms(townhallId))
        .catch(info);
});

events.on('breakout-change-room', ({ townhallId, from, to, sockets }) => {
    const socketSet = new Set(sockets);
    const clients = getClients(breakoutNamespace, townhallId);
    const socket = clients.find((client) => socketSet.has(client.id));
    if (socket) {
        // eslint-disable-next-line no-void
        void socket.leave(from);
        // eslint-disable-next-line no-void
        void socket.join(to);
    }
});
