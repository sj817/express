import express from '../src/index'
import request from 'supertest'
import assert from 'node:assert'

describe('HEAD', function () {
  it('should default to GET', function (done) {
    const app = express()

    app.get('/tobi', function (req: any, res: any) {
      // send() detects HEAD
      res.send('tobi')
    })

    request(app).head('/tobi').expect(200, done)
  })

  it('should output the same headers as GET requests', function (done) {
    const app = express()

    app.get('/tobi', function (req: any, res: any) {
      // send() detects HEAD
      res.send('tobi')
    })

    request(app)
      .head('/tobi')
      .expect(200, function (err: any, res: any) {
        if (err) return done(err)
        const headers = res.headers
        request(app)
          .get('/tobi')
          .expect(200, function (err: any, res: any) {
            if (err) return done(err)
            delete headers.date
            delete res.headers.date
            assert.deepEqual(res.headers, headers)
            done()
          })
      })
  })
})

describe('app.head()', function () {
  it('should override', function (done) {
    const app = express()

    app.head('/tobi', function (req: any, res: any) {
      res.header('x-method', 'head')
      res.end()
    })

    app.get('/tobi', function (req: any, res: any) {
      res.header('x-method', 'get')
      res.send('tobi')
    })

    request(app).head('/tobi').expect('x-method', 'head').expect(200, done)
  })
})
