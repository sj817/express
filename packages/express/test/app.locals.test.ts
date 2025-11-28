import assert from 'node:assert'
import express from '../src/index'

describe('app', function(){
  describe('.locals', function () {
    it('should default object with null prototype', function () {
      const app = express()
      assert.ok(app.locals)
      assert.strictEqual(typeof app.locals, 'object')
      assert.strictEqual(Object.getPrototypeOf(app.locals), null)
    })

    describe('.settings', function () {
      it('should contain app settings ', function () {
        const app = express()
        app.set('title', 'Express')
        assert.ok(app.locals.settings)
        assert.strictEqual(typeof app.locals.settings, 'object')
        assert.strictEqual(app.locals.settings, app.settings)
        assert.strictEqual(app.locals.settings.title, 'Express')
      })
    })
  })
})
