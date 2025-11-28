import express from '../src/index'
import request from 'supertest'

describe('throw after .end()', function(){
  it('should fail gracefully', function (done: any){
    const app = express();

    app.get('/', function (req: any, res: any){
      res.end('yay');
      throw new Error('boom');
    });

    request(app)
    .get('/')
    .expect('yay')
    .expect(200, done);
  })
})
