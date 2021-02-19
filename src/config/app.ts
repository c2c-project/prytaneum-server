import cookieParser from 'cookie-parser';
import logger from 'morgan';
import express, { Express } from 'express';
import passport from 'passport';

import { init as InitializeMiddlewares } from 'middlewares';
import env from './env';
import configureStrategies from './passport';

export default function (app: Express): void {
    if (env.NODE_ENV === 'development') app.use(logger('dev'));
    configureStrategies();
    // TODO: production logger
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser(env.COOKIE_SECRET));
    app.use(passport.initialize());
    app.use(InitializeMiddlewares);
}
