import assert from 'node:assert'
import express from '../src/index'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function render(path: string, options: any, fn: any) {
  fs.readFile(path, 'utf8', function (err, str) {
    if (err) return fn(err)
    str = str.replace('{{user.name}}', options.user.name)
    fn(null, str)
  })
}

describe('app', function () {
  describe('.engine(ext, fn)', function () {
    it('should map a template engine', function (done) {
      const app = express()

      app.set('views', path.join(__dirname, 'fixtures'))
      app.engine('.html', render)
      app.locals.user = { name: 'tobi' }

      app.render('user.html', function (err: any, str: any) {
        if (err) return done(err)
        assert.strictEqual(str, '<p>tobi</p>')
        done()
      })
    })

    it('should throw when the callback is missing', function () {
      const app = express()
      assert.throws(function () {
        app.engine('.html', null)
      }, /callback function required/)
    })

    it('should work without leading "."', function (done) {
      const app = express()

      app.set('views', path.join(__dirname, 'fixtures'))
      app.engine('html', render)
      app.locals.user = { name: 'tobi' }

      app.render('user.html', function (err: any, str: any) {
        if (err) return done(err)
        assert.strictEqual(str, '<p>tobi</p>')
        done()
      })
    })

    it('should work "view engine" setting', function (done) {
      const app = express()

      app.set('views', path.join(__dirname, 'fixtures'))
      app.engine('html', render)
      app.set('view engine', 'html')
      app.locals.user = { name: 'tobi' }

      app.render('user', function (err: any, str: any) {
        if (err) return done(err)
        assert.strictEqual(str, '<p>tobi</p>')
        done()
      })
    })

    it('should work "view engine" with leading "."', function (done) {
      const app = express()

      app.set('views', path.join(__dirname, 'fixtures'))
      app.engine('.html', render)
      app.set('view engine', '.html')
      app.locals.user = { name: 'tobi' }

      app.render('user', function (err: any, str: any) {
        if (err) return done(err)
        assert.strictEqual(str, '<p>tobi</p>')
        done()
      })
    })
  })
})
