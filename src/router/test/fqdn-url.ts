import { it, describe } from 'mocha'
import { Router } from '../../../src/index.js'
import { createServer, rawrequest } from './support/utils.js'

describe('FQDN url', function () {
  it('should not obscure FQDNs', function (done: any) {
    const router = new Router()
    const server = createServer(router)

    router.use(saw)

    rawrequest(server)
      .get('http://example.com/foo')
      .expect(200, 'saw GET http://example.com/foo', done)
  })

  it('should strip/restore FQDN req.url', function (done: any) {
    const router = new Router()
    const server = createServer(router)

    router.use('/blog', setsaw(1))
    router.use(saw)

    rawrequest(server)
      .get('http://example.com/blog/post/1')
      .expect('x-saw-1', 'GET http://example.com/post/1')
      .expect(200, 'saw GET http://example.com/blog/post/1', done)
  })

  it('should ignore FQDN in search', function (done: any) {
    const router = new Router()
    const server = createServer(router)

    router.use('/proxy', setsaw(1))
    router.use(saw)

    rawrequest(server)
      .get('/proxy?url=http://example.com/blog/post/1')
      .expect('x-saw-1', 'GET /?url=http://example.com/blog/post/1')
      .expect(200, 'saw GET /proxy?url=http://example.com/blog/post/1', done)
  })

  it('should ignore FQDN in path', function (done: any) {
    const router = new Router()
    const server = createServer(router)

    router.use('/proxy', setsaw(1))
    router.use(saw)

    rawrequest(server)
      .get('/proxy/http://example.com/blog/post/1')
      .expect('x-saw-1', 'GET /http://example.com/blog/post/1')
      .expect(200, 'saw GET /proxy/http://example.com/blog/post/1', done)
  })
})

function setsaw (num: number) {
  const name = 'x-saw-' + String(num)
  return function hit (req: any, res: any, next: any) {
    res.setHeader(name, req.method + ' ' + req.url)
    next()
  }
}

function saw (req: any, res: any) {
  const msg = 'saw ' + req.method + ' ' + req.url
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end(msg)
}
