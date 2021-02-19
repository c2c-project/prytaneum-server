/* eslint-disable @typescript-eslint/no-unused-vars */
import Joi from 'joi';
import { ErrorRequestHandler } from 'express';
import createHttpError, { HttpError } from 'http-errors';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import env from 'config/env';

export default function errorHandler(): ErrorRequestHandler {
    return (err: Error | HttpError, req, res, next) => {
        // error that will get sent to client
        let _err: HttpError;

        if (!(err instanceof HttpError)) {
            // default behavior is just to send status code 500 and with the default message
            _err = createHttpError(500);

            // if in anything other than production, send internal error messages to the client
            // eg in development or testing
            if (env.NODE_ENV !== 'production')
                _err = createHttpError(500, err.message);

            // if it's a token error then display the appropriate message,
            // while not giving the client TOO much info
            // ref: https://github.com/auth0/node-jsonwebtoken#errors--codes
            if (err instanceof TokenExpiredError)
                _err = createHttpError(401, 'Expired token');
            else if (err instanceof JsonWebTokenError)
                _err = createHttpError(401, 'Invalid token');
            else if (err instanceof Joi.ValidationError) {
                const { details } = err;
                const { message } = details[0];
                // TODO: more verbose error messages when interfacing with joi
                _err = createHttpError(400, message);
            }
        } else _err = err; // else it's already an http error so don't do anything

        res.status(_err.status).send(_err.message);
    };
}
