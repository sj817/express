import express from '../src/index'
import assert from 'node:assert'

describe('app.listen()', function () {
  it('should wrap with an HTTP server', function (done) {
    const app = express()

    const server = app.listen(0, function () {
      server.close(done)
    })
  })
  it('should callback on HTTP server errors', function (done) {
    const app1 = express()
    const app2 = express()

    const server1 = app1.listen(0, function (err: any) {
      assert(!err)
      app2.listen(server1.address().port, function (err: any) {
        assert(err.code === 'EADDRINUSE')
        server1.close()
        done()
      })
    })
  })
  it('accepts port + hostname + backlog + callback', function (done) {
    const app = express()
    const server = app.listen(0, '127.0.0.1', 5, function () {
      const { address, port } = server.address()
      assert.strictEqual(address, '127.0.0.1')
      assert(Number.isInteger(port) && port > 0)
      // backlog isn't directly inspectable, but if no error was thrown
      // we know it was accepted.
      server.close(done)
    })
  })
  it('accepts just a callback (no args)', function (done) {
    const app = express()
    // same as app.listen(0, done)
    const server = app.listen()
    server.close(done)
  })
  it('server.address() gives a { address, port, family } object', function (done) {
    const app = express()
    const server = app.listen(0, () => {
      const addr: any = server.address()
      assert(addr && typeof addr === 'object')
      assert.strictEqual(typeof addr.address, 'string')
      assert(Number.isInteger(addr.port) && addr.port > 0)
      assert(typeof addr.family === 'string')
      server.close(done)
    })
  })
})
