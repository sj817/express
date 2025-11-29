import express from '../src/index'
import request from 'supertest'

describe('res', function(){
  describe('.locals', function(){
    it('should be empty by default', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.json(res.locals)
      });

      request(app)
      .get('/')
      .expect(200, {}, done)
    })
  })

  it('should work when mounted', function (done: any){
    const app = express();
    const blog = express();

    app.use(blog);

    blog.use(function (req: any, res: any, next: any){
      res.locals.foo = 'bar';
      next();
    });

    app.use(function (req: any, res: any){
      res.json(res.locals)
    });

    request(app)
    .get('/')
    .expect(200, { foo: 'bar' }, done)
  })
})
