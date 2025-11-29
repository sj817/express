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
import type { NextHandleFunction } from 'connect'
import type { IncomingMessage, ServerResponse } from 'node:http'

const debug = debugModule('body-parser:text')

/**
 * Text parser options
 */
export interface TextOptions extends BaseOptions {
  /**
   * Specify the default character set for the text content if the charset
   * is not specified in the Content-Type header of the request.
   * Defaults to `utf-8`.
   */
  defaultCharset?: string
}

// Re-export Options for convenience
export type { BaseOptions as Options }

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
