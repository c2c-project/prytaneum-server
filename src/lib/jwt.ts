import jwt from 'jsonwebtoken';

import env from 'config/env';

/**
 * @description wrapper to jsonwebtoken.verify
 * @arg {string} token
 * @returns {Promise} resolves to a decoded jwt on success
 */
const verify = function (token: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, env.JWT_SECRET, (err, decodedJwt) => {
            if (err) {
                reject(err);
            } else {
                resolve(decodedJwt as Record<string, unknown>);
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
    options = {}
): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(target, env.JWT_SECRET, options, (err, token) => {
            if (err) {
                reject(err);
            } else {
                resolve(token);
            }
        });
    });
};

export default {
    verify,
    sign,
};
