/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import passport from 'passport';
import debug from 'debug';

import env from 'config/env';
import jwt from 'lib/jwt';
import type { User, RegisterForm, ClientSafeUser, Roles } from 'prytaneum-typings';
import { makeJoiMiddleware, makeEndpoint, requireLogin, RequireLoginLocals } from 'middlewares';
import {
    registerUser,
    filterSensitiveData,
    confirmUserEmail,
    sendPasswordResetEmail,
    updatePassword,
} from 'modules/user';
import { registerValidationObject, emailValidationObject, passwordValidationObject } from 'modules/user/validators';
import { getUsers, getUser, generateInviteLink } from 'modules/admin';
import { makeObjectIdValidationObject } from 'utils/validators';
import { ObjectId } from 'mongodb';
import { getRolesFromInvite, incrementInviteUse } from 'modules/invites';
import createHttpError from 'http-errors';

const router = Router();
const info = debug('prytaneum:routes/users');

/**
 * logs in a user
 */
router.post(
    '/login',
    passport.authenticate('login', { session: false }),
    makeEndpoint(async (req, res) => {
        const { user } = (req as unknown) as Express.Request & {
            user: User<ObjectId>;
        };
        const clientUser = filterSensitiveData(user);
        const token = await jwt.sign(clientUser);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            signed: env.NODE_ENV === 'production',
            sameSite: 'strict',
        })
            .status(200)
            .send({ user: clientUser });
    })
);

/**
 * logs a user out via clearing the cookie
 */
router.post(
    '/logout',
    (req, res, next) => {
        next();
    },
    makeEndpoint((req, res) => {
        res.clearCookie('jwt');
        res.sendStatus(200);
    })
);

/**
 * registers a new user
 */
router.post<
    Express.EmptyParams,
    { user: ClientSafeUser & Pick<User, 'settings'> },
    RegisterForm,
    { invite?: string },
    void
>(
    '/register',
    makeJoiMiddleware({
        body: Joi.object(registerValidationObject),
        query: Joi.object({
            invite: Joi.string().optional(),
        }),
    }),
    makeEndpoint(async (req, res) => {
        const { query, body } = req;
        const { invite: token } = query;

        /**
         * logic to handle token below
         */
        const overrides: Partial<User> = {};
        if (token) {
            info('registering with token...');
            const { _id: inviteId } = await jwt.verify<{ _id: string }>(token);
            // TODO: handle else case here
            if (inviteId) {
                info('Invite found...');
                overrides.roles = await getRolesFromInvite(inviteId);
                // should probably do this AFTER registering the user, but w/e for now
                await incrementInviteUse(inviteId);
            }
        }
        info('Overrides: ', overrides);
        const user = await registerUser(body, overrides);
        const clientUser = filterSensitiveData(user);
        const jwtToken = await jwt.sign(clientUser);

        res.cookie('jwt', jwtToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            signed: env.NODE_ENV === 'production',
            sameSite: 'strict',
        })
            .status(200)
            .send({ user: clientUser });
    })
);

/**
 * verifies a user's email
 */
router.post(
    '/verify-email',
    makeJoiMiddleware({
        body: Joi.object(
            makeObjectIdValidationObject('userId', {
                'any.required': 'Invalid Link',
            })
        ),
    }),
    makeEndpoint(async (req, res) => {
        const { userId } = req.body as { userId: string };
        await confirmUserEmail(userId);
        res.sendStatus(200);
    })
);

/**
 * triggers an email sent to the user to reset their password
 */
router.post(
    '/forgot-password',
    makeJoiMiddleware({
        body: Joi.object(emailValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        const { email } = req.body as { email: string };
        await sendPasswordResetEmail(email);
        res.status(200).send();
    })
);

type ResetPasswordParams = { token: string };
type ResetPasswordBody = { password: string; confirmPassword: string };

/**
 * resets a user's password
 * TODO: invalidate token or put some sort of "cooldown" period in the user doc
 * ex. if the reset token is valid for 5 mins, then put some field like "lastReset"
 * in the user doc that is required to be older than 5 mins ago in order to invoke another reset
 * therefore the link can only be used once
 */
router.post<ResetPasswordParams, void, ResetPasswordBody>(
    '/reset-password/:token',
    makeJoiMiddleware({
        body: Joi.object(passwordValidationObject),
        params: Joi.object({
            token: Joi.string().required(),
        }),
    }),
    makeEndpoint(async (req, res) => {
        const { password } = req.body;
        const { token } = req.params;
        // TODO: different jwt verifies?
        const decodedJwt = await jwt.verify<Pick<User, '_id'>>(token);
        if (!decodedJwt._id) throw createHttpError(401, 'Invalid token provided');
        await updatePassword(decodedJwt._id, password);
        res.sendStatus(200);
    })
);

type UserInfo = ClientSafeUser & Pick<User, 'settings'>;
/**
 * gets a logged in user's own information
 */
router.get<Express.EmptyParams, UserInfo, void, void, RequireLoginLocals>(
    '/me',
    requireLogin(),
    makeEndpoint((req, res) => {
        const { user } = req.results;
        res.status(200).send({
            ...filterSensitiveData(user),
            settings: user.settings,
        });
    })
);

/**
 * gets a list of users
 */
router.get<Express.EmptyParams, User[], void, void, RequireLoginLocals>(
    '/',
    requireLogin(['admin']),
    makeEndpoint(async (req, res) => {
        const users = await getUsers();
        res.status(200).send(users);
    }) // TODO: pagination, filters, sorting, etc
);

type UserParams = { userId: string };
type Unpromise<T extends Promise<unknown>> = T extends Promise<infer U> ? U : never;
/**
 * gets a specific user
 */
router.get<UserParams, Unpromise<ReturnType<typeof getUser>>, void, void, RequireLoginLocals>(
    '/:userId',
    requireLogin(['admin']),
    makeJoiMiddleware({
        params: Joi.object(
            makeObjectIdValidationObject('userId', {
                'any.required': 'No user id provided',
            })
        ),
    }),
    makeEndpoint(async (req, res) => {
        const { userId } = req.params;
        const user = await getUser(userId);
        res.status(200).send(user);
    })
);

/**
 * invites a user and allows them to have a particular role
 */
router.post<Express.EmptyParams, { token: string }, { role: Roles }, void, RequireLoginLocals>(
    '/invite',
    requireLogin(['admin']),
    makeJoiMiddleware({
        body: Joi.object({
            role: Joi.string(),
        }),
    }),
    makeEndpoint(async (req, res) => {
        const { role } = req.body;
        const { user } = req.results;
        const token = await generateInviteLink(role, user._id);
        res.status(200).send({ token });
    })
);

export default router;
