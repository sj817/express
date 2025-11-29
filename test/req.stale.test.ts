import express from '../src/index'
import request from 'supertest'

describe('req', function(){
  describe('.stale', function(){
    it('should return false when the resource is not modified', function (done: any){
      const app = express();
      const etag = '"12345"';

      app.use(function (req: any, res: any){
        res.set('ETag', etag);
        res.send(req.stale);
      });

      request(app)
      .get('/')
      .set('If-None-Match', etag)
      .expect(304, done);
    })

    it('should return true when the resource is modified', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.set('ETag', '"123"');
        res.send(req.stale);
      });

      request(app)
      .get('/')
      .set('If-None-Match', '"12345"')
      .expect(200, 'true', done);
    })

    it('should return true without response headers', function (done: any){
      const app = express();

      app.disable('x-powered-by')
      app.use(function (req: any, res: any){
        res.send(req.stale);
      });

      request(app)
      .get('/')
      .expect(200, 'true', done);
    })
  })
})
