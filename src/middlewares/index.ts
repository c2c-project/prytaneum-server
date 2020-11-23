export { default as makeJoiMiddleware } from './makeJoiMiddleware';
export { default as makeEndpoint } from './makeEndpoint';
export { default as errorHandler } from './errorHandler';
export { default as requireLogin } from './requireLogin';
export * from './requireLogin';
export { default as notFound } from './notFound';

export const init: Express.Middleware = (req, res, next) => {
    req.results = {};
    next();
};
