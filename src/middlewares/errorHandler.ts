/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorRequestHandler } from 'express';
import createError, { HttpError } from 'http-errors';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import env from 'config/env';

export default function errorHandler(): ErrorRequestHandler {
    return (err: Error | HttpError, req, res, next) => {
        let _err: HttpError;

        if (!(err instanceof HttpError)) {
            // default behavior is just to send status code 500 and with the default message
            _err = createError(500);

            // if in anything other than production, send internal error messages to the client
            // eg in development or testing
            if (env.NODE_ENV !== 'production')
                _err = createError(500, err.message);

            // if it's a token error then display the appropriate message,
            // while not giving the client TOO much info
            // ref: https://github.com/auth0/node-jsonwebtoken#errors--codes
            if (err instanceof TokenExpiredError)
                _err = createError(401, 'Expired token');
            else if (err instanceof JsonWebTokenError)
                _err = createError(401, 'Invalid token');
        } else _err = err; // else it's already an http error so don't do anything

        res.status(_err.status).send(_err);
    };
}
