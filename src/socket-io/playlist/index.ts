/* eslint-disable @typescript-eslint/indent */
// import http from 'http';
import events from 'lib/events';
import { Socket } from 'socket.io';
import makeDebug from 'debug';
import { ObjectId } from 'mongodb';
import type { /* User */ Question } from 'prytaneum-typings';

// import isModerator from 'utils/isModerator';
import io from '../socket-io';
// import { init, cookieParser, requireLogin } from '../middlewares';

declare module '../socket-io' {
    interface Namespaces {
        '/playlist': true;
    }
}

// function hasTownhall(
//     obj: Record<string, unknown>
// ): obj is { [index: string]: unknown; townhallId: string } {
//     return Boolean(obj.townhallId);
// }

// function hasResults(
//     req: http.IncomingMessage
// ): req is http.IncomingMessage & { results: Record<string, unknown> } {
//     return Boolean((req as { results?: Record<string, unknown> }).results);
// }

// function hasUser(
//     results: Record<string, unknown>
// ): results is { user: User<ObjectId> } {
//     return Boolean(results.user);
// }

const info = makeDebug('prytaneum:ws/playlist');
const playlistNamespace = io.of('/playlist');
// playlistNamespace.use(init);
// playlistNamespace.use(cookieParser);
// playlistNamespace.use(requireLogin());

// eslint-disable-next-line consistent-return
// playlistNamespace.use((socket, next) => {
//     const { query } = socket.handshake as { query: Record<string, unknown> };
//     info('???????');
//     // const { request } = socket;
//     // if (!hasTownhall(query) || !hasResults(request)) return socket.disconnect();
//     if (!hasTownhall(query)) return socket.disconnect();
//     // const { results } = request;
//     // if (!hasUser(results)) return socket.disconnect();

//     // const { townhallId } = query;
//     next();
//     // isModerator(townhallId, results.user.email.address, results.user._id)
//     //     .then((val) => {
//     //         if (val) next();
//     //         else socket.disconnect();
//     //     })
//     //     .catch((e) => {
//     //         info(e);
//     //         socket.disconnect();
//     //     });
// });

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
    playlistNamespace.to(townhallId.toHexString()).emit('playlist-state', { type: 'playlist-add', payload: question });
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
    playlistNamespace.to(townhallId).emit('playlist-state', {
        type: 'playlist-queue-order',
        payload: (questions as unknown) as Question<ObjectId>[],
    });
});

events.on('playlist-queue-next', (townhallId) => {
    playlistNamespace.to(townhallId).emit('playlist-state', {
        type: 'playlist-queue-next',
        payload: null,
    });
});

events.on('playlist-queue-previous', (townhallId) => {
    playlistNamespace.to(townhallId).emit('playlist-state', {
        type: 'playlist-queue-previous',
        payload: null,
    });
});

events.on('playlist-like-add', ({ townhallId, questionId, userId }) => {
    playlistNamespace.to(townhallId).emit('playlist-state', {
        type: 'playlist-like-add',
        payload: { questionId, userId },
    });
});

events.on('playlist-like-remove', ({ townhallId, questionId, userId }) => {
    playlistNamespace.to(townhallId).emit('playlist-state', {
        type: 'playlist-like-remove',
        payload: { questionId, userId },
    });
});
