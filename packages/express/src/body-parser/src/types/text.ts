/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import debugModule from 'debug'
import { read } from '../read.js'
import { normalizeOptions, passthrough } from '../utils.js'
import type { Options } from './json.js'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { NextHandleFunction } from 'connect'

const debug = debugModule('body-parser:text')

/**
 * Text parser options
 */
export interface TextOptions extends Options {
  /**
   * Specify the default character set for the text content if the charset
   * is not specified in the Content-Type header of the request.
   * Defaults to `utf-8`.
   */
  defaultCharset?: string
}

// Re-export Options for convenience
export type { Options }

/**
 * Create a middleware to parse text bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @api public
 */
export function text (options?: TextOptions): NextHandleFunction {
  const normalizedOptions = normalizeOptions(options, 'text/plain')

  return function textParser (req: IncomingMessage, res: ServerResponse, next: (err?: any) => void): void {
    read(req as any, res, next, passthrough, debug, normalizedOptions)
  }
}
