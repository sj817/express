import express from '../src/index'
import request from 'supertest'

describe('req', function(){
  describe('.route', function(){
    it('should be the executed Route', function (done: any){
      const app = express();

      app.get('/user/:id{/:op}', function (req: any, res: any, next: any){
        res.header('path-1', req.route.path)
        next();
      });

      app.get('/user/:id/edit', function (req: any, res: any){
        res.header('path-2', req.route.path)
        res.end();
      });

      request(app)
        .get('/user/12/edit')
        .expect('path-1', '/user/:id{/:op}')
        .expect('path-2', '/user/:id/edit')
        .expect(200, done)
    })
  })
})
