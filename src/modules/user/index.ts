import bcrypt from 'bcrypt';
import { ObjectID, ObjectId } from 'mongodb';
import createHttpError from 'http-errors';
import type { RegisterForm, User, ClientSafeUser, Roles } from 'prytaneum-typings';

// import { inviteToTownhall } from 'modules/townhall';
import jwt from 'lib/jwt';
import Emails from 'lib/emails';
import emitter from 'lib/events';
import { useCollection } from 'db';
import errors from './errors';

export const SALT_ROUNDS = 10;

declare module 'lib/events' {
    interface EventMap {
        'register-user': User<ObjectId>;
    }
}

type Overrides = Partial<Omit<User, '_id'>>;

export const verifyPassword = bcrypt.compare;

/**
 * minimally register a user
 */
export async function register(email: string, firstName: string, lastName: string, overrides: Overrides = {}) {
    // check for any conflicts
    const match = await useCollection('Users', (Users) => Users.findOne({ 'email.address': email }));

    // throw error if conflict found
    if (match) throw createHttpError(409, errors[409]);

    // insert user if no conflict
    const result = await useCollection('Users', (Users) =>
        Users.insertOne({
            meta: {
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
            },
            email: {
                address: email,
                verified: false,
            },
            name: {
                first: firstName,
                last: lastName,
            },
            roles: [], // no roles is a regular user
            settings: {
                townhall: {
                    anonymous: false,
                },
                notifications: {
                    enabled: true,
                    types: [],
                },
            },
            // if the password is null, then this account cannot be logged into, may be overriden
            // password may be null if a user is being "pre-registered"
            password: null,
            sockets: [],
            ...overrides,
        })
    );

    return result;
}

export async function registerForTownhall(
    regInfo: { email: string; firstName: string; lastName: string },
    townhallId: string
) {
    const result = await register(regInfo.email, regInfo.firstName, regInfo.lastName);
    if (result.ops.length === 0) throw new Error('User could not be registered');
    const userDoc = result.ops[0];
    // TODO: once emails are working uncomment this
    // return inviteToTownhall(townhallId, userDoc);
    const token = await jwt.sign(userDoc._id.toHexString());
    return `https://prytaneum.io/join/${townhallId}?token=${token}`;
}

/**
 * @description register the user with password
 * @arg form is the registration form submitted to the server
 * @throws E-mail already exists, Passwords do not match
 */
export async function registerUser(form: RegisterForm, overrides: Omit<Overrides, 'password'> = {}) {
    // encrypt password
    const password = await bcrypt.hash(form.password, SALT_ROUNDS);

    // register the user
    const result = await register(form.email, form.firstName, form.lastName, { password, ...overrides });

    // operations depending on the result
    if (result.insertedCount === 1) emitter.emit('register-user', result.ops[0]);
    else if (result.insertedCount === 0) throw new Error('Unable to register new user');

    return result.ops[0];
}

export const registerUserWithRoles = async (form: RegisterForm, roles: Roles[]) => registerUser(form, { roles });

/**
 * @description verifies the user; expects catch in calling function
 * @arg userId _id of the user to verify
 * @throws The user navigated to an invalid link
 * @returns MongoDB Cursor Promise
 */
export const confirmUserEmail = async (userId: string) => {
    const objectUserId = new ObjectID(userId);
    const result = await useCollection('Users', (Users) =>
        Users.updateOne({ _id: objectUserId }, { $set: { 'email.verified': true } })
    );
    if (result.modifiedCount === 0) throw createHttpError(404, errors[404]);
};

/**
 * @description Function to send reset password link to user's email using jwt based on user's _id
 * @param email user's email to send reset password link to
 * @returns evaluates to the email sent
 * @throws Invalid Email or error with signing jwt
 */
export const sendPasswordResetEmail = async (email: string) => {
    const doc = await useCollection('Users', (Users) => Users.findOne({ 'email.address': email }));
    if (!doc) throw createHttpError(404, errors[404]);

    const { _id } = doc;
    const token = await jwt.sign({ _id }, { expiresIn: '30m' });
    return Emails.sendPasswordReset(email, token);
};

/**
 * @description Function to reset user's password in database
 * @param userId userId
 * @param password new password
 * @returns resolves to a MongoDB cursor on success
 * @throws Unknown user, try logging in and out again
 */
export const updatePassword = async (userId: string, password: string) => {
    if (!ObjectID.isValid(userId)) throw createHttpError(400, errors[400]);
    const encryptedPw = await bcrypt.hash(password, SALT_ROUNDS);
    const updatedPassword = {
        $set: { password: encryptedPw },
    };
    const result = await useCollection('Users', (Users) =>
        Users.updateOne({ _id: new ObjectID(userId) }, updatedPassword)
    );
    if (result.modifiedCount === 0)
        // shouldn't really ever happen, but this isn't a great user experience
        throw createHttpError(404, `${errors[404]}, try logging in and out again`);
};

/**
 * @description filters the sensitive data using whitelist methodology
 * @arg user target to filter
 * @returns resolves to the userDoc with ONLY whitelisted fields
 */
export const filterSensitiveData = (user: User<ObjectId>): ClientSafeUser => {
    const whitelist: (keyof ClientSafeUser)[] = ['_id', 'email', 'name', 'roles', 'settings'];
    function reducer(accum: Partial<ClientSafeUser>, key: keyof ClientSafeUser): Partial<ClientSafeUser> {
        if (user[key] !== undefined) {
            return { ...accum, [key]: user[key] };
        }
        return accum;
    }
    return whitelist.reduce<Partial<ClientSafeUser>>(reducer, {}) as ClientSafeUser;
};

export const getUserWithToken = async (token: string) => {
    // Verify token
    const userId = await jwt.verify<string>(token);
    if (!userId) throw createHttpError(401, 'Invalid token provided');

    const result = await useCollection('Users', (Users) => Users.findOne({ _id: new ObjectId(userId) }));
    if (!result) throw new Error('User not found');
    return result;
};
