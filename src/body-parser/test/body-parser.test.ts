import assert from 'node:assert'
import bodyParser from '../src/index'

describe('bodyParser()', function () {
  it('should throw an error', function () {
    assert.throws(bodyParser, /bodyParser\(\) generic has been split/)
  })
})
