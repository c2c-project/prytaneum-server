/* eslint-disable @typescript-eslint/indent */
import makeDebug from 'debug';

import events from 'lib/events';
import { Socket } from 'socket.io';

import io from '../socket-io';

const info = makeDebug('prytaneum:ws/questions');

declare module '../socket-io' {
    interface Namespaces {
        '/questions': true;
    }
}

const questionNamespace = io.of('/questions');

questionNamespace.on('connection', (socket: Socket) => {
    info('Connected');
    socket.on('disconnect', () => {
        info('Disconnected');
        // TODO: meta event where we record the user joining the chatroom etc.
    });
    const { townhallId } = socket.handshake.query as { townhallId?: string };
    info(townhallId);
    if (!townhallId) return;

    // subscribe to updates
    // eslint-disable-next-line no-void
    void socket.join(townhallId);
});

events.on('create-question', (question) => {
    const { townhallId } = question.meta;
    questionNamespace.to(townhallId.toString()).emit('question-state', {
        type: 'create-question',
        payload: question,
    });
});

events.on('update-question', (question) => {
    const { townhallId } = question.meta;
    questionNamespace.to(townhallId.toString()).emit('question-state', {
        type: 'update-question',
        payload: question,
    });
});

events.on('delete-question', (question) => {
    const { townhallId } = question.meta;
    questionNamespace
        .to(townhallId.toString())
        .emit('question-state', { type: 'delete-question', payload: question });
});
