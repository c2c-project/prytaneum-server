/* eslint-disable @typescript-eslint/indent */
// import { ParsedQs } from 'qs';
import * as core from 'express-serve-static-core';
import type { User as PrytaneumUser } from 'prytaneum-typings';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV?: 'development' | 'production' | 'test';
            PORT?: string;
            ORIGIN?: string;
            DB_URL?: string;
            JWT_SECRET?: string;
            COOKIE_SECRET?: string;
            DEBUG?: string;
        }
    }

    function e(): core.Express;
    namespace e {}
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface User extends PrytaneumUser {}

        type EmptyParams = core.ParamsDictionary;

        type Middleware<
            Params = core.ParamsDictionary,
            ResBody = any,
            ReqBody = any,
            ReqQuery = any,
            MiddlewareResults = Record<string, unknown>
        > = core.PrytaneumRequestHandler<
            Params,
            ResBody,
            ReqBody,
            ReqQuery,
            MiddlewareResults
        >;
    }
}

declare module 'express-serve-static-core' {
    export interface PrytaneumRequest<
        P,
        ResBody,
        ReqBody,
        ReqQuery,
        Locals = Record<string, unknown>
    > extends Request<P, ResBody, ReqBody, ReqQuery> {
        /**
         * results from middlewares
         */
        results: Locals;
    }
    export interface PrytaneumRequestHandler<
        P = ParamsDictionary,
        ResBody = any,
        ReqBody = any,
        ReqQuery = Query,
        MiddlewareResults = Record<string, unknown>
    > {
        (
            req: PrytaneumRequest<
                P,
                ResBody,
                ReqBody,
                ReqQuery,
                MiddlewareResults
            >,
            res: Response<ResBody>,
            next: NextFunction
        ): any;
    }
    interface IRouterMatcher<
        T,
        Method extends
            | 'all'
            | 'get'
            | 'post'
            | 'put'
            | 'delete'
            | 'patch'
            | 'options'
            | 'head' = any
    > {
        <
            P = ParamsDictionary,
            ResBody = any,
            ReqBody = any,
            ReqQuery = Query,
            MiddlewareResults = Record<string, unknown>
        >(
            path: PathParams,
            ...handlers: Array<
                PrytaneumRequestHandler<
                    P,
                    ResBody,
                    ReqBody,
                    ReqQuery,
                    MiddlewareResults
                >
            >
        ): T;

        <
            P = ParamsDictionary,
            ResBody = any,
            ReqBody = any,
            ReqQuery = Query,
            MiddlewareResults = Record<string, unknown>
        >(
            path: PathParams,
            ...handlers: Array<
                PrytaneumRequestHandlerParams<
                    P,
                    ResBody,
                    ReqBody,
                    ReqQuery,
                    MiddlewareResults
                >
            >
        ): T;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface IRouter extends PrytaneumRequestHandler {}

    export type PrytaneumRequestHandlerParams<
        P = ParamsDictionary,
        ResBody = any,
        ReqBody = any,
        ReqQuery = Query,
        MiddlewareResults = Record<string, unknown>
    > =
        | PrytaneumRequestHandler<
              P,
              ResBody,
              ReqBody,
              ReqQuery,
              MiddlewareResults
          >
        | ErrorRequestHandler<P, ResBody, ReqBody, ReqQuery>
        | Array<PrytaneumRequestHandler<P> | ErrorRequestHandler<P>>;

    export interface IRouterHandler<T> {
        (...handlers: PrytaneumRequestHandler[]): T;
        (...handlers: PrytaneumRequestHandlerParams[]): T;
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
