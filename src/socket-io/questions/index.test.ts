import http from 'http';
import { AddressInfo } from 'net';
import { makeQuestion, Question } from 'prytaneum-typings';
import { io, Socket } from 'socket.io-client';
import { Server } from 'socket.io';
import { ObjectId } from 'mongodb';
import type { SocketIOEvents as ServerEmits } from 'prytaneum-typings';

// import * as DB from 'db';
import events from 'lib/events';
import ioServer from '../socket-io';

// must import to properly listen
import './index';

let socket: Socket;
let httpServer: http.Server;
let httpServerAddr: AddressInfo;
let ioServerInstance: Server;
const question = makeQuestion();

// IMPORTANT: this is here because of the initial state load on a connection
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
        events.emit(
            'create-question',
            (question as unknown) as Question<ObjectId>
        );
        await new Promise<void>((resolve) => {
            socket.once(
                'question-state',
                (state: ServerEmits['question-state']) => {
                    expect(state.type).toStrictEqual('create-question');
                    // THIS IS JUST EXTRA I HAVE TO TYPE TO KEEP TS HAPPY
                    if (state.type === 'create-question')
                        expect(state.payload._id).toStrictEqual(question._id);
                    else expect(false).toEqual(true);
                    resolve();
                }
            );
        });
    });
    it('should send client updated questions', async () => {
        events.emit(
            'update-question',
            (question as unknown) as Question<ObjectId>
        );
        await new Promise<void>((resolve) => {
            socket.once(
                'question-state',
                (state: ServerEmits['question-state']) => {
                    expect(state.type).toStrictEqual('update-question');
                    // THIS IS JUST EXTRA I HAVE TO TYPE TO KEEP TS HAPPY
                    if (state.type === 'update-question')
                        expect(state.payload._id).toStrictEqual(question._id);
                    else expect(false).toEqual(true);
                    resolve();
                }
            );
        });
    });
    it('should send client deleted questions', async () => {
        events.emit(
            'delete-question',
            (question as unknown) as Question<ObjectId>
        );
        await new Promise<void>((resolve) => {
            socket.once(
                'question-state',
                (state: ServerEmits['question-state']) => {
                    expect(state.type).toStrictEqual('delete-question');
                    // THIS IS JUST EXTRA I HAVE TO TYPE TO KEEP TS HAPPY
                    if (state.type === 'delete-question')
                        expect(state.payload._id).toStrictEqual(question._id);
                    else expect(false).toEqual(true);
                    resolve();
                }
            );
        });
    });
});
