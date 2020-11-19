export default function makeEndpoint<
    Params,
    ResBody,
    ReqBody,
    ReqQuery,
    ResLocals
>(
    fn: Express.Middleware<Params, ResBody, ReqBody, ReqQuery, ResLocals>
): Express.Middleware<Params, ResBody, ReqBody, ReqQuery, ResLocals> {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (e) {
            next(e);
        }
    };
}
