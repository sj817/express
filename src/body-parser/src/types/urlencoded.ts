/*!
 * body-parser
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

import qs from 'qs'
import { read } from '../read'
import debugModule from 'debug'
import createError from 'http-errors'
import { normalizeOptions } from '../utils'

import type { BaseOptions } from './json'
import type { NextHandleFunction } from 'connect'
import type { IncomingMessage, ServerResponse } from 'node:http'

const debug = debugModule('body-parser:urlencoded')

/**
 * Urlencoded parser options
 */
export interface UrlencodedOptions extends BaseOptions {
  /**
   * The extended option allows to choose between parsing the URL-encoded data
   * with the querystring library (when `false`) or the qs library (when `true`).
   */
  extended?: boolean
  /**
   * The parameterLimit option controls the maximum number of parameters
   * that are allowed in the URL-encoded data. If a request contains more parameters than this value,
   * a 413 will be returned to the client. Defaults to 1000.
   */
  parameterLimit?: number
  charsetSentinel?: boolean
  interpretNumericEntities?: boolean
  depth?: number
}

// Re-export Options for convenience
export type { BaseOptions as Options }

/**
 * Create a middleware to parse urlencoded bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @public
 */
export function urlencoded (options?: UrlencodedOptions): NextHandleFunction {
  const normalizedOptions = normalizeOptions(options, 'application/x-www-form-urlencoded')

  if (normalizedOptions.defaultCharset !== 'utf-8' && normalizedOptions.defaultCharset !== 'iso-8859-1') {
    throw new TypeError('option defaultCharset must be either utf-8 or iso-8859-1')
  }

  // create the appropriate query parser
  const queryparse = createQueryParser(options)

  function parse (body: string, encoding: string | null): any {
    return body.length
      ? queryparse(body, encoding)
      : {}
  }

  const readOptions = {
    ...normalizedOptions,
    // assert charset
    isValidCharset: (charset: string) => charset === 'utf-8' || charset === 'iso-8859-1',
  }

  return function urlencodedParser (req: IncomingMessage, res: ServerResponse, next: (err?: any) => void): void {
    read(req as any, res, next, parse, debug, readOptions)
  }
}

/**
 * Get the extended query parser.
 *
 * @param {object} options
 */
function createQueryParser (options?: UrlencodedOptions): (body: string, encoding: string | null) => any {
  const extended = Boolean(options?.extended)
  let parameterLimit = options?.parameterLimit !== undefined
    ? options?.parameterLimit
    : 1000
  const charsetSentinel = options?.charsetSentinel
  const interpretNumericEntities = options?.interpretNumericEntities
  const depth = extended ? (options?.depth !== undefined ? options?.depth : 32) : 0

  if (isNaN(parameterLimit) || parameterLimit < 1) {
    throw new TypeError('option parameterLimit must be a positive number')
  }

  if (isNaN(depth) || depth < 0) {
    throw new TypeError('option depth must be a zero or a positive number')
  }

  if (isFinite(parameterLimit)) {
    parameterLimit = parameterLimit | 0
  }

  return function queryparse (body: string, encoding: string | null): any {
    const paramCount = parameterCount(body, parameterLimit)

    if (paramCount === undefined) {
      debug('too many parameters')
      throw createError(413, 'too many parameters', {
        type: 'parameters.too.many',
      })
    }

    const arrayLimit = extended ? Math.max(100, paramCount) : 0

    debug('parse ' + (extended ? 'extended ' : '') + 'urlencoding')
    try {
      return qs.parse(body, {
        allowPrototypes: true,
        arrayLimit,
        depth,
        charsetSentinel,
        interpretNumericEntities,
        charset: (encoding as 'utf-8' | 'iso-8859-1') || undefined,
        parameterLimit,
        strictDepth: true,
      })
    } catch (err) {
      if (err instanceof RangeError) {
        throw createError(400, 'The input exceeded the depth', {
          type: 'querystring.parse.rangeError',
        })
      } else {
        throw err
      }
    }
  }
}

/**
 * Count the number of parameters, stopping once limit reached
 *
 * @param {string} body
 * @param {number} limit
 * @return {number|undefined} Returns undefined if limit exceeded
 * @api private
 */
function parameterCount (body: string, limit: number): number | undefined {
  let count = 0
  let index = -1
  do {
    count++
    if (count > limit) return undefined // Early exit if limit exceeded
    index = body.indexOf('&', index + 1)
  } while (index !== -1)
  return count
}
