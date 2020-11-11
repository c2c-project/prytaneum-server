/* eslint-disable import/prefer-default-export */
import { ObjectID } from 'mongodb';
import Joi from 'joi';

const validateObjectId: Joi.CustomValidator<string> = (value) => {
    if (!ObjectID.isValid(value)) throw new Error();
    return value;
};

export const makeObjectIdValidationObject = (
    fieldName: string,
    otherValidators?: Record<string, string>
) => ({
    [fieldName]: Joi.string()
        .required()
        .custom(validateObjectId)
        .messages({
            'any.custom': 'Invalid id provided',
            ...otherValidators,
        }),
});
