import events from 'lib/events';
import { ChatMessage } from 'prytaneum-typings';
import { Socket } from 'socket.io';

import io from '../socket-io';

type UserAttend = { type: 'user-attend'; payload: ChatMessage };
type UserLeave = { type: 'user-leave'; payload: ChatMessage };
type TownhallStart = { type: 'townhall-start'; payload: ChatMessage };
type TownhallEnd = { type: 'townhall-end'; payload: ChatMessage };

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

// TODO:
events.on('end-townhall', (chatMessage) => {});
events.on('start-townhall', () => {});
