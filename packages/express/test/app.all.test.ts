import after from 'after'
import express from '../src/index'
import request from 'supertest'

describe('app.all()', function () {
  it('should add a router per method', function (done) {
    const app = express()
    const cb = after(2, done)

    app.all('/tobi', function (req: any, res: any) {
      res.end(req.method)
    })

    request(app).put('/tobi').expect(200, 'PUT', cb)

    request(app).get('/tobi').expect(200, 'GET', cb)
  })

  it('should run the callback for a method just once', function (done) {
    const app = express()
    let n = 0

    app.all('/*splat', function (req: any, res: any, next: any) {
      if (n++) return done(new Error('DELETE called several times'))
      next()
    })

    request(app).del('/tobi').expect(404, done)
  })
})
