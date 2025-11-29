import type { ParsedQs } from 'qs'
import type { ParamsDictionary } from './request'
import type { RequestHandler, RequestHandlerParams } from './requestHandler'
import type { PathParams, RouteParameters } from './parameter'
import type { Application } from '../../index'

export const methods = [
  'acl', 'bind', 'checkout',
  'connect', 'copy', 'delete',
  'get', 'head', 'link',
  'lock', 'm-search', 'merge',
  'mkactivity', 'mkcalendar', 'mkcol',
  'move', 'notify', 'options',
  'patch', 'post', 'propfind',
  'proppatch', 'purge', 'put',
  'query', 'rebind', 'report',
  'search', 'source', 'subscribe',
  'trace', 'unbind', 'unlink',
  'unlock', 'unsubscribe',
] as const

// IRouterMatcher生成工具
// methods.forEach((method) => {
//  console.log(`"${method}"!: IRouterMatcher<this, "${method}">`)
// })

// IRoute类型生成工具
// methods.forEach((method) => {
//  console.log(`"${method}"!: IRouterHandler<this, T>`)
// })

export interface IRouterHandler<T, Route extends PathParams = PathParams> {
  (...handlers: Array<RequestHandler<RouteParameters<Route>>>): T
  (...handlers: Array<RequestHandlerParams<RouteParameters<Route>>>): T
  <
    P = RouteParameters<Route>,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>
  > (
    // (This generic is meant to be passed explicitly.)
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>
  ): T
  <
    P = RouteParameters<Route>,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>
  > (
    // (This generic is meant to be passed explicitly.)
    ...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody, ReqQuery, LocalsObj>>
  ): T
  <
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>
  > (
    // (This generic is meant to be passed explicitly.)
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>
  ): T
  <
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>
  > (
    // (This generic is meant to be passed explicitly.)
    ...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody, ReqQuery, LocalsObj>>
  ): T
}

export interface IRouterMatcher<
  T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Method extends typeof methods[number] | 'all' = typeof methods[number] | 'all'
> {
  <
    Route extends string,
    P = RouteParameters<Route>,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>
  > (
    // (it's used as the default type parameter for P)
    path: Route,
    // (This generic is meant to be passed explicitly.)
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>
  ): T
  <
    Path extends string,
    P = RouteParameters<Path>,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>
  > (
    // (it's used as the default type parameter for P)
    path: Path,
    // (This generic is meant to be passed explicitly.)
    ...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody, ReqQuery, LocalsObj>>
  ): T
  <
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>
  > (
    path: PathParams,
    // (This generic is meant to be passed explicitly.)
    ...handlers: Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>
  ): T
  <
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>
  > (
    path: PathParams,
    // (This generic is meant to be passed explicitly.)
    ...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody, ReqQuery, LocalsObj>>
  ): T
  (path: PathParams, subApplication: Application): T
}
