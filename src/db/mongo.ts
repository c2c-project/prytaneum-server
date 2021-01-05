import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import makeDebug from 'debug';
import type { User, Townhall, Question, ChatMessage } from 'prytaneum-typings';

import config from 'config/mongo';

const info = makeDebug('prytaneum:db');

const { url, dbName } = config;

export interface MetaData {
    name: string;
    size: number; // Size in bytes
    sentDateTime: string; // UTC Format
}

export interface Notification<T> {
    _id: T;
    region: string;
    unsubscribeList: Array<string>;
    subscribeList: Array<string>;
    inviteHistory: Array<MetaData>;
}

info(`Attempting database connection to ${url}`);
const clientPromise = new MongoClient(url, {
    useUnifiedTopology: true,
})
    .connect()
    .finally(() => info('Successfully connected'));

export type DbCallback<T> = (d: Db) => T;

export async function wrapDb<T>(cb: DbCallback<T>) {
    const client = await clientPromise;
    const db = client.db(dbName);
    return cb(db);
}

export type CollectionNames =
    | 'Users'
    | 'Townhalls'
    | 'Questions'
    | 'ChatMessages'
    | 'Notifications';
export async function useCollection<T, U>(
    name: 'Users',
    cb: (c: Collection<User<ObjectId>>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: 'Townhalls',
    cb: (c: Collection<Townhall<ObjectId>>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: 'Questions',
    cb: (c: Collection<Question<ObjectId>>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: 'ChatMessages',
    cb: (c: Collection<ChatMessage<ObjectId>>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: 'Notifications',
    cb: (c: Collection<Notification<ObjectId>>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: CollectionNames,
    cb: (c: Collection<T>) => U
): Promise<U> {
    const coll = await wrapDb((db): Collection<T> => db.collection<T>(name));
    return cb(coll);
}
