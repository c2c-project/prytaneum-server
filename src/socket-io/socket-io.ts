/* eslint-disable max-classes-per-file */
import { Server, Namespace, Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import type { SocketIOEvents } from 'prytaneum-typings';
import env from 'config/env';

type ServerEmits = SocketIOEvents<ObjectId>;
declare class PrytaneumNamespace extends Namespace {
    emit<T extends keyof ServerEmits>(
        event: T,
        payload: ServerEmits[T]
    ): boolean;
    to(to: string): PrytaneumNamespace;
    on<T extends keyof ClientEmits, U extends (arg: ClientEmits[T]) => void>(
        event: T,
        listener: U
    ): this;
}

class PrytaneumSocketIO extends Server {
    emit<T extends keyof ServerEmits>(event: T, payload: ServerEmits[T]) {
        return super.emit(event, payload);
    }

    on<T extends keyof ClientEmits, U extends (arg: ClientEmits[T]) => void>(
        event: T,
        listener: U
    ) {
        return super.on(event, listener);
    }

    once<T extends keyof ClientEmits, U extends (arg: ClientEmits[T]) => void>(
        event: T,
        listener: U
    ) {
        return super.once(event, listener);
    }

    removeListener<
        T extends keyof ClientEmits,
        U extends (arg: ClientEmits[T]) => void
    >(event: T, listener: U) {
        return super.removeListener(event, listener);
    }

    addListener<
        T extends keyof ClientEmits,
        U extends (arg: ClientEmits[T]) => void
    >(event: T, listener: U) {
        return super.addListener(event, listener);
    }

    of<T extends keyof Namespaces>(url: T): PrytaneumNamespace {
        return super.of(url);
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Namespaces {} // intended to be extended

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ClientEmits {
    connection: Socket;
}

const io = new PrytaneumSocketIO({
    serveClient: false,
    cors: {
        origin: env.ORIGIN,
    },
});

// ugly but w/e, gets the job done
export type ioMiddleware = Parameters<typeof io.use>[0];

export default io;

// TODO: secure socketio using the signed cookies
