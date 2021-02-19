import {
    MongoClient,
    Db,
    Collection,
    ObjectId,
    ClientSession,
    TransactionOptions,
} from 'mongodb';
import makeDebug from 'debug';
import type {
    User,
    Townhall,
    Question,
    ChatMessage,
    InviteLink,
    FeedbackReport,
    BugReport,
    Notification
} from 'prytaneum-typings';

import config from 'config/mongo';

const info = makeDebug('prytaneum:db');

const { url, dbName } = config;

const mongoClient = new MongoClient(url, {
    useUnifiedTopology: true,
});

export async function connect() {
    info(`Attempting database connection to ${url}`);
    if (!mongoClient.isConnected())
        return mongoClient
            .connect()
            .finally(() => info('Successfully connected'));
    info('Mongo client is already connected');
    return mongoClient;
}

export type DbCallback<T> = (d: Db) => T;

export async function wrapDb<T>(cb: DbCallback<T>) {
    const client = await connect();
    const db = client.db(dbName);
    return cb(db);
}

interface CollectionMap {
    Users: User<ObjectId>;
    Townhalls: Townhall<ObjectId>;
    Questions: Question<ObjectId>;
    ChatMessages: ChatMessage<ObjectId>;
    InviteLinks: InviteLink<ObjectId>;
    FeedbackReports: FeedbackReport<ObjectId>;
    BugReports: BugReport<ObjectId>;
    Notifications: Notification<ObjectId>;
}

export async function useCollection<T extends keyof CollectionMap, U>(
    name: T,
    cb: (c: Collection<CollectionMap[T]>) => U
): Promise<U> {
    const coll = await wrapDb(
        (db): Collection<CollectionMap[T]> => db.collection(name)
    );
    return cb(coll);
}

/**
 * used to create a series of atomic updates (i think)
 * https://docs.mongodb.com/manual/core/transactions/#transactions
 */
export async function useSession<T extends keyof CollectionMap, U>(
    name: T,
    cb: (c: Collection<CollectionMap[T]>, session: ClientSession) => Promise<U>,
    options?: TransactionOptions
): Promise<void> {
    const client = await connect();
    const session = client.startSession();
    await session.withTransaction(async () => {
        const db = client.db(dbName);
        const coll = db.collection(name);
        await cb(coll, session);
    }, options);
    // in the mongodb docs linked above they use await, the types are probably wrong --too lazy to check
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await session.endSession();
}
