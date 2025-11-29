import express from '../src/index'
import request from 'supertest'

describe('req', function(){
  describe('.xhr', function(){
    before(function () {
      this.app = express()
      this.app.get('/', function (req: any, res: any) {
        res.send(req.xhr)
      })
    })

    it('should return true when X-Requested-With is xmlhttprequest', function (done: any){
      request(this.app)
        .get('/')
        .set('X-Requested-With', 'xmlhttprequest')
        .expect(200, 'true', done)
    })

    it('should case-insensitive', function (done: any){
      request(this.app)
        .get('/')
        .set('X-Requested-With', 'XMLHttpRequest')
        .expect(200, 'true', done)
    })

    it('should return false otherwise', function (done: any){
      request(this.app)
        .get('/')
        .set('X-Requested-With', 'blahblah')
        .expect(200, 'false', done)
    })

    it('should return false when not present', function (done: any){
      request(this.app)
        .get('/')
        .expect(200, 'false', done)
    })
  })
})
