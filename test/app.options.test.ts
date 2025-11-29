import express from '../src/index'
import request from 'supertest'

describe('OPTIONS', function(){
  it('should default to the routes defined', function (done: any){
    const app = express();

    app.post('/', function(){});
    app.get('/users', function (req: any, res: any){});
    app.put('/users', function (req: any, res: any){});

    request(app)
    .options('/users')
    .expect('Allow', 'GET, HEAD, PUT')
    .expect(200, 'GET, HEAD, PUT', done);
  })

  it('should only include each method once', function (done: any){
    const app = express();

    app.delete('/', function(){});
    app.get('/users', function (req: any, res: any){});
    app.put('/users', function (req: any, res: any){});
    app.get('/users', function (req: any, res: any){});

    request(app)
    .options('/users')
    .expect('Allow', 'GET, HEAD, PUT')
    .expect(200, 'GET, HEAD, PUT', done);
  })

  it('should not be affected by app.all', function (done: any){
    const app = express();

    app.get('/', function(){});
    app.get('/users', function (req: any, res: any){});
    app.put('/users', function (req: any, res: any){});
    app.all('/users', function (req: any, res: any, next: any){
      res.setHeader('x-hit', '1');
      next();
    });

    request(app)
    .options('/users')
    .expect('x-hit', '1')
    .expect('Allow', 'GET, HEAD, PUT')
    .expect(200, 'GET, HEAD, PUT', done);
  })

  it('should not respond if the path is not defined', function (done: any){
    const app = express();

    app.get('/users', function (req: any, res: any){});

    request(app)
    .options('/other')
    .expect(404, done);
  })

  it('should forward requests down the middleware chain', function (done: any){
    const app = express();
    const router = new express.Router();

    router.get('/users', function (req: any, res: any){});
    app.use(router);
    app.get('/other', function (req: any, res: any){});

    request(app)
    .options('/other')
    .expect('Allow', 'GET, HEAD')
    .expect(200, 'GET, HEAD', done);
  })

  describe('when error occurs in response handler', function () {
    it('should pass error to callback', function (done: any) {
      const app = express();
      const router = express.Router();

      router.get('/users', function (req: any, res: any){});

      app.use(function (req: any, res: any, next: any) {
        res.writeHead(200);
        next();
      });
      app.use(router);
      app.use(function (err: any, req: any, res: any, next: any) {
        res.end('true');
      });

      request(app)
      .options('/users')
      .expect(200, 'true', done)
    })
  })
})

describe('app.options()', function(){
  it('should override the default behavior', function (done: any){
    const app = express();

    app.options('/users', function (req: any, res: any){
      res.set('Allow', 'GET');
      res.send('GET');
    });

    app.get('/users', function (req: any, res: any){});
    app.put('/users', function (req: any, res: any){});

    request(app)
    .options('/users')
    .expect('GET')
    .expect('Allow', 'GET', done);
  })
})
