/*!
 * serve-static
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

import type * as http from 'node:http'
import encodeUrl from 'encodeurl'
import escapeHtml from 'escape-html'
import parseUrl from 'parseurl'
import send from 'send'
import { format as urlFormat } from 'node:url'
import { resolve } from 'node:path'
import type httpErrors from 'http-errors'

type HttpError = httpErrors.HttpError

/**
 * Module exports.
 * @public
 */

export interface ServeStaticOptions<R extends http.ServerResponse = http.ServerResponse> {
  /**
   * Enable or disable accepting ranged requests, defaults to true.
   * Disabling this will not send Accept-Ranges and ignore the contents of the Range request header.
   */
  acceptRanges?: boolean | undefined

  /**
   * Enable or disable setting Cache-Control response header, defaults to true.
   * Disabling this will ignore the immutable and maxAge options.
   */
  cacheControl?: boolean | undefined

  /**
   * Set how "dotfiles" are treated when encountered. A dotfile is a file or directory that begins with a dot (".").
   * Note this check is done on the path itself without checking if the path actually exists on the disk.
   * If root is specified, only the dotfiles above the root are checked (i.e. the root itself can be within a dotfile when when set to "deny").
   * The default value is 'ignore'.
   * 'allow' No special treatment for dotfiles
   * 'deny' Send a 403 for any request for a dotfile
   * 'ignore' Pretend like the dotfile does not exist and call next()
   */
  dotfiles?: 'allow' | 'deny' | 'ignore' | undefined

  /**
   * Enable or disable etag generation, defaults to true.
   */
  etag?: boolean | undefined

  /**
   * Set file extension fallbacks. When set, if a file is not found, the given extensions will be added to the file name and search for.
   * The first that exists will be served. Example: ['html', 'htm'].
   * The default value is false.
   */
  extensions?: string[] | false | undefined

  /**
   * Set the middleware to have client errors fall-through as just unhandled requests,
   * otherwise forward a client error.
   * The difference is that client errors like a bad request or a request to a non-existent file
   * will cause this middleware to simply next() to your next middleware when this value is true.
   * When this value is false, these errors (even 404s), will invoke next(err).
   *
   * Typically true is desired such that multiple physical directories can be mapped to the same web address
   * or for routes to fill in non-existent files.
   *
   * The value false can be used if this middleware is mounted at a path that is designed to be strictly
   * a single file system directory, which allows for short-circuiting 404s for less overhead.
   * This middleware will also reply to all methods.
   *
   * The default value is true.
   */
  fallthrough?: boolean | undefined

  /**
   * Enable or disable the immutable directive in the Cache-Control response header.
   * If enabled, the maxAge option should also be specified to enable caching. The immutable directive will prevent supported clients from making conditional requests during the life of the maxAge option to check if the file has changed.
   */
  immutable?: boolean | undefined

  /**
   * By default this module will send "index.html" files in response to a request on a directory.
   * To disable this set false or to supply a new index pass a string or an array in preferred order.
   */
  index?: boolean | string | string[] | undefined

  /**
   * Enable or disable Last-Modified header, defaults to true. Uses the file system's last modified value.
   */
  lastModified?: boolean | undefined

  /**
   * Provide a max-age in milliseconds for http caching, defaults to 0. This can also be a string accepted by the ms module.
   */
  maxAge?: number | string | undefined

  /**
   * Redirect to trailing "/" when the pathname is a dir. Defaults to true.
   */
  redirect?: boolean | undefined

  /**
   * Function to set custom headers on response. Alterations to the headers need to occur synchronously.
   * The function is called as fn(res, path, stat), where the arguments are:
   * res the response object
   * path the file path that is being sent
   * stat the stat object of the file that is being sent
   */
  setHeaders?: ((res: R, path: string, stat: any) => any) | undefined

  // Internal options used by send module
  root?: string | undefined
  maxage?: number | string | undefined
}

export interface RequestHandler<R extends http.ServerResponse> {
  (request: http.IncomingMessage, response: R, next: (err?: HttpError) => void): any
}

export interface RequestHandlerConstructor<R extends http.ServerResponse> {
  (root: string, options?: ServeStaticOptions<R>): RequestHandler<R>
}

/**
 * @param {string} root
 * @param {object} [options]
 * @return {function}
 * @public
 */

function serveStatic<R extends http.ServerResponse> (
  root: string,
  options?: ServeStaticOptions<R>
): RequestHandler<R> {
  if (!root) {
    throw new TypeError('root path required')
  }

  if (typeof root !== 'string') {
    throw new TypeError('root path must be a string')
  }

  // copy options object
  const opts: ServeStaticOptions<R> = Object.create(options || null)

  // fall-though
  const fallthrough = opts.fallthrough !== false

  // default redirect
  const redirect = opts.redirect !== false

  // headers listener
  const setHeaders = opts.setHeaders

  if (setHeaders && typeof setHeaders !== 'function') {
    throw new TypeError('option setHeaders must be function')
  }

  // setup options for send
  opts.maxage = opts.maxage || opts.maxAge || 0
  opts.root = resolve(root)

  // construct directory listener
  const onDirectory = redirect
    ? createRedirectDirectoryListener()
    : createNotFoundDirectoryListener()

  return function serveStatic (req: http.IncomingMessage, res: R, next: (err?: HttpError) => void): any {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (fallthrough) {
        return next()
      }

      // method not allowed
      res.statusCode = 405
      res.setHeader('Allow', 'GET, HEAD')
      res.setHeader('Content-Length', '0')
      res.end()
      return
    }

    let forwardError = !fallthrough
    const originalUrl = parseUrl.original(req)
    let path = parseUrl(req)?.pathname

    // make sure redirect occurs at mount
    if (path === '/' && originalUrl?.pathname?.substr(-1) !== '/') {
      path = ''
    }

    // create send stream
    const stream = send(req, path!, opts)

    // add directory handler
    stream.on('directory', onDirectory)

    // add headers listener
    if (setHeaders) {
      stream.on('headers', setHeaders)
    }

    // add file listener for fallthrough
    if (fallthrough) {
      stream.on('file', function onFile () {
        // once file is determined, always forward error
        forwardError = true
      })
    }

    // forward errors
    stream.on('error', function error (err: HttpError) {
      if (forwardError || !(err.statusCode < 500)) {
        next(err)
        return
      }

      next()
    })

    // pipe
    stream.pipe(res)
  }
}

/**
 * Collapse all leading slashes into a single slash
 * @private
 */
function collapseLeadingSlashes (str: string): string {
  let i: number
  for (i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) !== 0x2f /* / */) {
      break
    }
  }

  return i > 1
    ? '/' + str.substr(i)
    : str
}

/**
 * Create a minimal HTML document.
 *
 * @param {string} title
 * @param {string} body
 * @private
 */

function createHtmlDocument (title: string, body: string): string {
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<pre>' + body + '</pre>\n' +
    '</body>\n' +
    '</html>\n'
}

/**
 * Create a directory listener that just 404s.
 * @private
 */

function createNotFoundDirectoryListener (): () => void {
  return function notFound (this: any): void {
    this.error(404)
  }
}

/**
 * Create a directory listener that performs a redirect.
 * @private
 */

function createRedirectDirectoryListener (): (res: http.ServerResponse) => void {
  return function redirect (this: any, res: http.ServerResponse): void {
    if (this.hasTrailingSlash()) {
      this.error(404)
      return
    }

    // get original URL
    const originalUrl = parseUrl.original(this.req)

    if (!originalUrl) {
      this.error(404)
      return
    }

    // append trailing slash
    originalUrl.path = null
    originalUrl.pathname = collapseLeadingSlashes(originalUrl.pathname + '/')

    // reformat the URL
    const loc = encodeUrl(urlFormat(originalUrl))
    const doc = createHtmlDocument('Redirecting', 'Redirecting to ' + escapeHtml(loc))

    // send redirect response
    res.statusCode = 301
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.setHeader('Content-Length', Buffer.byteLength(doc).toString())
    res.setHeader('Content-Security-Policy', "default-src 'none'")
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Location', loc)
    res.end(doc)
  }
}

export default serveStatic
