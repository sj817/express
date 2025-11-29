/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import debugModule from 'debug'
import { read } from '../read'
import { normalizeOptions, passthrough } from '../utils'

import type { BaseOptions } from './json'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { NextHandleFunction } from 'connect'

const debug = debugModule('body-parser:raw')

/**
 * Raw parser options (same as base Options, doesn't add new properties)
 */
export type RawOptions = BaseOptions

// Re-export Options for convenience
export type { BaseOptions as Options }

/**
 * Create a middleware to parse raw bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @api public
 */
export function raw (options?: RawOptions): NextHandleFunction {
  const normalizedOptions = normalizeOptions(options, 'application/octet-stream')

  const readOptions = {
    ...normalizedOptions,
    // Skip charset validation and parse the body as is
    skipCharset: true,
  }

  return function rawParser (req: IncomingMessage, res: ServerResponse, next: (err?: any) => void): void {
    read(req as any, res, next, passthrough, debug, readOptions)
  }
}
