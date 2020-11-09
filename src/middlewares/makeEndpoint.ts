import { RequestHandler } from 'express';

// TODO: less basic error handling
export default function makeEndpoint(fn: RequestHandler): RequestHandler {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (e) {
            next(e);
        }
    };
}
