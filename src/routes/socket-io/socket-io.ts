/* eslint-disable max-classes-per-file */
import { Server, Namespace } from 'socket.io';

declare class PrytaneumNamespace extends Namespace {
    emit<T extends keyof Events>(event: T, payload: Events[T]): boolean;
    to(to: string): PrytaneumNamespace;
}

class PrytaneumSocketIO extends Server {
    emit<T extends keyof Events>(event: T, payload: Events[T]) {
        return super.emit(event, payload);
    }

    on<T extends keyof Events, U extends (arg: Events[T]) => void>(
        event: T,
        listener: U
    ) {
        return super.on(event, listener);
    }

    once<T extends keyof Events, U extends (arg: Events[T]) => void>(
        event: T,
        listener: U
    ) {
        return super.once(event, listener);
    }

    removeListener<T extends keyof Events, U extends (arg: Events[T]) => void>(
        event: T,
        listener: U
    ) {
        return super.removeListener(event, listener);
    }

    addListener<T extends keyof Events, U extends (arg: Events[T]) => void>(
        event: T,
        listener: U
    ) {
        return super.addListener(event, listener);
    }

    of<T extends keyof Namespaces>(url: T): PrytaneumNamespace {
        return super.of(url);
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Events {} // intended to be extended
// TODO: move this to client?

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Namespaces {} // intended to be extended

export default new PrytaneumSocketIO();
