/* eslint-disable @stylistic/indent */
import type { ParamsDictionary } from './request'

/**
 * 移除字符串尾部的指定后缀
 * @template S - 源字符串类型
 * @template Tail - 要移除的尾部字符串类型
 * @returns 移除尾部后的字符串类型，如果没有匹配则返回原字符串
 */
export type RemoveTail<S extends string, Tail extends string> = S extends `${infer P}${Tail}` ? P : S

/**
 * 从路由字符串中提取参数名称
 * 会移除路径分隔符、连字符和点号后的内容
 * @template S - 路由字符串类型
 * @returns 提取出的参数名称类型
 */
export type GetRouteParameter<S extends string> = RemoveTail<
  RemoveTail<RemoveTail<S, `/${string}`>, `-${string}`>,
  `.${string}`
>

/**
 * 解析路由字符串中的参数
 * @template Route - 路由字符串类型
 * @returns 解析出的参数类型对象
 */
export type ParseRouteParameters<Route extends PathParams> = string extends Route ? ParamsDictionary
  : Route extends `${string}(${string}` ? ParamsDictionary // TODO: handling for regex parameters
  : Route extends `${string}:${infer Rest}` ?
  & (
    GetRouteParameter<Rest> extends never ? ParamsDictionary
    : GetRouteParameter<Rest> extends `${infer ParamName}?` ? { [P in ParamName]?: string } // TODO: Remove old `?` handling when Express 5 is promoted to "latest"
    : { [P in GetRouteParameter<Rest>]: string }
  )
  & (Rest extends `${GetRouteParameter<Rest>}${infer Next}` ? RouteParameters<Next> : unknown)
  : {}

/**
 * 路由参数类型
 * 支持必需参数和可选参数的解析
 * @template Route - 路由字符串类型
 * @example
 * // 路由: '/user/:id/posts/:postId?'
 * // 类型: { id: string, postId?: string }
 * @example
 * // 路由: '/user/:id{/posts/:postId}'
 * // 类型: { id: string, posts?: string, postId?: string }
 */
export type RouteParameters<Route extends PathParams> = Route extends `${infer Required}{${infer Optional}}${infer Next}`
  ? ParseRouteParameters<Required> & Partial<ParseRouteParameters<Optional>> & RouteParameters<Next>
  : ParseRouteParameters<Route>

/**
 * 路径参数类型
 * 可以是字符串路径、正则表达式或它们的数组组合
 */
export type PathParams = string | RegExp | Array<string | RegExp>
