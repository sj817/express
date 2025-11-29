import express from '../src/index'
import request from 'supertest'

describe('app', function(){
  describe('.param(names, fn)', function(){
    it('should map the array', function (done: any){
      const app = express();

      app.param(['id', 'uid'], function(req, res, next, id){
        id = Number(id);
        if (isNaN(id)) return next('route');
        req.params.id = id;
        next();
      });

      app.get('/post/:id', function (req: any, res: any){
        const id = req.params.id;
        res.send((typeof id) + ':' + id)
      });

      app.get('/user/:uid', function (req: any, res: any){
        const id = req.params.id;
        res.send((typeof id) + ':' + id)
      });

      request(app)
        .get('/user/123')
        .expect(200, 'number:123', function (err: any) {
          if (err) return done(err)
          request(app)
            .get('/post/123')
            .expect('number:123', done)
        })
    })
  })

  describe('.param(name, fn)', function(){
    it('should map logic for a single param', function (done: any){
      const app = express();

      app.param('id', function(req, res, next, id){
        id = Number(id);
        if (isNaN(id)) return next('route');
        req.params.id = id;
        next();
      });

      app.get('/user/:id', function (req: any, res: any){
        const id = req.params.id;
        res.send((typeof id) + ':' + id)
      });

      request(app)
        .get('/user/123')
        .expect(200, 'number:123', done)
    })

    it('should only call once per request', function (done: any) {
      const app = express();
      let called = 0;
      let count = 0;

      app.param('user', function(req, res, next, user) {
        called++;
        req.user = user;
        next();
      });

      app.get('/foo/:user', function (req: any, res: any, next: any) {
        count++;
        next();
      });
      app.get('/foo/:user', function (req: any, res: any, next: any) {
        count++;
        next();
      });
      app.use(function (req: any, res: any) {
        res.end([count, called, req.user].join(' '));
      });

      request(app)
      .get('/foo/bob')
      .expect('2 1 bob', done);
    })

    it('should call when values differ', function (done: any) {
      const app = express();
      let called = 0;
      let count = 0;

      app.param('user', function(req, res, next, user) {
        called++;
        req.users = (req.users || []).concat(user);
        next();
      });

      app.get('/:user/bob', function (req: any, res: any, next: any) {
        count++;
        next();
      });
      app.get('/foo/:user', function (req: any, res: any, next: any) {
        count++;
        next();
      });
      app.use(function (req: any, res: any) {
        res.end([count, called, req.users.join(',')].join(' '));
      });

      request(app)
      .get('/foo/bob')
      .expect('2 2 foo,bob', done);
    })

    it('should support altering req.params across routes', function (done: any) {
      const app = express();

      app.param('user', function(req, res, next, user) {
        req.params.user = 'loki';
        next();
      });

      app.get('/:user', function (req: any, res: any, next: any) {
        next('route');
      });
      app.get('/:user', function (req: any, res: any) {
        res.send(req.params.user);
      });

      request(app)
      .get('/bob')
      .expect('loki', done);
    })

    it('should not invoke without route handler', function (done: any) {
      const app = express();

      app.param('thing', function(req, res, next, thing) {
        req.thing = thing;
        next();
      });

      app.param('user', function(req, res, next, user) {
        next(new Error('invalid invocation'))
      });

      app.post('/:user', function (req: any, res: any) {
        res.send(req.params.user);
      });

      app.get('/:thing', function (req: any, res: any) {
        res.send(req.thing);
      });

      request(app)
      .get('/bob')
      .expect(200, 'bob', done);
    })

    it('should work with encoded values', function (done: any){
      const app = express();

      app.param('name', function(req, res, next, name){
        req.params.name = name;
        next();
      });

      app.get('/user/:name', function (req: any, res: any){
        const name = req.params.name;
        res.send('' + name);
      });

      request(app)
      .get('/user/foo%25bar')
      .expect('foo%bar', done);
    })

    it('should catch thrown error', function (done: any){
      const app = express();

      app.param('id', function(req, res, next, id){
        throw new Error('err!');
      });

      app.get('/user/:id', function (req: any, res: any){
        const id = req.params.id;
        res.send('' + id);
      });

      request(app)
      .get('/user/123')
      .expect(500, done);
    })

    it('should catch thrown secondary error', function (done: any){
      const app = express();

      app.param('id', function(req, res, next, val){
        process.nextTick(next);
      });

      app.param('id', function(req, res, next, id){
        throw new Error('err!');
      });

      app.get('/user/:id', function (req: any, res: any){
        const id = req.params.id;
        res.send('' + id);
      });

      request(app)
      .get('/user/123')
      .expect(500, done);
    })

    it('should defer to next route', function (done: any){
      const app = express();

      app.param('id', function(req, res, next, id){
        next('route');
      });

      app.get('/user/:id', function (req: any, res: any){
        const id = req.params.id;
        res.send('' + id);
      });

      app.get('/:name/123', function (req: any, res: any){
        res.send('name');
      });

      request(app)
      .get('/user/123')
      .expect('name', done);
    })

    it('should defer all the param routes', function (done: any){
      const app = express();

      app.param('id', function(req, res, next, val){
        if (val === 'new') return next('route');
        return next();
      });

      app.all('/user/:id', function (req: any, res: any){
        res.send('all.id');
      });

      app.get('/user/:id', function (req: any, res: any){
        res.send('get.id');
      });

      app.get('/user/new', function (req: any, res: any){
        res.send('get.new');
      });

      request(app)
      .get('/user/new')
      .expect('get.new', done);
    })

    it('should not call when values differ on error', function (done: any) {
      const app = express();
      let called = 0;
      let count = 0;

      app.param('user', function(req, res, next, user) {
        called++;
        if (user === 'foo') throw new Error('err!');
        req.user = user;
        next();
      });

      app.get('/:user/bob', function (req: any, res: any, next: any) {
        count++;
        next();
      });
      app.get('/foo/:user', function (req: any, res: any, next: any) {
        count++;
        next();
      });

      app.use(function (err: any, req: any, res: any, next: any) {
        res.status(500);
        res.send([count, called, err.message].join(' '));
      });

      request(app)
      .get('/foo/bob')
      .expect(500, '0 1 err!', done)
    });

    it('should call when values differ when using "next"', function (done: any) {
      const app = express();
      let called = 0;
      let count = 0;

      app.param('user', function(req, res, next, user) {
        called++;
        if (user === 'foo') return next('route');
        req.user = user;
        next();
      });

      app.get('/:user/bob', function (req: any, res: any, next: any) {
        count++;
        next();
      });
      app.get('/foo/:user', function (req: any, res: any, next: any) {
        count++;
        next();
      });
      app.use(function (req: any, res: any) {
        res.end([count, called, req.user].join(' '));
      });

      request(app)
      .get('/foo/bob')
      .expect('1 2 bob', done);
    })
  })
})
