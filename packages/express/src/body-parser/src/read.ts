/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

import createError from 'http-errors'
import getBody from 'raw-body'
import iconv from 'iconv-lite'
import onFinished from 'on-finished'
import zlib from 'node:zlib'
import { hasBody } from 'type-is'
import { getCharset } from './utils.js'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Debugger } from 'debug'
import type { Readable } from 'node:stream'

/**
 * Read options interface
 */
export interface ReadOptions {
  inflate: boolean
  limit: number | null
  verify: false | ((req: IncomingMessage, res: ServerResponse, buf: Buffer, encoding: string) => void)
  defaultCharset: string
  shouldParse: (req: IncomingMessage) => boolean
  skipCharset?: boolean
  isValidCharset?: (charset: string) => boolean
  encoding?: string | null
  length?: number
}

/**
 * Extended IncomingMessage with body property
 */
interface IncomingMessageWithBody extends IncomingMessage {
  body?: any
  length?: number
}

/**
 * Stream with length property
 */
type StreamWithLength = Readable & {
  length?: number
}

/**
 * Read a request into a buffer and parse.
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 * @param {function} parse
 * @param {function} debug
 * @param {object} options
 * @private
 */
export function read (
  req: IncomingMessageWithBody,
  res: ServerResponse,
  next: (err?: any) => void,
  parse: (body: string, encoding: string | null) => any,
  debug: Debugger,
  options: ReadOptions
): void {
  if (onFinished.isFinished(req)) {
    debug('body already parsed')
    next()
    return
  }

  if (!('body' in req)) {
    req.body = undefined
  }

  // skip requests without bodies
  if (!hasBody(req)) {
    debug('skip empty body')
    next()
    return
  }

  debug('content-type %j', req.headers['content-type'])

  // determine if request should be parsed
  if (!options.shouldParse(req)) {
    debug('skip parsing')
    next()
    return
  }

  let encoding: string | null = null
  if (options?.skipCharset !== true) {
    encoding = getCharset(req) || options.defaultCharset

    // validate charset
    if (!!options?.isValidCharset && !options.isValidCharset(encoding)) {
      debug('invalid charset')
      next(createError(415, 'unsupported charset "' + encoding.toUpperCase() + '"', {
        charset: encoding,
        type: 'charset.unsupported',
      }))
      return
    }
  }

  let length: number | undefined
  const opts = options
  let stream: StreamWithLength

  // read options
  const verify = opts.verify

  try {
    // get the content stream
    stream = contentstream(req, debug, opts.inflate)
    length = stream.length
    stream.length = undefined
  } catch (err) {
    return next(err)
  }

  // set raw-body options
  opts.length = length
  opts.encoding = verify
    ? null
    : encoding

  // assert charset is supported
  if (opts.encoding === null && encoding !== null && !iconv.encodingExists(encoding)) {
    return next(createError(415, 'unsupported charset "' + encoding.toUpperCase() + '"', {
      charset: encoding.toLowerCase(),
      type: 'charset.unsupported',
    }))
  }

  // read body
  debug('read body')
  getBody(stream, opts as any, function (error: any, body: Buffer) {
    if (error) {
      let _error: any

      if (error.type === 'encoding.unsupported') {
        // echo back charset
        _error = createError(415, 'unsupported charset "' + encoding!.toUpperCase() + '"', {
          charset: encoding!.toLowerCase(),
          type: 'charset.unsupported',
        })
      } else {
        // set status code on error
        _error = createError(400, error)
      }

      // unpipe from stream and destroy
      if (stream !== req) {
        req.unpipe()
        if ('destroy' in stream && typeof stream.destroy === 'function') {
          stream.destroy()
        }
      }

      // read off entire request
      dump(req, function onfinished () {
        next(createError(400, _error))
      })
      return
    }

    // verify
    if (verify) {
      try {
        debug('verify body')
        verify(req, res, body, encoding!)
      } catch (err) {
        next(createError(403, err as Error, {
          body,
          type: (err as any).type || 'entity.verify.failed',
        }))
        return
      }
    }

    // parse
    let str: string | Buffer = body
    try {
      debug('parse body')
      str = typeof body !== 'string' && encoding !== null
        ? iconv.decode(body, encoding)
        : body
      req.body = parse(str as string, encoding)
    } catch (err) {
      next(createError(400, err as Error, {
        body: str,
        type: (err as any).type || 'entity.parse.failed',
      }))
      return
    }

    next()
  })
}

/**
 * Get the content stream of the request.
 *
 * @param {object} req
 * @param {function} debug
 * @param {boolean} [inflate=true]
 * @return {object}
 * @api private
 */
function contentstream (
  req: IncomingMessageWithBody,
  debug: Debugger,
  inflate: boolean
): StreamWithLength {
  const encoding = (req.headers['content-encoding'] || 'identity').toLowerCase()
  const length = req.headers['content-length']

  debug('content-encoding "%s"', encoding)

  if (inflate === false && encoding !== 'identity') {
    throw createError(415, 'content encoding unsupported', {
      encoding,
      type: 'encoding.unsupported',
    })
  }

  if (encoding === 'identity') {
    req.length = length ? parseInt(length, 10) : undefined
    return req as any as StreamWithLength
  }

  const stream = createDecompressionStream(encoding, debug) as StreamWithLength
  req.pipe(stream as any)
  return stream
}

/**
 * Create a decompression stream for the given encoding.
 * @param {string} encoding
 * @param {function} debug
 * @return {object}
 * @api private
 */
function createDecompressionStream (encoding: string, debug: Debugger): Readable {
  switch (encoding) {
    case 'deflate':
      debug('inflate body')
      return zlib.createInflate()
    case 'gzip':
      debug('gunzip body')
      return zlib.createGunzip()
    case 'br':
      debug('brotli decompress body')
      return zlib.createBrotliDecompress()
    default:
      throw createError(415, 'unsupported content encoding "' + encoding + '"', {
        encoding,
        type: 'encoding.unsupported',
      })
  }
}

/**
 * Dump the contents of a request.
 *
 * @param {object} req
 * @param {function} callback
 * @api private
 */
function dump (req: IncomingMessage, callback: (err: Error | null) => void): void {
  if (onFinished.isFinished(req)) {
    callback(null)
  } else {
    onFinished(req, callback)
    req.resume()
  }
}
