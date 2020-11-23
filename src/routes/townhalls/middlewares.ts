import Joi from 'joi';

import { makeObjectIdValidationObject } from 'utils/validators';
import { makeJoiMiddleware } from 'middlewares';

/* eslint-disable import/prefer-default-export */
export const validateTownhallParams = makeJoiMiddleware({
    params: Joi.object(makeObjectIdValidationObject('townhallId')).unknown(
        true
    ),
});
