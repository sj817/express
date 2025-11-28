/*!
 * express
 * Test for native utility functions
 */

'use strict'

import assert from 'node:assert'
import { describe, it } from 'node:test'
import { encodeUrl, escapeHtml, getStatusMessage } from '../src/utils'

describe('Native Utility Functions', function () {
  describe('encodeUrl()', function () {
    it('should encode URLs correctly', function () {
      assert.strictEqual(encodeUrl('http://example.com/foo bar'), 'http://example.com/foo%20bar')
    })

    it('should encode special characters', function () {
      assert.strictEqual(encodeUrl('http://example.com/<script>'), 'http://example.com/%3Cscript%3E')
    })

    it('should encode quotes', function () {
      assert.strictEqual(encodeUrl('http://example.com/"test"'), 'http://example.com/%22test%22')
    })

    it('should not encode brackets (matches encodeurl behavior)', function () {
      assert.strictEqual(encodeUrl('http://example.com/[test]'), 'http://example.com/[test]')
    })

    it('should not encode backslash (matches encodeurl behavior)', function () {
      assert.strictEqual(encodeUrl('http://example.com/\\test'), 'http://example.com/\\test')
    })

    it('should encode caret, backtick, and pipe', function () {
      assert.strictEqual(encodeUrl('http://example.com/^test'), 'http://example.com/%5Etest')
      assert.strictEqual(encodeUrl('http://example.com/`test'), 'http://example.com/%60test')
      assert.strictEqual(encodeUrl('http://example.com/|test'), 'http://example.com/%7Ctest')
    })

    it('should encode curly braces', function () {
      assert.strictEqual(encodeUrl('http://example.com/{test}'), 'http://example.com/%7Btest%7D')
    })

    it('should handle already encoded URLs', function () {
      assert.strictEqual(encodeUrl('http://example.com/foo%20bar'), 'http://example.com/foo%20bar')
    })

    it('should handle empty string', function () {
      assert.strictEqual(encodeUrl(''), '')
    })
  })

  describe('escapeHtml()', function () {
    it('should escape ampersand', function () {
      assert.strictEqual(escapeHtml('foo & bar'), 'foo &amp; bar')
    })

    it('should escape less than', function () {
      assert.strictEqual(escapeHtml('foo < bar'), 'foo &lt; bar')
    })

    it('should escape greater than', function () {
      assert.strictEqual(escapeHtml('foo > bar'), 'foo &gt; bar')
    })

    it('should escape double quote', function () {
      assert.strictEqual(escapeHtml('foo " bar'), 'foo &quot; bar')
    })

    it('should escape single quote', function () {
      assert.strictEqual(escapeHtml("foo ' bar"), 'foo &#39; bar')
    })

    it('should escape script tags', function () {
      assert.strictEqual(escapeHtml('<script>alert("XSS")</script>'), '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
    })

    it('should escape all special characters together', function () {
      assert.strictEqual(escapeHtml('<div class="test" id=\'foo\'>A & B</div>'), '&lt;div class=&quot;test&quot; id=&#39;foo&#39;&gt;A &amp; B&lt;/div&gt;')
    })

    it('should handle empty string', function () {
      assert.strictEqual(escapeHtml(''), '')
    })

    it('should handle string without special characters', function () {
      assert.strictEqual(escapeHtml('Hello World'), 'Hello World')
    })

    it('should handle numbers', function () {
      assert.strictEqual(escapeHtml('123'), '123')
    })
  })

  describe('getStatusMessage()', function () {
    it('should return correct message for 200', function () {
      assert.strictEqual(getStatusMessage(200), 'OK')
    })

    it('should return correct message for 201', function () {
      assert.strictEqual(getStatusMessage(201), 'Created')
    })

    it('should return correct message for 204', function () {
      assert.strictEqual(getStatusMessage(204), 'No Content')
    })

    it('should return correct message for 301', function () {
      assert.strictEqual(getStatusMessage(301), 'Moved Permanently')
    })

    it('should return correct message for 302', function () {
      assert.strictEqual(getStatusMessage(302), 'Found')
    })

    it('should return correct message for 304', function () {
      assert.strictEqual(getStatusMessage(304), 'Not Modified')
    })

    it('should return correct message for 400', function () {
      assert.strictEqual(getStatusMessage(400), 'Bad Request')
    })

    it('should return correct message for 404', function () {
      assert.strictEqual(getStatusMessage(404), 'Not Found')
    })

    it('should return correct message for 500', function () {
      assert.strictEqual(getStatusMessage(500), 'Internal Server Error')
    })

    it('should return undefined for unknown status code', function () {
      assert.strictEqual(getStatusMessage(999), undefined)
    })

    it('should return correct message for 599', function () {
      // Node.js doesn't have a standard message for 599, should return undefined
      assert.strictEqual(getStatusMessage(599), undefined)
    })
  })
})
