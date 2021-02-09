import http from 'http';
import { AddressInfo } from 'net';
import { makeTownhall, Subscriptions as ServerEmits, Townhall } from 'prytaneum-typings';
import { io, Socket } from 'socket.io-client';
import { Server } from 'socket.io';
import { ObjectId, ObjectID } from 'mongodb';

import events from 'lib/events';
import ioServer from '../socket-io';

// must import to properly listen
import './index';

let socket: Socket;
let httpServer: http.Server;
let httpServerAddr: AddressInfo;
let ioServerInstance: Server;
const townhall = { ...makeTownhall(), _id: new ObjectID() };

// jest.mock('mongodb');
jest.mock('db');
beforeAll(() => {
    httpServer = http.createServer().listen();
    // https://nodejs.org/api/net.html#net_server_address
    // this should never be null --
    // "server.address() returns null before the 'listening' event has been emitted or after calling server.close()."
    // listen() is called above
    httpServerAddr = httpServer.address() as AddressInfo;
    ioServerInstance = ioServer.attach(httpServer);
});

afterAll(() => {
    // jest.unmock('mongodb');
    ioServerInstance.close();
    httpServer.close();
});

beforeEach((done) => {
    if (!httpServerAddr) throw new Error('Test initialization for socketio failed');

    socket = io(`http://[${httpServerAddr.address}]:${httpServerAddr.port}/townhalls`, {
        reconnectionDelay: 0,
        forceNew: true,
        transports: ['websocket'],
        query: `townhallId=${townhall._id.toHexString()}`,
    });
    socket.on('connect', () => {
        done();
    });
});

afterEach(() => {
    if (socket.connected) {
        socket.disconnect();
    }
    jest.restoreAllMocks();
});

/**
 * NOTE: This seems a little weird that the tests work
 * i'm using .once and .on after I .emit, but it's working so...
 * just a note that if something weird breaks in the future I might need
 * to put the .once/.on's before the .emit
 */
describe('socket-io /townhalls', () => {
    it('should send a a message that the townhall has started', async () => {
        // i know townhall._id is a string here
        events.emit('Townhalls', { type: 'update', data: (townhall as unknown) as Townhall<ObjectId> });
        await new Promise<void>((resolve) => {
            socket.once('Townhalls', (state: ServerEmits['Townhalls']) => {
                expect(townhall._id.toHexString()).toStrictEqual(state.payload._id);
                expect(state.type).toStrictEqual('update');
                resolve();
            });
        });
    });
    it('should send a a message that the townhall has ended', async () => {
        // i know townhall._id is a string here
        events.emit('Townhalls', { type: 'update', data: (townhall as unknown) as Townhall<ObjectId> });
        await new Promise<void>((resolve) => {
            socket.once('Townhalls', (state: ServerEmits['Townhalls']) => {
                expect(townhall._id.toHexString()).toStrictEqual(state.payload._id);
                expect(state.type).toStrictEqual('update');
                resolve();
            });
        });
    });
});
