import { EventEmitter } from 'events';
import { CollectionMap } from 'db';

class PrytaneumEE extends EventEmitter {
    emit<T extends keyof EventMap>(event: T, payload: EventMap[T]) {
        return super.emit(event, payload);
    }

    on<T extends keyof EventMap, U extends (arg: EventMap[T]) => void>(event: T, listener: U) {
        return super.on(event, listener);
    }

    once<T extends keyof EventMap, U extends (arg: EventMap[T]) => void>(event: T, listener: U) {
        return super.once(event, listener);
    }

    removeListener<T extends keyof EventMap, U extends (arg: EventMap[T]) => void>(event: T, listener: U) {
        return super.removeListener(event, listener);
    }

    addListener<T extends keyof EventMap, U extends (arg: EventMap[T]) => void>(event: T, listener: U) {
        return super.addListener(event, listener);
    }
}

const ee = new PrytaneumEE();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type EventMap = {
    [Property in keyof CollectionMap]: { type: 'create' | 'update' | 'delete'; data: CollectionMap[Property] };
};

export default ee;
