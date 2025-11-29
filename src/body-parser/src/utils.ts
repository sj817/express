/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import bytes from 'bytes'
import typeis from 'type-is'
import contentType from 'content-type'

import type { IncomingMessage } from 'node:http'

/**
 * Get the charset of a request.
 *
 * @param {object} req
 * @api private
 */
export function getCharset (req: IncomingMessage): string | undefined {
  try {
    return (contentType.parse(req).parameters.charset || '').toLowerCase()
  } catch {
    return undefined
  }
}

/**
 * Get the simple type checker.
 *
 * @param {string | string[]} type
 * @return {function}
 */
function typeChecker (type: string | string[]): (req: IncomingMessage) => boolean {
  return function checkType (req: IncomingMessage): boolean {
    if (Array.isArray(type)) {
      return Boolean(typeis(req, type))
    }
    return Boolean(typeis(req, type))
  }
}

/**
 * Options interface for normalizeOptions
 */
export interface NormalizeOptionsInput {
  inflate?: boolean
  limit?: number | string
  type?: string | string[] | ((req: IncomingMessage) => any)
  verify?: false | ((req: IncomingMessage, res: any, buf: Buffer, encoding: string) => void)
  defaultCharset?: string
}

/**
 * Normalized options interface
 */
export interface NormalizedOptions {
  inflate: boolean
  limit: number | null
  verify: false | ((req: IncomingMessage, res: any, buf: Buffer, encoding: string) => void)
  defaultCharset: string
  shouldParse: (req: IncomingMessage) => boolean
}

/**
 * Normalizes the common options for all parsers.
 *
 * @param {object} options options to normalize
 * @param {string | string[] | function} defaultType default content type(s) or a function to determine it
 * @returns {object}
 */
export function normalizeOptions (
  options: NormalizeOptionsInput | undefined,
  defaultType: string | string[] | ((req: IncomingMessage) => any)
): NormalizedOptions {
  if (!defaultType) {
    // Parsers must define a default content type
    throw new TypeError('defaultType must be provided')
  }

  const inflate = options?.inflate !== false
  const limit = typeof options?.limit !== 'number'
    ? bytes.parse(options?.limit || '100kb')
    : options?.limit
  const type = options?.type || defaultType
  const verify = options?.verify || false
  const defaultCharset = options?.defaultCharset || 'utf-8'

  if (verify !== false && typeof verify !== 'function') {
    throw new TypeError('option verify must be function')
  }

  // create the appropriate type checking function
  const shouldParse = typeof type !== 'function'
    ? typeChecker(type)
    : type

  return {
    inflate,
    limit,
    verify,
    defaultCharset,
    shouldParse,
  }
}

/**
 * Passthrough function that returns input unchanged.
 * Used by parsers that don't need to transform the data.
 *
 * @param {*} value
 * @return {*}
 */
export function passthrough<T> (value: T): T {
  return value
}
