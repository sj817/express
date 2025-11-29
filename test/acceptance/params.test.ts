import requireHelper from '../support/require-helper.js'
const app = import('../../examples/params.ts')
import request from 'supertest'

describe('params', function(){
  describe('GET /', function(){
    it('should respond with instructions', function (done: any){
      request(app)
        .get('/')
        .expect(/Visit/,done)
    })
  })

  describe('GET /user/0', function(){
    it('should respond with a user', function (done: any){
      request(app)
        .get('/user/0')
        .expect(/user tj/,done)
    })
  })

  describe('GET /user/9', function(){
    it('should fail to find user', function (done: any){
      request(app)
      .get('/user/9')
      .expect(404, /failed to find user/, done)
    })
  })

  describe('GET /users/0-2', function(){
    it('should respond with three users', function (done: any){
      request(app)
      .get('/users/0-2')
      .expect(/users tj, tobi, loki/, done)
    })
  })

  describe('GET /users/foo-bar', function(){
    it('should fail integer parsing', function (done: any){
      request(app)
      .get('/users/foo-bar')
      .expect(400, /failed to parseInt foo/, done)
    })
  })
})
