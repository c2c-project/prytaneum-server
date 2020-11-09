import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

import config from 'config/mongo';
import { User, Townhall } from 'prytaneum-typings';

const { url, dbName } = config;

const clientPromise = new MongoClient(url, {
    useUnifiedTopology: true,
}).connect();

export type DbCallback<T> = (d: Db) => T;

export async function wrapDb<T>(cb: DbCallback<T>) {
    const client = await clientPromise;
    const db = client.db(dbName);
    return cb(db);
}

export type CollectionNames = 'Users' | 'Townhalls';
export async function useCollection<T, U>(
    name: 'Users',
    cb: (c: Collection<User & { _id: ObjectId }>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: 'Townhalls',
    cb: (c: Collection<Townhall & { _id: ObjectId }>) => U
): Promise<U>;
export async function useCollection<T, U>(
    name: CollectionNames,
    cb: (c: Collection<T>) => U
): Promise<U> {
    const coll = await wrapDb((db): Collection<T> => db.collection<T>(name));
    return cb(coll);
}
