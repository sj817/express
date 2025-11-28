import assert from 'node:assert'
import express from '../src/index';
import request from 'supertest';

describe('middleware', function(){
  describe('.next()', function(){
    it('should behave like connect', function (done: any){
      const app = express()
        , calls = [];

      app.use(function (req: any, res: any, next: any){
        calls.push('one');
        next();
      });

      app.use(function (req: any, res: any, next: any){
        calls.push('two');
        next();
      });

      app.use(function (req: any, res: any){
        let buf = '';
        res.setHeader('Content-Type', 'application/json');
        req.setEncoding('utf8');
        req.on('data', function(chunk){ buf += chunk });
        req.on('end', function(){
          res.end(buf);
        });
      });

      request(app)
      .get('/')
      .set('Content-Type', 'application/json')
      .send('{"foo":"bar"}')
      .expect('Content-Type', 'application/json')
      .expect(function () { assert.deepEqual(calls, ['one', 'two']) })
      .expect(200, '{"foo":"bar"}', done)
    })
  })
})
