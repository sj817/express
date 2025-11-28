import assert from 'node:assert'
import express from '../src/index'
import request from 'supertest'

describe('app', function(){
  describe('.VERB()', function(){
    it('should not get invoked without error handler on error', function (done: any) {
      const app = express();

      app.use(function (req: any, res: any, next: any){
        next(new Error('boom!'))
      });

      app.get('/bar', function (req: any, res: any){
        res.send('hello, world!');
      });

      request(app)
      .post('/bar')
      .expect(500, /Error: boom!/, done);
    });

    it('should only call an error handling routing callback when an error is propagated', function (done: any){
      const app = express();

      const a = false;
      const b = false;
      const c = false;
      const d = false;

      app.get('/', function (req: any, res: any, next: any){
        next(new Error('fabricated error'));
      }, function (req: any, res: any, next: any) {
        a = true;
        next();
      }, function (err: any, req: any, res: any, next: any){
        b = true;
        assert.strictEqual(err.message, 'fabricated error')
        next(err);
      }, function (err: any, req: any, res: any, next: any){
        c = true;
        assert.strictEqual(err.message, 'fabricated error')
        next();
      }, function (err: any, req: any, res: any, next: any){
        d = true;
        next();
      }, function (req: any, res: any){
        assert.ok(!a)
        assert.ok(b)
        assert.ok(c)
        assert.ok(!d)
        res.sendStatus(204);
      });

      request(app)
      .get('/')
      .expect(204, done);
    })
  })
})
