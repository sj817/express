import express from '../src/index'
import request from 'supertest'
  , cookieParser = require('cookie-parser')

describe('req', function(){
  describe('.signedCookies', function(){
    it('should return a signed JSON cookie', function (done: any){
      const app = express();

      app.use(cookieParser('secret'));

      app.use(function (req: any, res: any){
        if (req.path === '/set') {
          res.cookie('obj', { foo: 'bar' }, { signed: true });
          res.end();
        } else {
          res.send(req.signedCookies);
        }
      });

      request(app)
      .get('/set')
      .end(function (err: any, res: any){
        if (err) return done(err);
        const cookie = res.header['set-cookie'];

        request(app)
        .get('/')
        .set('Cookie', cookie)
        .expect(200, { obj: { foo: 'bar' } }, done)
      });
    })
  })
})

