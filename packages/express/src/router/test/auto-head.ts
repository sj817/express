import { it, describe } from 'mocha'
import { Router } from '../../../src/index'
import { createServer, request } from './support/utils.js'

describe('HEAD', function () {
  it('should invoke get without head', function (done: any) {
    const router = Router()
    const server = createServer(router)

    router.get('/users', sethit(1), saw)

    request(server)
      .head('/users')
      .expect('Content-Type', 'text/plain')
      .expect('x-fn-1', 'hit')
      .expect(200, done)
  })

  it('should invoke head if prior to get', function (done: any) {
    const router = Router()
    const server = createServer(router)

    router.head('/users', sethit(1), saw)
    router.get('/users', sethit(2), saw)

    request(server)
      .head('/users')
      .expect('Content-Type', 'text/plain')
      .expect('x-fn-1', 'hit')
      .expect(200, done)
  })
})

function saw (req: any, res: any) {
  const msg = 'saw ' + req.method + ' ' + req.url
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end(msg)
}

function sethit (num: number) {
  const name = 'x-fn-' + String(num)
  return function hit (req: any, res: any, next: any) {
    res.setHeader(name, 'hit')
    next()
  }
}
