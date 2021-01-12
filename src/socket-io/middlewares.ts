/* eslint-disable @typescript-eslint/indent */
import debug from 'debug';
import core from 'express-serve-static-core';
import type { Roles } from 'prytaneum-typings';

import env from 'config/env';
import connectCookieParser from 'cookie-parser';
import { init as _init, requireLogin as _requireLogin } from 'middlewares';
import { ioMiddleware } from './socket-io';

const info = debug('prytaneum:ws-middlewares');
const makeSocketMiddleware = (fn: Express.Middleware): ioMiddleware => (
    socket,
    next
) => {
    function _next(e?: Error | undefined) {
        if (e) {
            info(e);
            socket.disconnect();
        }
        next();
    }
    try {
        fn(
            // TODO: work on types here
            // makes life easier right now
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (socket.request as unknown) as any,
            ({} as unknown) as core.Response,
            (_next as unknown) as core.NextFunction
        );
    } catch (e) {
        info(e);
    }
};

export const init = makeSocketMiddleware(_init);

export const cookieParser = makeSocketMiddleware(
    connectCookieParser(env.COOKIE_SECRET)
);

export const requireLogin = (roles?: Roles[]) =>
    makeSocketMiddleware(_requireLogin(roles));
