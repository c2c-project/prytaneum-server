import { RequestHandler, Request } from 'express';

// TODO: less basic error handling
// export default function makeEndpoint<
//     ReqBody,
//     ResBody,
//     ReqQuery,
//     ReqParams,
//     DecoratedRequest extends Record<string, unknown> = Record<string, unknown>
// >(
//     fn: RequestHandler<ReqParams, ResBody, ReqBody, ReqQuery>
// ): RequestHandler<ReqParams, ResBody, ReqBody, ReqQuery> {
//     type EndpointRequest = Request & DecoratedRequest;
//     return async (req: EndpointRequest, res, next) => {
//         try {
//             await fn(req as EndpointRequest, res, next);
//         } catch (e) {
//             next(e);
//         }
//     };
// }

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
