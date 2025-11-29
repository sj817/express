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

import debugModule from 'debug'
import { read } from '../read.js'
import { normalizeOptions } from '../utils.js'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { NextHandleFunction } from 'connect'

const debug = debugModule('body-parser:json')

/**
 * Base Options interface
 */
export interface Options {
  /** When set to true, then deflated (compressed) bodies will be inflated; when false, deflated bodies are rejected. Defaults to true. */
  inflate?: boolean
  /**
   * Controls the maximum request body size. If this is a number,
   * then the value specifies the number of bytes; if it is a string,
   * the value is passed to the bytes library for parsing. Defaults to '100kb'.
   */
  limit?: number | string
  /**
   * The type option is used to determine what media type the middleware will parse
   */
  type?: string | string[] | ((req: IncomingMessage) => any)
  /**
   * The verify option, if supplied, is called as verify(req, res, buf, encoding),
   * where buf is a Buffer of the raw request body and encoding is the encoding of the request.
   */
  verify?: (req: IncomingMessage, res: ServerResponse, buf: Buffer, encoding: string) => void
}

/**
 * RegExp to match the first non-space in a string.
 *
 * Allowed whitespace is defined in RFC 7159:
 *
 *    ws = *(
 *            %x20 /              ; Space
 *            %x09 /              ; Horizontal tab
 *            %x0A /              ; Line feed or New line
 *            %x0D )              ; Carriage return
 */
const FIRST_CHAR_REGEXP = /^[\x20\x09\x0a\x0d]*([^\x20\x09\x0a\x0d])/ // eslint-disable-line no-control-regex

const JSON_SYNTAX_CHAR = '#'
const JSON_SYNTAX_REGEXP = /#+/g

/**
 * JSON parser options
 */
export interface JsonOptions extends Options {
  /**
   * The reviver option is passed directly to JSON.parse as the second argument.
   */
  reviver?: (key: string, value: any) => any
  /**
   * When set to `true`, will only accept arrays and objects;
   * when `false` will accept anything JSON.parse accepts. Defaults to `true`.
   */
  strict?: boolean
}

/**
 * Create a middleware to parse JSON bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @public
 */
export function json (options?: JsonOptions): NextHandleFunction {
  const normalizedOptions = normalizeOptions(options, 'application/json')

  const reviver = options?.reviver
  const strict = options?.strict !== false

  function parse (body: string): any {
    if (body.length === 0) {
      // special-case empty json body, as it's a common client-side mistake
      // TODO: maybe make this configurable or part of "strict" option
      return {}
    }

    if (strict) {
      const first = firstchar(body)

      if (first !== '{' && first !== '[') {
        debug('strict violation')
        throw createStrictSyntaxError(body, first!)
      }
    }

    try {
      debug('parse json')
      return JSON.parse(body, reviver)
    } catch (e) {
      throw normalizeJsonSyntaxError(e as SyntaxError, {
        message: (e as Error).message,
        stack: (e as Error).stack || '',
      })
    }
  }

  const readOptions = {
    ...normalizedOptions,
    // assert charset per RFC 7159 sec 8.1
    isValidCharset: (charset: string) => charset.slice(0, 4) === 'utf-',
  }

  return function jsonParser (req: IncomingMessage, res: ServerResponse, next: (err?: any) => void): void {
    read(req as any, res, next, parse, debug, readOptions)
  }
}

/**
 * Create strict violation syntax error matching native error.
 *
 * @param {string} str
 * @param {string} char
 * @return {Error}
 * @private
 */
function createStrictSyntaxError (str: string, char: string): SyntaxError {
  const index = str.indexOf(char)
  let partial = ''

  if (index !== -1) {
    partial = str.substring(0, index) + JSON_SYNTAX_CHAR

    for (let i = index + 1; i < str.length; i++) {
      partial += JSON_SYNTAX_CHAR
    }
  }

  try {
    JSON.parse(partial); /* istanbul ignore next */ throw new SyntaxError('strict violation')
  } catch (e) {
    return normalizeJsonSyntaxError(e as SyntaxError, {
      message: (e as Error).message.replace(JSON_SYNTAX_REGEXP, function (placeholder) {
        return str.substring(index, index + placeholder.length)
      }),
      stack: (e as Error).stack || '',
    })
  }
}

/**
 * Get the first non-whitespace character in a string.
 *
 * @param {string} str
 * @return {function}
 * @private
 */
function firstchar (str: string): string | undefined {
  const match = FIRST_CHAR_REGEXP.exec(str)

  return match
    ? match[1]
    : undefined
}

/**
 * Normalize a SyntaxError for JSON.parse.
 *
 * @param {SyntaxError} error
 * @param {object} obj
 * @return {SyntaxError}
 */
function normalizeJsonSyntaxError (error: SyntaxError, obj: { message: string; stack: string }): SyntaxError {
  const keys = Object.getOwnPropertyNames(error)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key !== 'stack' && key !== 'message') {
      delete (error as any)[key]
    }
  }

  // replace stack before message for Node.js 0.10 and below
  error.stack = obj.stack.replace(error.message, obj.message)
  error.message = obj.message

  return error
}
