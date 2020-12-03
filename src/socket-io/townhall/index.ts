import events from 'lib/events';
import { Socket } from 'socket.io';

import io from '../socket-io';

type UserAttend = { type: 'user-attend'; payload: null };
type UserLeave = { type: 'user-leave'; payload: null };
type TownhallStart = { type: 'townhall-start'; payload: null };
type TownhallEnd = { type: 'townhall-end'; payload: null };

declare module '../socket-io' {
    interface ServerEmits {
        'townhall-state': UserAttend | UserLeave | TownhallEnd | TownhallStart;
    }
    interface ClientEmits {
        'user-state': UserAttend | UserLeave;
        'townhall-state': TownhallStart | TownhallEnd;
    }
    interface Namespaces {
        '/townhalls': true;
    }
}

const townhallNamespace = io.of('/townhalls');

townhallNamespace.on('connection', (socket: Socket) => {
    socket.on('disconnect', () => {
        // TODO: meta event where we record the user joining the chatroom etc.
    });
    const { townhallId } = socket.handshake.query as { townhallId?: string };
    if (!townhallId) return;
    // eslint-disable-next-line no-void
    void socket.join(townhallId);
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
