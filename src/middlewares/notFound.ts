import createHttpError from 'http-errors';

export default function notFound(): Express.Middleware {
    return (req, res, next) => {
        next(createHttpError(404));
    };
}
