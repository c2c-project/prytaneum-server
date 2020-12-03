/* eslint-disable @typescript-eslint/indent */
import debug from 'debug';

import events from 'lib/events';
import type { Question } from 'prytaneum-typings';
import { Socket } from 'socket.io';
import { getQuestions } from 'modules/questions';

import io from '../socket-io';

const info = debug('socket-io:questions');

type InitialState = { type: 'initial-state'; payload: Question[] };
type CreatePayload = { type: 'create-question'; payload: Question };
type UpdatePayload = { type: 'update-question'; payload: Question };
type DeletePayload = { type: 'delete-question'; payload: Question };

declare module '../socket-io' {
    interface ServerEmits {
        'question-state':
            | CreatePayload
            | UpdatePayload
            | DeletePayload
            | InitialState;
    }
    interface Namespaces {
        '/questions': true;
    }
}

const questionNamespace = io.of('/questions');

questionNamespace.on('connection', (socket: Socket) => {
    socket.on('disconnect', () => {
        // TODO: meta event where we record the user joining the chatroom etc.
    });
    const { townhallId } = socket.handshake.query as { townhallId?: string };
    if (!townhallId) return;

    // send initial state
    getQuestions(townhallId)
        .then((questions) => {
            socket.emit('question-state', {
                type: 'initial-state',
                payload: questions,
            });
        })
        .catch(info);

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
