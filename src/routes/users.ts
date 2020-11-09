import { Router } from 'express';
import Joi from 'joi';
import passport from 'passport';

import jwt from 'lib/jwt';
import { User, RegisterForm } from 'prytaneum-typings';
import {
    makeJoiMiddleware,
    makeEndpoint,
    requireLogin,
    requireRoles,
} from 'middlewares';
import {
    registerUser,
    filterSensitiveData,
    confirmUserEmail,
    sendPasswordResetEmail,
    updatePassword,
} from 'modules/user';
import { getUsers, getUser } from 'modules/admin';
import { useCollection } from 'db';
import { ObjectID } from 'mongodb';

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
        body: Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required().messages({
                'any.required': 'E-mail is required',
                'string.email': 'Invalid e-mail provided',
            }),
            password: Joi.string().min(8).max(32).required().messages({
                'any.required': 'Password is required',
                'string.ref': 'Password must be between 8 and 32 characters',
            }),
            confirmPassword: Joi.ref('password'),
        }),
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
        body: Joi.object({
            userId: Joi.string()
                .required()
                .messages({ 'any.required': 'Invalid link' }),
        }),
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
        body: Joi.object({
            email: Joi.string().email().required().messages({
                'any.required': 'E-mail is required',
                'string.email': 'Invalid e-mail provided',
            }),
        }),
    }),
    makeEndpoint(async (req, res) => {
        const { email } = req.body as { email: string };
        await sendPasswordResetEmail(email);
        res.status(200).send();
    })
);

/**
 * resets a user's password
 */
router.post(
    '/reset-password',
    makeJoiMiddleware({
        body: Joi.object({
            token: Joi.string().required(),
            form: Joi.object({
                password: Joi.string().min(8).max(32).required().messages({
                    'any.required': 'Password is required',
                    'string.ref':
                        'Password must be between 8 and 32 characters',
                }),
                confirmPassword: Joi.ref('password'),
            }),
        }),
    }),
    makeEndpoint(async (req, res) => {
        const { token, form } = req.body as {
            token: string;
            form: {
                password: string;
                confirmPassword: string;
            };
        };
        const { password } = form;
        const decodedJwt = (await jwt.verify(token)) as User & { _id: string };
        await updatePassword(decodedJwt._id, password);
        res.status(200).send('Password Reset');
    })
);

/**
 * gets a logged in user's own information
 */
router.get(
    '/me',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const cookies = req.signedCookies as { jwt: string }; // because of requireLogin() this is safe
        const { jwt: jwtCookie } = cookies;
        const { _id } = (await jwt.verify(jwtCookie)) as User;
        const user = (await useCollection('Users', (Users) =>
            Users.findOne({ _id: new ObjectID(_id) })
        )) as User; // it should always find a user since this person logged in and has a valid jwt
        res.status(200).send({
            ...filterSensitiveData(user),
            settings: user.settings,
        });
    })
);

/**
 * gets a list of users
 */
router.get(
    '/',
    requireRoles(['admin']),
    makeEndpoint(async (req, res) => {
        const users = await getUsers();
        res.status(200).send(users);
    }) // TODO: pagination, filters, sorting, etc
);

/**
 * gets a specific user
 */
router.get(
    '/:userId',
    requireRoles(['admin']),
    makeJoiMiddleware({
        body: Joi.object({
            userId: Joi.string().alphanum().required().messages({
                'any.required': 'No user id provided',
            }),
        }),
    }),
    makeEndpoint(async (req, res) => {
        const { userId } = req.body as { userId: string };
        const user = await getUser(userId);
        res.status(200).send(user);
    })
);

export default router;
