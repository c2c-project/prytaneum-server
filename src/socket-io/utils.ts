import http from 'http';
import type { User } from 'prytaneum-typings';
import { Socket } from 'socket.io';
import { ObjectId } from 'mongodb';

import { useCollection } from 'db';
import { PrytaneumNamespace } from './socket-io';

export function hasResults(
    req: http.IncomingMessage
): req is http.IncomingMessage & { results: Record<string, unknown> } {
    return Boolean((req as { results?: Record<string, unknown> }).results);
}
export function hasUser(results: Record<string, unknown>): results is { user: User<ObjectId> } {
    return Boolean(results.user);
}

export function getClients(namespace: PrytaneumNamespace, townhallId: string) {
    const clients = namespace.sockets.values();

    // extract relevant clients
    const relevantClients = Array.from(clients).filter((client) => client.rooms.has(townhallId));

    return relevantClients;
}

export async function storeSocketId(socket: Socket) {
    if (!hasResults(socket.request) || !hasUser(socket.request.results)) throw new Error('User not logged in');
    const userId = socket.request.results.user._id;
    return useCollection('Users', (Users) => Users.updateOne({ _id: userId }, { $addToSet: { sockets: socket.id } }));
}

export async function removeSocketId(socket: Socket) {
    if (!hasResults(socket.request) || !hasUser(socket.request.results)) throw new Error('User not logged in');
    const userId = socket.request.results.user._id;
    return useCollection('Users', (Users) => Users.updateOne({ _id: userId }, { $pull: { sockets: socket.id } }));
}

export async function findBySocketId(sockets: Socket[]) {
    const socketIds = sockets.map(({ id }) => id);
    return useCollection('Users', (Users) =>
        Users.find({ $or: socketIds.map((socket) => ({ sockets: socket })) }).toArray()
    );
}
