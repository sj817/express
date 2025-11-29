/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import { raw as rawParser, type RawOptions } from './types/raw.js'
import { json as jsonParser, type JsonOptions as JsonOpts, type Options as BaseOptions } from './types/json.js'
import { text as textParser, type TextOptions as TextOpts } from './types/text.js'
import { urlencoded as urlencodedParser, type UrlencodedOptions as UrlencodedOpts } from './types/urlencoded.js'
import type { NextHandleFunction } from 'connect'

/**
 * Export types using official @types/body-parser names
 */
export type Options = BaseOptions
export type OptionsJson = JsonOpts
export type OptionsText = TextOpts
export type OptionsRaw = RawOptions
export type OptionsUrlencoded = UrlencodedOpts

/**
 * BodyParser interface matching @types/body-parser
 */
export interface BodyParser {
  /**
   * @deprecated use individual json/urlencoded middlewares
   */
  (options?: OptionsJson & OptionsText & OptionsUrlencoded): NextHandleFunction

  /**
   * Returns middleware that only parses json and only looks at requests
   * where the Content-Type header matches the type option.
   */
  json (options?: OptionsJson): NextHandleFunction

  /**
   * Returns middleware that parses all bodies as a Buffer and only looks at requests
   * where the Content-Type header matches the type option.
   */
  raw (options?: Options): NextHandleFunction

  /**
   * Returns middleware that parses all bodies as a string and only looks at requests
   * where the Content-Type header matches the type option.
   */
  text (options?: OptionsText): NextHandleFunction

  /**
   * Returns middleware that only parses urlencoded bodies and only looks at requests
   * where the Content-Type header matches the type option
   */
  urlencoded (options?: OptionsUrlencoded): NextHandleFunction
}

/**
 * Create a middleware to parse json and urlencoded bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @deprecated
 * @public
 */
function deprecatedBodyParser (options?: OptionsJson & OptionsText & OptionsUrlencoded): never {
  throw new Error('The bodyParser() generic has been split into individual middleware to use instead.')
}

/**
 * Create the bodyParser object using Object.assign
 * This matches the original implementation pattern
 */
const bodyParser = Object.assign(deprecatedBodyParser, {
  json: jsonParser,
  raw: rawParser,
  text: textParser,
  urlencoded: urlencodedParser,
}) as BodyParser

/**
 * Export as default (CommonJS compatibility)
 */
export default bodyParser

/**
 * Named exports for ESM
 */
export {
  bodyParser,
  jsonParser as json,
  rawParser as raw,
  textParser as text,
  urlencodedParser as urlencoded,
}
// export const json = jsonParser
// export const raw = rawParser
// export const text = textParser
// export const urlencoded = urlencodedParser
