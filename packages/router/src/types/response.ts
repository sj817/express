import type { SendOptions } from 'send'
import type { Response } from '@karinjs/express'

/**
 * 错误回调函数类型定义
 * @param err - 错误对象
 * @returns 无返回值
 */
export type Errback = (err: Error) => void
/**
 * send 方法类型定义
 * @template ResBody - 响应体的类型，默认为 any
 * @template T - 返回的响应对象类型，默认为 Response<ResBody>
 * @param body - 可选的响应体内容
 * @returns 响应对象
 */
export type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T
/**
 * sendFile 方法的选项配置
 * @extends SendOptions
 */
export interface SendFileOptions extends SendOptions {
  /** 与文件一起提供的 HTTP 响应头对象 */
  headers?: Record<string, unknown>
}

/**
 * download 方法的选项配置
 * @extends SendOptions
 */
export interface DownloadOptions extends SendOptions {
  /** 与文件一起提供的 HTTP 响应头对象。`Content-Disposition` 响应头将被 filename 参数覆盖 */
  headers?: Record<string, unknown>
}

/**
 * 响应本地变量接口
 * 用于存储在响应生命周期内的本地数据
 * 可以通过声明合并来扩展此接口，添加自定义的本地变量类型
 */
export interface Locals { }

/**
 * Options passed down into `res.cookie`
 * @link https://expressjs.com/en/api.html#res.cookie
 */
export interface CookieOptions {
  /** Convenient option for setting the expiry time relative to the current time in **milliseconds**. */
  maxAge?: number
  /** Indicates if the cookie should be signed. */
  signed?: boolean
  /** Expiry date of the cookie in GMT. If not specified (undefined), creates a session cookie. */
  expires?: Date
  /** Flags the cookie to be accessible only by the web server. */
  httpOnly?: boolean
  /** Path for the cookie. Defaults to “/”. */
  path?: string
  /** Domain name for the cookie. Defaults to the domain name of the app. */
  domain?: string
  /** Marks the cookie to be used with HTTPS only. */
  secure?: boolean
  /** A synchronous function used for cookie value encoding. Defaults to encodeURIComponent. */
  encode?: ((val: string) => string) | undefined
  /**
   * Value of the “SameSite” Set-Cookie attribute.
   * @link https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1.
   */
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  /**
   * Value of the “Priority” Set-Cookie attribute.
   * @link https://datatracker.ietf.org/doc/html/draft-west-cookie-priority-00#section-4.3
   */
  priority?: 'low' | 'medium' | 'high'
  /** Marks the cookie to use partioned storage. */
  partitioned?: boolean
}

// export interface Response<
//   ResBody = any,
//   LocalsObj extends Record<string, any> = Record<string, any>,
//   StatusCode extends number = number
// > extends ServerResponse {
//   /**
//    * Set status `code`.
//    */
//   status (code: StatusCode): this

//   /**
//    * Set the response HTTP status code to `statusCode` and send its string representation as the response body.
//    * @link http://expressjs.com/4x/api.html#res.sendStatus
//    *
//    * Examples:
//    *
//    *    res.sendStatus(200); // equivalent to res.status(200).send('OK')
//    *    res.sendStatus(403); // equivalent to res.status(403).send('Forbidden')
//    *    res.sendStatus(404); // equivalent to res.status(404).send('Not Found')
//    *    res.sendStatus(500); // equivalent to res.status(500).send('Internal Server Error')
//    */
//   sendStatus (code: StatusCode): this

//   /**
//    * Set Link header field with the given `links`.
//    *
//    * Examples:
//    *
//    *    res.links({
//    *      next: 'http://api.example.com/users?page=2',
//    *      last: 'http://api.example.com/users?page=5'
//    *    });
//    */
//   links (links: any): this

//   /**
//    * Send a response.
//    *
//    * Examples:
//    *
//    *     res.send(new Buffer('wahoo'));
//    *     res.send({ some: 'json' });
//    *     res.send('<p>some html</p>');
//    *     res.status(404).send('Sorry, cant find that');
//    */
//   send: Send<ResBody, this>

//   /**
//    * Send JSON response.
//    *
//    * Examples:
//    *
//    *     res.json(null);
//    *     res.json({ user: 'tj' });
//    *     res.status(500).json('oh noes!');
//    *     res.status(404).json('I dont have that');
//    */
//   json: Send<ResBody, this>

//   /**
//    * Send JSON response with JSONP callback support.
//    *
//    * Examples:
//    *
//    *     res.jsonp(null);
//    *     res.jsonp({ user: 'tj' });
//    *     res.status(500).jsonp('oh noes!');
//    *     res.status(404).jsonp('I dont have that');
//    */
//   jsonp: Send<ResBody, this>

//   /**
//    * Transfer the file at the given `path`.
//    *
//    * Automatically sets the _Content-Type_ response header field.
//    * The callback `fn(err)` is invoked when the transfer is complete
//    * or when an error occurs. Be sure to check `res.headersSent`
//    * if you wish to attempt responding, as the header and some data
//    * may have already been transferred.
//    *
//    * Options:
//    *
//    *   - `maxAge`   defaulting to 0 (can be string converted by `ms`)
//    *   - `root`     root directory for relative filenames
//    *   - `headers`  object of headers to serve with file
//    *   - `dotfiles` serve dotfiles, defaulting to false; can be `"allow"` to send them
//    *
//    * Other options are passed along to `send`.
//    *
//    * Examples:
//    *
//    *  The following example illustrates how `res.sendFile()` may
//    *  be used as an alternative for the `static()` middleware for
//    *  dynamic situations. The code backing `res.sendFile()` is actually
//    *  the same code, so HTTP cache support etc is identical.
//    *
//    *     app.get('/user/:uid/photos/:file', function(req, res){
//    *       var uid = req.params.uid
//    *         , file = req.params.file;
//    *
//    *       req.user.mayViewFilesFrom(uid, function(yes){
//    *         if (yes) {
//    *           res.sendFile('/uploads/' + uid + '/' + file);
//    *         } else {
//    *           res.send(403, 'Sorry! you cant see that.');
//    *         }
//    *       });
//    *     });
//    *
//    * @api public
//    */
//   sendFile (path: string, fn?: Errback): void
//   sendFile (path: string, options: SendFileOptions, fn?: Errback): void

//   /**
//    * Transfer the file at the given `path` as an attachment.
//    *
//    * Optionally providing an alternate attachment `filename`,
//    * and optional callback `fn(err)`. The callback is invoked
//    * when the data transfer is complete, or when an error has
//    * ocurred. Be sure to check `res.headersSent` if you plan to respond.
//    *
//    * The optional options argument passes through to the underlying
//    * res.sendFile() call, and takes the exact same parameters.
//    *
//    * This method uses `res.sendFile()`.
//    */
//   download (path: string, fn?: Errback): void
//   download (path: string, filename: string, fn?: Errback): void
//   download (path: string, filename: string, options: DownloadOptions, fn?: Errback): void

//   /**
//    * Set _Content-Type_ response header with `type` through `mime.lookup()`
//    * when it does not contain "/", or set the Content-Type to `type` otherwise.
//    *
//    * Examples:
//    *
//    *     res.type('.html');
//    *     res.type('html');
//    *     res.type('json');
//    *     res.type('application/json');
//    *     res.type('png');
//    */
//   contentType (type: string): this

//   /**
//    * Set _Content-Type_ response header with `type` through `mime.lookup()`
//    * when it does not contain "/", or set the Content-Type to `type` otherwise.
//    *
//    * Examples:
//    *
//    *     res.type('.html');
//    *     res.type('html');
//    *     res.type('json');
//    *     res.type('application/json');
//    *     res.type('png');
//    */
//   type (type: string): this

//   /**
//    * Respond to the Acceptable formats using an `obj`
//    * of mime-type callbacks.
//    *
//    * This method uses `req.accepted`, an array of
//    * acceptable types ordered by their quality values.
//    * When "Accept" is not present the _first_ callback
//    * is invoked, otherwise the first match is used. When
//    * no match is performed the server responds with
//    * 406 "Not Acceptable".
//    *
//    * Content-Type is set for you, however if you choose
//    * you may alter this within the callback using `res.type()`
//    * or `res.set('Content-Type', ...)`.
//    *
//    *    res.format({
//    *      'text/plain': function(){
//    *        res.send('hey');
//    *      },
//    *
//    *      'text/html': function(){
//    *        res.send('<p>hey</p>');
//    *      },
//    *
//    *      'appliation/json': function(){
//    *        res.send({ message: 'hey' });
//    *      }
//    *    });
//    *
//    * In addition to canonicalized MIME types you may
//    * also use extnames mapped to these types:
//    *
//    *    res.format({
//    *      text: function(){
//    *        res.send('hey');
//    *      },
//    *
//    *      html: function(){
//    *        res.send('<p>hey</p>');
//    *      },
//    *
//    *      json: function(){
//    *        res.send({ message: 'hey' });
//    *      }
//    *    });
//    *
//    * By default Express passes an `Error`
//    * with a `.status` of 406 to `next(err)`
//    * if a match is not made. If you provide
//    * a `.default` callback it will be invoked
//    * instead.
//    */
//   format (obj: any): this

//   /**
//    * Set _Content-Disposition_ header to _attachment_ with optional `filename`.
//    */
//   attachment (filename?: string): this

//   /**
//    * Set header `field` to `val`, or pass
//    * an object of header fields.
//    *
//    * Examples:
//    *
//    *    res.set('Foo', ['bar', 'baz']);
//    *    res.set('Accept', 'application/json');
//    *    res.set({ Accept: 'text/plain', 'X-API-Key': 'tobi' });
//    *
//    * Aliased as `res.header()`.
//    */
//   set (field: any): this
//   set (field: string, value?: string | string[]): this

//   header (field: any): this
//   header (field: string, value?: string | string[]): this

//   // Property indicating if HTTP headers has been sent for the response.
//   headersSent: boolean

//   /** Get value for header `field`. */
//   get (field: string): string | undefined

//   /** Clear cookie `name`. */
//   clearCookie (name: string, options?: CookieOptions): this

//   /**
//    * Set cookie `name` to `val`, with the given `options`.
//    *
//    * Options:
//    *
//    *    - `maxAge`   max-age in milliseconds, converted to `expires`
//    *    - `signed`   sign the cookie
//    *    - `path`     defaults to "/"
//    *
//    * Examples:
//    *
//    *    // "Remember Me" for 15 minutes
//    *    res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true });
//    *
//    *    // save as above
//    *    res.cookie('rememberme', '1', { maxAge: 900000, httpOnly: true })
//    */
//   cookie (name: string, val: string, options: CookieOptions): this
//   cookie (name: string, val: any, options: CookieOptions): this
//   cookie (name: string, val: any): this

//   /**
//    * Set the location header to `url`.
//    *
//    * Examples:
//    *
//    *    res.location('/foo/bar').;
//    *    res.location('http://example.com');
//    *    res.location('../login'); // /blog/post/1 -> /blog/login
//    *
//    * Mounting:
//    *
//    *   When an application is mounted and `res.location()`
//    *   is given a path that does _not_ lead with "/" it becomes
//    *   relative to the mount-point. For example if the application
//    *   is mounted at "/blog", the following would become "/blog/login".
//    *
//    *      res.location('login');
//    *
//    *   While the leading slash would result in a location of "/login":
//    *
//    *      res.location('/login');
//    */
//   location (url: string): this

//   /**
//    * Redirect to the given `url` with optional response `status`
//    * defaulting to 302.
//    *
//    * The resulting `url` is determined by `res.location()`, so
//    * it will play nicely with mounted apps, relative paths, etc.
//    *
//    * Examples:
//    *
//    *    res.redirect('/foo/bar');
//    *    res.redirect('http://example.com');
//    *    res.redirect(301, 'http://example.com');
//    *    res.redirect('../login'); // /blog/post/1 -> /blog/login
//    */
//   redirect (url: string): void
//   redirect (status: number, url: string): void

//   /**
//    * Render `view` with the given `options` and optional callback `fn`.
//    * When a callback function is given a response will _not_ be made
//    * automatically, otherwise a response of _200_ and _text/html_ is given.
//    *
//    * Options:
//    *
//    *  - `cache`     boolean hinting to the engine it should cache
//    *  - `filename`  filename of the view being rendered
//    */
//   render (view: string, options?: object, callback?: (err: Error, html: string) => void): void
//   render (view: string, callback?: (err: Error, html: string) => void): void

//   locals: LocalsObj & Locals

//   charset: string

//   /**
//    * Adds the field to the Vary response header, if it is not there already.
//    * Examples:
//    *
//    *     res.vary('User-Agent').render('docs');
//    */
//   vary (field: string): this

//   app: Application

//   /**
//    * Appends the specified value to the HTTP response header field.
//    * If the header is not already set, it creates the header with the specified value.
//    * The value parameter can be a string or an array.
//    *
//    * Note: calling res.set() after res.append() will reset the previously-set header value.
//    *
//    * @since 4.11.0
//    */
//   append (field: string, value?: string[] | string): this

//   /**
//    * After middleware.init executed, Response will contain req property
//    * See: express/lib/middleware/init.js
//    */
//   // req: Request
// }
