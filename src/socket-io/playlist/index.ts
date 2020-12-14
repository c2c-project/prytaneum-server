/* eslint-disable @typescript-eslint/indent */
import events from 'lib/events';
import { Socket } from 'socket.io';
import makeDebug from 'debug';
import { ObjectId } from 'mongodb';
import type { WrapPayload, Question } from 'prytaneum-typings';

import io from '../socket-io';

type PlaylistAdd = WrapPayload<'playlist-add', Question<ObjectId>>;
type PlaylistRemove = WrapPayload<'playlist-remove', string>;
type QueueOrder = WrapPayload<'playlist-queue-order', Question<ObjectId>[]>;
type QueueAdd = WrapPayload<'playlist-queue-add', Question<ObjectId>>;
type QueueRemove = WrapPayload<'playlist-queue-remove', string>;
type PlaylistNext = WrapPayload<'playlist-queue-next', null>;

declare module '../socket-io' {
    interface ServerEmits {
        'playlist-state':
            | PlaylistAdd
            | PlaylistRemove
            | QueueAdd
            | QueueRemove
            | PlaylistNext
            | QueueOrder;
    }
    interface Namespaces {
        '/playlist': true;
    }
}

const playlistNamespace = io.of('/playlist');
const info = makeDebug('prytaneum:ws/playlist');

playlistNamespace.on('connection', (socket: Socket) => {
    info('connected');
    socket.on('disconnect', () => {
        info('disconnected');
    });
    const { townhallId } = socket.handshake.query as { townhallId?: string };
    if (!townhallId) {
        info('No townhallId present');
        socket.disconnect();
        return;
    }
    // eslint-disable-next-line no-void
    void socket.join(townhallId);
});

events.on('playlist-add', (question) => {
    const { townhallId } = question.meta;
    playlistNamespace
        .to(townhallId.toHexString())
        .emit('playlist-state', { type: 'playlist-add', payload: question });
});

events.on('playlist-remove', ({ townhallId, questionId }) => {
    playlistNamespace.to(townhallId).emit('playlist-state', {
        type: 'playlist-remove',
        payload: questionId,
    });
});

events.on('playlist-queue-add', (question) => {
    const { townhallId } = question.meta;
    playlistNamespace.to(townhallId.toHexString()).emit('playlist-state', {
        type: 'playlist-queue-add',
        payload: question,
    });
});

events.on('playlist-queue-remove', ({ questionId, townhallId }) => {
    playlistNamespace.to(townhallId).emit('playlist-state', {
        type: 'playlist-queue-remove',
        payload: questionId,
    });
});

events.on('playlist-queue-order', (questions) => {
    const { townhallId } = questions[0].meta;
    playlistNamespace.to(townhallId.toHexString()).emit('playlist-state', {
        type: 'playlist-queue-order',
        payload: questions,
    });
});

events.on('playlist-queue-next', (townhallId) => {
    playlistNamespace.to(townhallId).emit('playlist-state', {
        type: 'playlist-queue-next',
        payload: null,
    });
});
