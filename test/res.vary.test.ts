import express from '../src/index';
import request from 'supertest';
import * as utils from './support/utils.js';

describe('res.vary()', function(){
  describe('with no arguments', function(){
    it('should throw error', function (done: any) {
      const app = express();

      app.use(function (req: any, res: any) {
        res.vary();
        res.end();
      });

      request(app)
      .get('/')
      .expect(500, /field.*required/, done)
    })
  })

  describe('with an empty array', function(){
    it('should not set Vary', function (done: any) {
      const app = express();

      app.use(function (req: any, res: any) {
        res.vary([]);
        res.end();
      });

      request(app)
      .get('/')
      .expect(utils.shouldNotHaveHeader('Vary'))
      .expect(200, done);
    })
  })

  describe('with an array', function(){
    it('should set the values', function (done: any) {
      const app = express();

      app.use(function (req: any, res: any) {
        res.vary(['Accept', 'Accept-Language', 'Accept-Encoding']);
        res.end();
      });

      request(app)
      .get('/')
      .expect('Vary', 'Accept, Accept-Language, Accept-Encoding')
      .expect(200, done);
    })
  })

  describe('with a string', function(){
    it('should set the value', function (done: any) {
      const app = express();

      app.use(function (req: any, res: any) {
        res.vary('Accept');
        res.end();
      });

      request(app)
      .get('/')
      .expect('Vary', 'Accept')
      .expect(200, done);
    })
  })

  describe('when the value is present', function(){
    it('should not add it again', function (done: any) {
      const app = express();

      app.use(function (req: any, res: any) {
        res.vary('Accept');
        res.vary('Accept-Encoding');
        res.vary('Accept-Encoding');
        res.vary('Accept-Encoding');
        res.vary('Accept');
        res.end();
      });

      request(app)
      .get('/')
      .expect('Vary', 'Accept, Accept-Encoding')
      .expect(200, done);
    })
  })
})
