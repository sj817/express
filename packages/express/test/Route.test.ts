import after from 'after'
import assert from 'node:assert'
import express from '../src/index'
import { methods } from '../src/utils'

const Route = express.Route

describe('Route', function () {
  it('should work without handlers', function (done: any) {
    const req = { method: 'GET', url: '/' }
    const route = new Route('/foo')
    route.dispatch(req, {}, done)
  })

  it('should not stack overflow with a large sync stack', function (done: any) {
    this.timeout(5000) // long-running test

    const req = { method: 'GET', url: '/' }
    const route = new Route('/foo')

    route.get(function (req: any, res: any, next: any) {
      req.counter = 0
      next()
    })

    for (let i = 0; i < 6000; i++) {
      route.all(function (req: any, res: any, next: any) {
        req.counter++
        next()
      })
    }

    route.get(function (req: any, res: any, next: any) {
      req.called = true
      next()
    })

    route.dispatch(req, {}, function (err: any) {
      if (err) return done(err)
      assert.ok(req.called)
      assert.strictEqual(req.counter, 6000)
      done()
    })
  })

  describe('.all', function () {
    it('should add handler', function (done: any) {
      const req = { method: 'GET', url: '/' }
      const route = new Route('/foo')

      route.all(function (req: any, res: any, next: any) {
        req.called = true
        next()
      })

      route.dispatch(req, {}, function (err: any) {
        if (err) return done(err)
        assert.ok(req.called)
        done()
      })
    })

    it('should handle VERBS', function (done: any) {
      let count = 0
      const route = new Route('/foo')
      const cb = after(methods.length, function (err: any) {
        if (err) return done(err)
        assert.strictEqual(count, methods.length)
        done()
      })

      route.all(function (req: any, res: any, next: any) {
        count++
        next()
      })

      methods.forEach(function testMethod(method) {
        const req = { method: method, url: '/' }
        route.dispatch(req, {}, cb)
      })
    })

    it('should stack', function (done: any) {
      const req = { count: 0, method: 'GET', url: '/' }
      const route = new Route('/foo')

      route.all(function (req: any, res: any, next: any) {
        req.count++
        next()
      })

      route.all(function (req: any, res: any, next: any) {
        req.count++
        next()
      })

      route.dispatch(req, {}, function (err: any) {
        if (err) return done(err)
        assert.strictEqual(req.count, 2)
        done()
      })
    })
  })

  describe('.VERB', function () {
    it('should support .get', function (done: any) {
      const req = { method: 'GET', url: '/' }
      const route = new Route('')

      route.get(function (req: any, res: any, next: any) {
        req.called = true
        next()
      })

      route.dispatch(req, {}, function (err: any) {
        if (err) return done(err)
        assert.ok(req.called)
        done()
      })
    })

    it('should limit to just .VERB', function (done: any) {
      const req = { method: 'POST', url: '/' }
      const route = new Route('')

      route.get(function () {
        throw new Error('not me!')
      })

      route.post(function (req: any, res: any, next: any) {
        req.called = true
        next()
      })

      route.dispatch(req, {}, function (err: any) {
        if (err) return done(err)
        assert.ok(req.called)
        done()
      })
    })

    it('should allow fallthrough', function (done: any) {
      const req = { order: '', method: 'GET', url: '/' }
      const route = new Route('')

      route.get(function (req: any, res: any, next: any) {
        req.order += 'a'
        next()
      })

      route.all(function (req: any, res: any, next: any) {
        req.order += 'b'
        next()
      })

      route.get(function (req: any, res: any, next: any) {
        req.order += 'c'
        next()
      })

      route.dispatch(req, {}, function (err: any) {
        if (err) return done(err)
        assert.strictEqual(req.order, 'abc')
        done()
      })
    })
  })

  describe('errors', function () {
    it('should handle errors via arity 4 functions', function (done: any) {
      const req = { order: '', method: 'GET', url: '/' }
      const route = new Route('')

      route.all(function (req: any, res: any, next: any) {
        next(new Error('foobar'))
      })

      route.all(function (req: any, res: any, next: any) {
        req.order += '0'
        next()
      })

      route.all(function (err: any, req: any, res: any, next: any) {
        req.order += 'a'
        next(err)
      })

      route.dispatch(req, {}, function (err: any) {
        assert.ok(err)
        assert.strictEqual(err.message, 'foobar')
        assert.strictEqual(req.order, 'a')
        done()
      })
    })

    it('should handle throw', function (done: any) {
      const req = { order: '', method: 'GET', url: '/' }
      const route = new Route('')

      route.all(function () {
        throw new Error('foobar')
      })

      route.all(function (req: any, res: any, next: any) {
        req.order += '0'
        next()
      })

      route.all(function (err: any, req: any, res: any, next: any) {
        req.order += 'a'
        next(err)
      })

      route.dispatch(req, {}, function (err: any) {
        assert.ok(err)
        assert.strictEqual(err.message, 'foobar')
        assert.strictEqual(req.order, 'a')
        done()
      })
    })

    it('should handle throwing inside error handlers', function (done: any) {
      const req = { method: 'GET', url: '/' }
      const route = new Route('')

      route.get(function () {
        throw new Error('boom!')
      })

      route.get(function (err: any, req: any, res: any, next: any) {
        throw new Error('oops')
      })

      route.get(function (err: any, req: any, res: any, next: any) {
        req.message = err.message
        next()
      })

      route.dispatch(req, {}, function (err: any) {
        if (err) return done(err)
        assert.strictEqual(req.message, 'oops')
        done()
      })
    })

    it('should handle throw in .all', function (done: any) {
      const req = { method: 'GET', url: '/' }
      const route = new Route('')

      route.all(function (req: any, res: any, next: any) {
        throw new Error('boom!')
      })

      route.dispatch(req, {}, function (err: any) {
        assert.ok(err)
        assert.strictEqual(err.message, 'boom!')
        done()
      })
    })

    it('should handle single error handler', function (done: any) {
      const req = { method: 'GET', url: '/' }
      const route = new Route('')

      route.all(function (err: any, req: any, res: any, next: any) {
        // this should not execute
        throw new Error('should not be called')
      })

      route.dispatch(req, {}, done)
    })
  })
})
