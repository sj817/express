/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import { raw } from './types/raw'
import { json } from './types/json'
import { text } from './types/text'
import { urlencoded } from './types/urlencoded'

import type { RawOptions } from './types/raw'
import type { TextOptions } from './types/text'
import type { NextHandleFunction } from 'connect'
import type { JsonOpts, BaseOptions } from './types/json'
import type { UrlencodedOptions } from './types/urlencoded'

/**
 * Export types using official @types/body-parser names
 */
export type Options = BaseOptions
export type OptionsJson = JsonOpts
export type OptionsText = TextOptions
export type OptionsRaw = RawOptions
export type OptionsUrlencoded = UrlencodedOptions

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
  json,
  raw,
  text,
  urlencoded,
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
  json,
  raw,
  text,
  urlencoded,
}
// export const json = jsonParser
// export const raw = rawParser
// export const text = textParser
// export const urlencoded = urlencodedParser
