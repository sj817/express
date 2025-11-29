import assert from 'node:assert'
import bodyParser from '../src/index.js'

describe('bodyParser()', function () {
  it('should throw an error', function () {
    assert.throws(bodyParser, /bodyParser\(\) generic has been split/)
  })
})
