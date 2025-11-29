import express from '../src/index'
import request from 'supertest'

describe('res', function(){
  describe('.type(str)', function(){
    it('should set the Content-Type based on a filename', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.type('foo.js').end('const name = "tj";');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'text/javascript; charset=utf-8')
      .end(done)
    })

    it('should default to application/octet-stream', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.type('rawr').end('const name = "tj";');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/octet-stream', done);
    })

    it('should set the Content-Type with type/subtype', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.type('application/vnd.amazon.ebook')
          .end('const name = "tj";');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/vnd.amazon.ebook', done);
    })
  })
})
