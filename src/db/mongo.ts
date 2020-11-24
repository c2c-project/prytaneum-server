import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import makeDebug from 'debug';

import config from 'config/mongo';
import { User, Townhall, Question, ChatMessage } from 'prytaneum-typings';

const info = makeDebug('prytaneum:db');

const { url, dbName } = config;

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
    | 'ChatMessages';
export async function useCollection<T, U>(
    name: 'Users',
    cb: (c: Collection<User & { _id: ObjectId }>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: 'Townhalls',
    cb: (c: Collection<Townhall & { _id: ObjectId }>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: 'Questions',
    cb: (c: Collection<Question & { _id: ObjectId }>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: 'ChatMessages',
    cb: (c: Collection<ChatMessage & { _id: ObjectId }>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: CollectionNames,
    cb: (c: Collection<T>) => U
): Promise<U> {
    const coll = await wrapDb((db): Collection<T> => db.collection<T>(name));
    return cb(coll);
}
