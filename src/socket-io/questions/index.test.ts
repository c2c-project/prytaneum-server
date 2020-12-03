import http from 'http';
import { AddressInfo } from 'net';
import { makeQuestion } from 'prytaneum-typings';
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
const question = makeQuestion();

// jest.mock('mongodb');
beforeAll(() => {
    jest.mock('db');
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
    if (!httpServerAddr)
        throw new Error('Test initialization for socketio failed');
    socket = io(
        `http://[${httpServerAddr.address}]:${httpServerAddr.port}/questions`,
        {
            reconnectionDelay: 0,
            forceNew: true,
            transports: ['websocket'],
            query: `townhallId=${question.meta.townhallId}`,
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
    it('should send client new questions', async () => {
        events.emit('create-question', question);
        await new Promise((resolve) => {
            socket.once(
                'question-state',
                (state: ServerEmits['question-state']) => {
                    expect(state.payload._id).toStrictEqual(question._id);
                    expect(state.type).toStrictEqual('create-question');
                    resolve();
                }
            );
        });
    });
    it('should send client updated questions', async () => {
        events.emit('update-question', question);
        await new Promise((resolve) => {
            socket.once(
                'question-state',
                (state: ServerEmits['question-state']) => {
                    expect(state.payload._id).toStrictEqual(question._id);
                    expect(state.type).toStrictEqual('update-question');
                    resolve();
                }
            );
        });
    });
    it('should send client deleted questions', async () => {
        events.emit('delete-question', question);
        await new Promise((resolve) => {
            socket.once(
                'question-state',
                (state: ServerEmits['question-state']) => {
                    expect(state.payload._id).toStrictEqual(question._id);
                    expect(state.type).toStrictEqual('delete-question');
                    resolve();
                }
            );
        });
    });
});
