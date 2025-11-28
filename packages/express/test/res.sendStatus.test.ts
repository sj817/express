import express from '../src/index'
import request from 'supertest'

describe('res', function () {
  describe('.sendStatus(statusCode)', function () {
    it('should send the status code and message as body', function (done: any) {
      const app = express();

      app.use(function (req: any, res: any){
        res.sendStatus(201);
      });

      request(app)
      .get('/')
      .expect(201, 'Created', done);
    })

    it('should work with unknown code', function (done: any) {
      const app = express();

      app.use(function (req: any, res: any){
        res.sendStatus(599);
      });

      request(app)
      .get('/')
      .expect(599, '599', done);
    })

    it('should raise error for invalid status code', function (done: any) {
      const app = express()

      app.use(function (req: any, res: any) {
        res.sendStatus(undefined).end()
      })

      request(app)
        .get('/')
        .expect(500, /TypeError: Invalid status code/, done)
    })
  })
})
