import bcrypt from 'bcrypt';
import { ObjectID } from 'mongodb';
import createError from 'http-errors';
import { RegisterForm, User, ClientSafeUser } from 'prytaneum-typings';

import jwt from 'lib/jwt';
import Emails from 'lib/emails';
import emitter from 'lib/events';
import { useCollection } from 'db';
import errors from './errors';

const SALT_ROUNDS = 10;

export const verifyPassword = bcrypt.compare;

/**
 * @description register the user in the database ONLY
 * @arg form is the registration form submitted to the server
 * @throws E-mail already exists, Passwords do not match
 */
export async function registerUser(form: RegisterForm) {
    const encryptedPw = await bcrypt.hash(form.password, SALT_ROUNDS);
    const match = await useCollection('Users', (Users) =>
        Users.findOne({ 'user.email': form.email })
    );
    if (match) throw createError(409, errors[409]);
    const result = await useCollection('Users', (Users) =>
        Users.insertOne({
            meta: {
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
            },
            email: {
                address: form.email,
                verified: false,
            },
            name: {
                first: form.firstName,
                last: form.lastName,
            },
            roles: [], // no roles is a regular user
            password: encryptedPw,
            settings: {
                townhall: {
                    anonymous: false,
                },
                notifications: {
                    enabled: true,
                    types: [],
                },
            },
        })
    );
    if (result.insertedCount === 1)
        emitter.emit('register-user', result.ops[0]);
    else if (result.insertedCount === 0)
        throw new Error('Unable to register new user');
}

/**
 * @description verifies the user; expects catch in calling function
 * @arg userId _id of the user to verify
 * @throws The user navigated to an invalid link
 * @returns MongoDB Cursor Promise
 */
export const confirmUserEmail = async (userId: string) => {
    const objectUserId = new ObjectID(userId);
    const result = await useCollection('Users', (Users) =>
        Users.updateOne(
            { _id: objectUserId },
            { $set: { 'email.verified': true } }
        )
    );
    if (result.modifiedCount === 0) throw createError(404, errors[404]);
};

/**
 * @description Function to send reset password link to user's email using jwt based on user's _id
 * @param email user's email to send reset password link to
 * @returns evaluates to the email sent
 * @throws Invalid Email or error with signing jwt
 */
export const sendPasswordResetEmail = async (email: string) => {
    const doc = await useCollection('Users', (Users) =>
        Users.findOne({ 'email.address': email })
    );
    if (!doc) throw createError(404, errors[404]);

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
    if (!ObjectID.isValid(userId)) throw createError(400, errors[400]);
    const encryptedPw = await bcrypt.hash(password, SALT_ROUNDS);
    const updatedPassword = {
        $set: { password: encryptedPw },
    };
    const result = await useCollection('Users', (Users) =>
        Users.updateOne({ _id: new ObjectID(userId) }, updatedPassword)
    );
    if (result.modifiedCount === 0)
        // shouldn't really ever happen, but this isn't a great user experience
        throw createError(404, `${errors[404]}, try logging in and out again`);
};

/**
 * @description filters the sensitive data using whitelist methodology
 * @arg user target to filter
 * @returns resolves to the userDoc with ONLY whitelisted fields
 */
export const filterSensitiveData = (user: User): ClientSafeUser => {
    const whitelist: (keyof ClientSafeUser)[] = ['_id', 'email', 'name'];
    function reducer(
        accum: Partial<ClientSafeUser>,
        key: keyof ClientSafeUser
    ): Partial<ClientSafeUser> {
        if (user[key] !== undefined) {
            return { ...accum, [key]: user[key] };
        }
        return accum;
    }
    return whitelist.reduce<Partial<ClientSafeUser>>(
        reducer,
        {}
    ) as ClientSafeUser;
};
