import express from '../src/index'
import request from 'supertest'

describe('req', function(){
  describe('.baseUrl', function(){
    it('should be empty for top-level route', function (done: any){
      const app = express()

      app.get('/:a', function (req: any, res: any){
        res.end(req.baseUrl)
      })

      request(app)
      .get('/foo')
      .expect(200, '', done)
    })

    it('should contain lower path', function (done: any){
      const app = express()
      const sub = express.Router()

      sub.get('/:b', function (req: any, res: any){
        res.end(req.baseUrl)
      })
      app.use('/:a', sub)

      request(app)
      .get('/foo/bar')
      .expect(200, '/foo', done);
    })

    it('should contain full lower path', function (done: any){
      const app = express()
      const sub1 = express.Router()
      const sub2 = express.Router()
      const sub3 = express.Router()

      sub3.get('/:d', function (req: any, res: any){
        res.end(req.baseUrl)
      })
      sub2.use('/:c', sub3)
      sub1.use('/:b', sub2)
      app.use('/:a', sub1)

      request(app)
      .get('/foo/bar/baz/zed')
      .expect(200, '/foo/bar/baz', done);
    })

    it('should travel through routers correctly', function (done: any){
      const urls = []
      const app = express()
      const sub1 = express.Router()
      const sub2 = express.Router()
      const sub3 = express.Router()

      sub3.get('/:d', function (req: any, res: any, next: any){
        urls.push('0@' + req.baseUrl)
        next()
      })
      sub2.use('/:c', sub3)
      sub1.use('/', function (req: any, res: any, next: any){
        urls.push('1@' + req.baseUrl)
        next()
      })
      sub1.use('/bar', sub2)
      sub1.use('/bar', function (req: any, res: any, next: any){
        urls.push('2@' + req.baseUrl)
        next()
      })
      app.use(function (req: any, res: any, next: any){
        urls.push('3@' + req.baseUrl)
        next()
      })
      app.use('/:a', sub1)
      app.use(function (req: any, res: any, next: any){
        urls.push('4@' + req.baseUrl)
        res.end(urls.join(','))
      })

      request(app)
      .get('/foo/bar/baz/zed')
      .expect(200, '3@,1@/foo,0@/foo/bar/baz,2@/foo/bar,4@', done);
    })
  })
})
