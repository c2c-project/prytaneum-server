import cookieParser from 'cookie-parser';
import logger from 'morgan';
import express, { Express } from 'express';
import passport from 'passport';

import env from './env'; // initializes env vars using our configuration
import './passport';

export default function (app: Express): void {
    // TODO: make this dev or prod mode
    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser(env.COOKIE_SECRET));
    app.use(passport.initialize());
}
