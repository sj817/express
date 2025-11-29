import express from '../src/index'
import request from 'supertest'

describe('req', function(){
  describe('.path', function(){
    it('should return the parsed pathname', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.end(req.path);
      });

      request(app)
      .get('/login?redirect=/post/1/comments')
      .expect('/login', done);
    })
  })
})
