/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @api private
 */

import etag from 'etag'
import qs from 'qs'
import mime from 'mime-types'
import proxyaddr from 'proxy-addr'
import { METHODS } from 'node:http'
import { Buffer } from 'node:buffer'
import contentType from 'content-type'
import querystring from 'node:querystring'

/**
 * A list of lowercased HTTP methods that are supported by Node.js.
 * @api private
 */
export const methods = METHODS.map((method) => method.toLowerCase())

/**
 * Ensure a function is only called once.
 *
 * @param {Function} fn - The function to wrap
 * @return {Function} - The wrapped function
 * @api private
 */
export function once<T extends (...args: any[]) => any> (fn: T): T {
  let called = false
  return function (this: any, ...args: any[]) {
    if (called) return
    called = true
    return fn.apply(this, args)
  } as T
}

/**
 * Return strong ETag for `body`.
 *
 * @param {String|Buffer} body
 * @param {String} [encoding]
 * @return {String}
 * @api private
 */

const _etag = createETagGenerator({ weak: false })
export { _etag as etag }

/**
 * Return weak ETag for `body`.
 *
 * @param {String|Buffer} body
 * @param {String} [encoding]
 * @return {String}
 * @api private
 */

export const wetag = createETagGenerator({ weak: true })

/**
 * Normalize the given `type`, for example "html" becomes "text/html".
 *
 * @param {String} type
 * @return {Object}
 * @api private
 */

export function normalizeType (type: string) {
  return ~type.indexOf('/')
    ? acceptParams(type)
    : { value: (mime.lookup(type) || 'application/octet-stream'), params: {} }
}

/**
 * Normalize `types`, for example "html" becomes "text/html".
 *
 * @param {Array} types
 * @return {Array}
 * @api private
 */

export function normalizeTypes (types: string[]) {
  return types.map(normalizeType)
}

/**
 * Parse accept params `str` returning an
 * object with `.value`, `.quality` and `.params`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function acceptParams (str: string) {
  const length = str.length
  const colonIndex = str.indexOf(';')
  let index = colonIndex === -1 ? length : colonIndex
  const ret: {
    value: string,
    quality: number,
    params: Record<string, string>
  } = { value: str.slice(0, index).trim(), quality: 1, params: {} }

  while (index < length) {
    const splitIndex = str.indexOf('=', index)
    if (splitIndex === -1) break

    const colonIndex = str.indexOf(';', index)
    const endIndex = colonIndex === -1 ? length : colonIndex

    if (splitIndex > endIndex) {
      index = str.lastIndexOf(';', splitIndex - 1) + 1
      continue
    }

    const key = str.slice(index, splitIndex).trim()
    const value = str.slice(splitIndex + 1, endIndex).trim()

    if (key === 'q') {
      ret.quality = parseFloat(value)
    } else {
      ret.params[key] = value
    }

    index = endIndex + 1
  }

  return ret
}

/**
 * Compile "etag" value to function.
 *
 * @param val
 * @api private
 */
export function compileETag (val: boolean | string | Function) {
  let fn

  if (typeof val === 'function') return val
  switch (val) {
    case true:
    case 'weak':
      return wetag
    case false:
      break
    case 'strong':
      return etag
    default:
      throw new TypeError('unknown value for etag function: ' + val)
  }

  return fn
}

/**
 * Compile "query parser" value to function.
 *
 * @param  {String|Function} val
 * @return {Function}
 * @api private
 */

export function compileQueryParser (val: string | boolean | Function) {
  let fn

  if (typeof val === 'function') return val

  switch (val) {
    case true:
    case 'simple':
      return querystring.parse
    case false:
      break
    case 'extended':
      return parseExtendedQueryString
    default:
      throw new TypeError('unknown value for query parser function: ' + val)
  }

  return fn
}

/**
 * Compile "proxy trust" value to function.
 *
 * @param val
 * @return {Function}
 * @api private
 */

export function compileTrust (val: boolean | string | number | Array<any> | Function) {
  if (typeof val === 'function') return val

  if (val === true) {
    // Support plain true/false
    return () => true
  }

  if (typeof val === 'number') {
    const n = val
    // Support trusting hop count
    return (_: any, i: number) => i < n
  }

  if (typeof val === 'string') {
    // Support comma-separated values
    val = val.split(',').map(v => v.trim())
  }

  return proxyaddr.compile(val || [])
}

/**
 * Set the charset in a given Content-Type string.
 *
 * @param {String} type
 * @param {String} charset
 * @return {String}
 * @api private
 */

export function setCharset (type: string, charset: string) {
  if (!type || !charset) {
    return type
  }

  // parse type
  const parsed = contentType.parse(type)

  // set charset
  parsed.parameters.charset = charset

  // format type
  return contentType.format(parsed)
}

/**
 * Create an ETag generator function, generating ETags with
 * the given options.
 *
 * @param options
 * @private
 */

function createETagGenerator (options: etag.Options) {
  return (
    body: string | Buffer,
    encoding?: BufferEncoding
  ) => {
    if (Buffer.isBuffer(body)) {
      return etag(body, options)
    }
    const bodyBuffer = Buffer.from(body, encoding)
    return etag(bodyBuffer, options)
  }
}

/**
 * Parse an extended query string with qs.
 *
 * @param str
 * @private
 */

function parseExtendedQueryString (str: string) {
  return qs.parse(str, { allowPrototypes: true })
}
