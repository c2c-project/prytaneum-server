import events from 'lib/events';
import { Socket } from 'socket.io';
import makeDebug from 'debug';

import io from '../socket-io';

declare module '../socket-io' {
    interface Namespaces {
        '/townhalls': true;
    }
}

const townhallNamespace = io.of('/townhalls');
const info = makeDebug('prytaneum:ws/townhalls');

townhallNamespace.on('connection', (socket: Socket) => {
    info('connected');
    socket.on('disconnect', () => {
        info('disconnected');
        townhallNamespace.emit('townhall-state', { type: 'user-leave', payload: townhallNamespace.sockets.size });
        // TODO: meta event where we record the user joining the chatroom etc.
    });
    const { townhallId } = socket.handshake.query as { townhallId?: string };
    if (!townhallId) return;
    // eslint-disable-next-line no-void
    void socket.join(townhallId);
    townhallNamespace.emit('townhall-state', { type: 'user-attend', payload: townhallNamespace.sockets.size });
});

events.on('start-townhall', (townhallId) => {
    townhallNamespace.to(townhallId).emit('townhall-state', {
        type: 'townhall-start',
        payload: null,
    });
});

events.on('end-townhall', (townhallId) => {
    townhallNamespace.to(townhallId).emit('townhall-state', {
        type: 'townhall-end',
        payload: null,
    });
});
