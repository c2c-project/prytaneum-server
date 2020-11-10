/* eslint-disable import/prefer-default-export */
import Joi from 'joi';
import { RegisterForm, User } from 'prytaneum-typings';

type Email = keyof Pick<User, 'email'>;
type EmailValidator = Record<Email, Joi.Schema | Joi.Reference>;
export const emailValidationObject: EmailValidator = {
    email: Joi.string().email().required().messages({
        'any.required': 'E-mail is required',
        'string.email': 'Invalid e-mail provided',
    }),
};

type Password = keyof Pick<RegisterForm, 'password' | 'confirmPassword'>;
type PasswordValidator = Record<Password, Joi.Schema | Joi.Reference>;
export const passwordValidationObject: PasswordValidator = {
    password: Joi.string().min(8).max(32).required().messages({
        'any.required': 'Password is required',
        'string.ref': 'Password must be between 8 and 32 characters',
    }),
    confirmPassword: Joi.ref('password'),
};

type RegisterValidator = Record<keyof RegisterForm, Joi.Schema | Joi.Reference>;
export const registerValidationObject: RegisterValidator = {
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    ...emailValidationObject,
    ...passwordValidationObject,
};
