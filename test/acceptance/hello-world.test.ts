
import requireHelper from '../support/require-helper.js'
const app = import('../../examples/hello-world.ts')
import request from 'supertest'

describe('hello-world', function () {
  describe('GET /', function () {
    it('should respond with hello world', function (done: any) {
      request(app)
        .get('/')
        .expect(200, 'Hello World', done)
    })
  })

  describe('GET /missing', function () {
    it('should respond with 404', function (done: any) {
      request(app)
        .get('/missing')
        .expect(404, done)
    })
  })
})
