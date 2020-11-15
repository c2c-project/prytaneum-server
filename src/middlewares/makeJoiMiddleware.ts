import createError from 'http-errors';
import Joi from 'joi';

type JoiObject = Joi.ObjectSchema<Record<string, unknown>>;
interface RequestValidations {
    body?: JoiObject;
    query?: JoiObject;
    params?: JoiObject;
}

export default function makeJoiMiddleware(
    schema: RequestValidations
): Express.Middleware {
    return (req, res, next) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { body, params, query } = req;
            const {
                body: bodySchema,
                params: paramsSchema,
                query: querySchema,
            } = schema;

            const isValidationPresent =
                bodySchema || paramsSchema || querySchema;
            const messageToDev =
                'Validation Error: no validation parameters specified in joi middleware';
            if (!isValidationPresent) throw new Error(messageToDev);

            if (bodySchema) Joi.assert(body, bodySchema);
            if (paramsSchema) Joi.assert(params, paramsSchema);
            if (querySchema) Joi.assert(query, querySchema);
            next();
        } catch (err) {
            if (err instanceof Joi.ValidationError) {
                next(createError(400, err.message));
            } else next(err);
        }
    };
}
