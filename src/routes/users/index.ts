import { Router } from 'express';
import Joi from 'joi';
import passport from 'passport';

import jwt from 'lib/jwt';
import { User, RegisterForm, ClientSafeUser } from 'prytaneum-typings';
import {
    makeJoiMiddleware,
    makeEndpoint,
    requireLogin,
    RequireLoginLocals,
} from 'middlewares';
import {
    registerUser,
    filterSensitiveData,
    confirmUserEmail,
    sendPasswordResetEmail,
    updatePassword,
} from 'modules/user';
import {
    registerValidationObject,
    emailValidationObject,
    passwordValidationObject,
} from 'modules/user/validators';
import { getUsers, getUser } from 'modules/admin';
import { makeObjectIdValidationObject } from 'utils/validators';

const router = Router();

/**
 * logs in a user
 */
router.post(
    '/login',
    passport.authenticate('login', { session: false }),
    makeEndpoint(async (req, res) => {
        const { user } = req as Express.Request & { user: User };
        const clientUser = filterSensitiveData(user);
        const token = await jwt.sign(clientUser);
        res.cookie('Bearer', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            signed: true,
        });
        res.sendStatus(200);
    })
);

/**
 * logs a user out via clearing the cookie
 */
router.post(
    '/logout',
    makeEndpoint((req, res) => {
        res.clearCookie('jwt');
        res.sendStatus(200);
    })
);

/**
 * registers a new user
 */
router.post(
    '/register',
    makeJoiMiddleware({
        body: Joi.object(registerValidationObject),
    }),
    makeEndpoint(async (req, res) => {
        await registerUser(req.body as RegisterForm);
        res.sendStatus(200);
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
        const decodedJwt = (await jwt.verify(token)) as User & {
            _id: string;
        };
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

/**
 * gets a specific user
 */
router.get<UserParams, ClientSafeUser, void, void, RequireLoginLocals>(
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
        res.status(200).send(user); // FIXME: make clientsafeuser generic
    })
);

export default router;
