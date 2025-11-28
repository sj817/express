import express from '../src/index'
import request from 'supertest'

describe('req', function(){
  describe('.protocol', function(){
    it('should return the protocol string', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.end(req.protocol);
      });

      request(app)
      .get('/')
      .expect('http', done);
    })

    describe('when "trust proxy" is enabled', function(){
      it('should respect X-Forwarded-Proto', function (done: any){
        const app = express();

        app.enable('trust proxy');

        app.use(function (req: any, res: any){
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('https', done);
      })

      it('should default to the socket addr if X-Forwarded-Proto not present', function (done: any){
        const app = express();

        app.enable('trust proxy');

        app.use(function (req: any, res: any){
          req.socket.encrypted = true;
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .expect('https', done);
      })

      it('should ignore X-Forwarded-Proto if socket addr not trusted', function (done: any){
        const app = express();

        app.set('trust proxy', '10.0.0.1');

        app.use(function (req: any, res: any){
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('http', done);
      })

      it('should default to http', function (done: any){
        const app = express();

        app.enable('trust proxy');

        app.use(function (req: any, res: any){
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .expect('http', done);
      })

      describe('when trusting hop count', function () {
        it('should respect X-Forwarded-Proto', function (done: any) {
          const app = express();

          app.set('trust proxy', 1);

          app.use(function (req: any, res: any) {
            res.end(req.protocol);
          });

          request(app)
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('https', done);
        })
      })
    })

    describe('when "trust proxy" is disabled', function(){
      it('should ignore X-Forwarded-Proto', function (done: any){
        const app = express();

        app.use(function (req: any, res: any){
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('http', done);
      })
    })
  })
})
