import express from '../src/index'
import request from 'supertest'

describe('req', function(){
  describe('.host', function(){
    it('should return the Host when present', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.end(req.host);
      });

      request(app)
      .post('/')
      .set('Host', 'example.com')
      .expect('example.com', done);
    })

    it('should strip port number', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.end(req.host);
      });

      request(app)
      .post('/')
      .set('Host', 'example.com:3000')
      .expect(200, 'example.com:3000', done);
    })

    it('should return undefined otherwise', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        req.headers.host = null;
        res.end(String(req.host));
      });

      request(app)
      .post('/')
      .expect('undefined', done);
    })

    it('should work with IPv6 Host', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.end(req.host);
      });

      request(app)
      .post('/')
      .set('Host', '[::1]')
      .expect('[::1]', done);
    })

    it('should work with IPv6 Host and port', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.end(req.host);
      });

      request(app)
      .post('/')
      .set('Host', '[::1]:3000')
      .expect(200, '[::1]:3000', done);
    })

    describe('when "trust proxy" is enabled', function(){
      it('should respect X-Forwarded-Host', function (done: any){
        const app = express();

        app.enable('trust proxy');

        app.use(function (req: any, res: any){
          res.end(req.host);
        });

        request(app)
        .get('/')
        .set('Host', 'localhost')
        .set('X-Forwarded-Host', 'example.com')
        .expect('example.com', done);
      })

      it('should ignore X-Forwarded-Host if socket addr not trusted', function (done: any){
        const app = express();

        app.set('trust proxy', '10.0.0.1');

        app.use(function (req: any, res: any){
          res.end(req.host);
        });

        request(app)
        .get('/')
        .set('Host', 'localhost')
        .set('X-Forwarded-Host', 'example.com')
        .expect('localhost', done);
      })

      it('should default to Host', function (done: any){
        const app = express();

        app.enable('trust proxy');

        app.use(function (req: any, res: any){
          res.end(req.host);
        });

        request(app)
        .get('/')
        .set('Host', 'example.com')
        .expect('example.com', done);
      })

      describe('when trusting hop count', function () {
        it('should respect X-Forwarded-Host', function (done: any) {
          const app = express();

          app.set('trust proxy', 1);

          app.use(function (req: any, res: any) {
            res.end(req.host);
          });

          request(app)
          .get('/')
          .set('Host', 'localhost')
          .set('X-Forwarded-Host', 'example.com')
          .expect('example.com', done);
        })
      })
    })

    describe('when "trust proxy" is disabled', function(){
      it('should ignore X-Forwarded-Host', function (done: any){
        const app = express();

        app.use(function (req: any, res: any){
          res.end(req.host);
        });

        request(app)
        .get('/')
        .set('Host', 'localhost')
        .set('X-Forwarded-Host', 'evil')
        .expect('localhost', done);
      })
    })
  })
})
