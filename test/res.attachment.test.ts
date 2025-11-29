import { Buffer } from 'node:buffer';

import express from '../src/index'
import request from 'supertest'

describe('res', function(){
  describe('.attachment()', function(){
    it('should Content-Disposition to attachment', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.attachment().send('foo');
      });

      request(app)
      .get('/')
      .expect('Content-Disposition', 'attachment', done);
    })
  })

  describe('.attachment(filename)', function(){
    it('should add the filename param', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.attachment('/path/to/image.png');
        res.send('foo');
      });

      request(app)
      .get('/')
      .expect('Content-Disposition', 'attachment; filename="image.png"', done);
    })

    it('should set the Content-Type', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.attachment('/path/to/image.png');
        res.send(Buffer.alloc(4, '.'))
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'image/png', done);
    })
  })

  describe('.attachment(utf8filename)', function(){
    it('should add the filename and filename* params', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.attachment('/locales/日本語.txt');
        res.send('japanese');
      });

      request(app)
      .get('/')
      .expect('Content-Disposition', 'attachment; filename="???.txt"; filename*=UTF-8\'\'%E6%97%A5%E6%9C%AC%E8%AA%9E.txt')
      .expect(200, done);
    })

    it('should set the Content-Type', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.attachment('/locales/日本語.txt');
        res.send('japanese');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'text/plain; charset=utf-8', done);
    })
  })
})
