import http from 'http';
import { AddressInfo } from 'net';
import { makeTownhall } from 'prytaneum-typings';
import { io, Socket } from 'socket.io-client';
import { Server } from 'socket.io';

import events from 'lib/events';
import ioServer, { ServerEmits } from '../socket-io';

// must import to properly listen
import './index';

let socket: Socket;
let httpServer: http.Server;
let httpServerAddr: AddressInfo;
let ioServerInstance: Server;
const townhall = makeTownhall();

beforeAll(() => {
    jest.mock('mongodb');
    httpServer = http.createServer().listen();
    // https://nodejs.org/api/net.html#net_server_address
    // this should never be null --
    // "server.address() returns null before the 'listening' event has been emitted or after calling server.close()."
    // listen() is called above
    httpServerAddr = httpServer.address() as AddressInfo;
    ioServerInstance = ioServer.attach(httpServer);
});

afterAll(() => {
    jest.unmock('mongodb');
    ioServerInstance.close();
    httpServer.close();
});

beforeEach((done) => {
    if (!httpServerAddr)
        throw new Error('Test initialization for socketio failed');
    socket = io(
        `http://[${httpServerAddr.address}]:${httpServerAddr.port}/townhalls`,
        {
            reconnectionDelay: 0,
            forceNew: true,
            transports: ['websocket'],
            query: `townhallId=${townhall._id as string}`,
        }
    );
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
describe('socket-io /questions', () => {
    it('should send a a message that the townhall has started', async () => {
        // i know townhall._id is a string here
        events.emit('start-townhall', townhall._id as string);
        await new Promise((resolve) => {
            socket.once(
                'townhall-state',
                (state: ServerEmits['townhall-state']) => {
                    expect(null).toStrictEqual(state.payload);
                    expect(state.type).toStrictEqual('townhall-start');
                    resolve();
                }
            );
        });
    });
    it('should send a a message that the townhall has ended', async () => {
        // i know townhall._id is a string here
        events.emit('end-townhall', townhall._id as string);
        await new Promise((resolve) => {
            socket.once(
                'townhall-state',
                (state: ServerEmits['townhall-state']) => {
                    expect(null).toStrictEqual(state.payload);
                    expect(state.type).toStrictEqual('townhall-end');
                    resolve();
                }
            );
        });
    });
});
