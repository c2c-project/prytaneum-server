import jwt from 'jsonwebtoken';

import env from 'config/env';

// TODO: set issuer using env.origin

/**
 * @description wrapper to jsonwebtoken.verify
 * @arg {string} token
 * @returns {Promise} resolves to a decoded jwt on success
 */
const verify = function <
    T extends Record<string, unknown> = Record<string, unknown>
>(token: string): Promise<Partial<T>> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, env.JWT_SECRET, (err, decodedJwt) => {
            if (err) {
                reject(err);
            } else if (decodedJwt) {
                resolve(decodedJwt as Partial<T>);
            } else {
                reject(
                    new Error(
                        'jsonwebtoken.verify silently failed, have fun :)'
                    )
                );
            }
        });
    });
};

/**
 * @description wrapper to jsonwebtoken.sign
 * @arg target this is going to jwt'd
 * @arg  [options] optional options for jwt signing
 * @returns resolves to the jwt on success
 */
const sign = function (
    target: string | Record<string, unknown> | Buffer,
    options: jwt.SignOptions = {}
): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(target, env.JWT_SECRET, options, (err, token) => {
            if (err) {
                reject(err);
            } else if (token) {
                resolve(token);
            } else {
                reject(
                    new Error('jsonwebtoken.sign silently failed, have fun :)')
                );
            }
        });
    });
};

export default {
    verify,
    sign,
};
