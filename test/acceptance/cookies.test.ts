
import requireHelper from '../support/require-helper.js'
const app = import('../../examples/cookies.ts')
  
import request from 'supertest';
import utils from '../support/utils.ts';

describe('cookies', function(){
  describe('GET /', function(){
    it('should have a form', function (done: any){
      request(app)
      .get('/')
      .expect(/<form/, done);
    })

    it('should respond with no cookies', function (done: any){
      request(app)
      .get('/')
      .expect(utils.shouldNotHaveHeader('Set-Cookie'))
      .expect(200, done)
    })

    it('should respond to cookie', function (done: any){
      request(app)
      .post('/')
      .type('urlencoded')
      .send({ remember: 1 })
      .expect(302, function (err: any, res: any){
        if (err) return done(err)
        request(app)
        .get('/')
        .set('Cookie', res.headers['set-cookie'][0])
        .expect(200, /Remembered/, done)
      })
    })
  })

  describe('GET /forget', function(){
    it('should clear cookie', function (done: any){
      request(app)
      .post('/')
      .type('urlencoded')
      .send({ remember: 1 })
      .expect(302, function (err: any, res: any){
        if (err) return done(err)
        request(app)
        .get('/forget')
        .set('Cookie', res.headers['set-cookie'][0])
        .expect('Set-Cookie', /remember=;/)
        .expect(302, done)
      })
    })
  })

  describe('POST /', function(){
    it('should set a cookie', function (done: any){
      request(app)
      .post('/')
      .type('urlencoded')
      .send({ remember: 1 })
      .expect('Set-Cookie', /remember=1/)
      .expect(302, done)
    })

    it('should no set cookie w/o reminder', function (done: any){
      request(app)
      .post('/')
      .send({})
      .expect(utils.shouldNotHaveHeader('Set-Cookie'))
      .expect(302, done)
    })
  })
})
