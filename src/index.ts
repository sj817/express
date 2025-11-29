export type { Express } from './express'
export type { Request } from './request'
export type { Response } from './response'
export type { Application } from './application'
export type {
  NextFunction,
  RouterOptions,
  CookieOptions,
  Errback,
  RequestHandler,
  RequestHandler as Handler,
  Route as IRoute,
  IRouter,
  IRouterHandler,
  IRouterMatcher,
  MediaType,
  Locals,
  RequestParamHandler,
  Send,
} from 'router'

export {
  application,
  request,
  response,
  Route,
  Router,
  express,
  express as default,
  urlencoded,
} from './express'

declare global {
  namespace Express {
    // These open interfaces may be extended in an application-specific manner via declaration merging.
    // See for example method-override.d.ts (https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/method-override/index.d.ts)
    interface Request { }
    interface Response { }
    interface Locals { }
    interface Application { }
  }
}
