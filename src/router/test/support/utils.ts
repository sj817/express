import assert from 'node:assert'
import finalhandler from 'finalhandler'
import http, { METHODS } from 'node:http'

import request from 'supertest'
import type { Server } from 'node:http'

const methods = METHODS.map((method) => method.toLowerCase())

function createHitHandle (num: number) {
  const name = 'x-fn-' + String(num)
  return function hit (req: any, res: any, next: any) {
    res.setHeader(name, 'hit')
    next()
  }
}

function createServer (router: any) {
  return http.createServer(function onRequest (req, res) {
    router(req, res, finalhandler(req, res))
  })
}

function rawrequest (server: Server) {
  const _headers: Record<string, string> = {}
  let _method: string
  let _path: string
  const _test: any = {}

  methods.forEach(function (method) {
    _test[method] = go.bind(null, method)
  })

  function expect (this: any, status: number | string, body?: string, callback?: (err: Error | null) => void): any {
    if (arguments.length === 2) {
      _headers[(status as string).toLowerCase()] = body as string
      return this
    }

    let _server: Server | undefined

    if (!server.address()) {
      _server = server.listen(0, onListening)
      return
    }

    onListening.call(server)

    function onListening (this: Server) {
      const addr = this.address()
      const port = (addr as any).port

      const req = http.request({
        host: '127.0.0.1',
        method: _method,
        path: _path,
        port,
      })
      req.on('response', function (res) {
        let buf = ''

        res.setEncoding('utf8')
        res.on('data', function (s) { buf += s })
        res.on('end', function () {
          let err: Error | null = null

          try {
            for (const key in _headers) {
              assert.equal(res.headers[key], _headers[key])
            }

            assert.equal(res.statusCode, status)
            assert.equal(buf, body)
          } catch (e) {
            err = e as Error
          }

          if (_server) {
            _server.close()
          }

          callback!(err)
        })
      })
      req.end()
    }
  }

  function go (method: string, path: string) {
    _method = method
    _path = path

    return {
      expect,
    }
  }

  return _test
}

function shouldHaveBody (buf: Buffer) {
  return function (res: any) {
    const body = !Buffer.isBuffer(res.body)
      ? Buffer.from(res.text)
      : res.body
    assert.ok(body, 'response has body')
    assert.strictEqual(body.toString('hex'), buf.toString('hex'))
  }
}

function shouldHitHandle (num: number) {
  const header = 'x-fn-' + String(num)
  return function (res: any) {
    assert.equal(res.headers[header], 'hit', 'should hit handle ' + num)
  }
}

function shouldNotHaveBody () {
  return function (res: any) {
    assert.ok(res.text === '' || res.text === undefined)
  }
}

function shouldNotHitHandle (num: number) {
  return shouldNotHaveHeader('x-fn-' + String(num))
}

function shouldNotHaveHeader (header: string) {
  return function (res: any) {
    assert.ok(!(header.toLowerCase() in res.headers), 'should not have header ' + header)
  }
}

export { assert, createHitHandle, createServer, rawrequest, request, shouldHaveBody, shouldNotHaveBody, shouldHitHandle, shouldNotHitHandle, methods }
