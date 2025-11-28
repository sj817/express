
import requireHelper from '../support/require-helper.js'
const app = import('../../examples/error.ts')
  
import request from 'supertest';

describe('error', function(){
  describe('GET /', function(){
    it('should respond with 500', function (done: any){
      request(app)
        .get('/')
        .expect(500,done)
    })
  })

  describe('GET /next', function(){
    it('should respond with 500', function (done: any){
      request(app)
        .get('/next')
        .expect(500,done)
    })
  })

  describe('GET /missing', function(){
    it('should respond with 404', function (done: any){
      request(app)
        .get('/missing')
        .expect(404,done)
    })
  })
})
