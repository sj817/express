import express from '../src/index'
import request from 'supertest'

describe('req', function(){
  describe('.acceptsEncodings', function () {
    it('should return encoding if accepted', function (done: any) {
      const app = express();

      app.get('/', function (req: any, res: any) {
        res.send({
          gzip: req.acceptsEncodings('gzip'),
          deflate: req.acceptsEncodings('deflate')
        })
      })

      request(app)
        .get('/')
        .set('Accept-Encoding', ' gzip, deflate')
        .expect(200, { gzip: 'gzip', deflate: 'deflate' }, done)
    })

    it('should be false if encoding not accepted', function (done: any){
      const app = express();

      app.get('/', function (req: any, res: any) {
        res.send({
          bogus: req.acceptsEncodings('bogus')
        })
      })

      request(app)
        .get('/')
        .set('Accept-Encoding', ' gzip, deflate')
        .expect(200, { bogus: false }, done)
    })
  })
})
