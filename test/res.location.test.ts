import express from '../src/index'
import request from 'supertest'
import assert from 'node:assert'
const url = await import('node:url')

describe('res', function(){
  describe('.location(url)', function(){
    it('should set the header', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.location('http://google.com/').end();
      });

      request(app)
      .get('/')
      .expect('Location', 'http://google.com/')
      .expect(200, done)
    })

    it('should preserve trailing slashes when not present', function (done: any){
      const app = express();

      app.use(function (req: any, res: any){
        res.location('http://google.com').end();
      });

      request(app)
      .get('/')
      .expect('Location', 'http://google.com')
      .expect(200, done)
    })

    it('should encode "url"', function (done: any) {
      const app = express()

      app.use(function (req: any, res: any) {
        res.location('https://google.com?q=\u2603 §10').end()
      })

      request(app)
      .get('/')
      .expect('Location', 'https://google.com?q=%E2%98%83%20%C2%A710')
      .expect(200, done)
    })

    it('should encode data uri1', function (done: any) {
      const app = express()
      app.use(function (req: any, res: any) {
        res.location('data:text/javascript,export default () => { }').end();
      });

      request(app)
        .get('/')
        .expect('Location', 'data:text/javascript,export%20default%20()%20=%3E%20%7B%20%7D')
        .expect(200, done)
    })

    it('should encode data uri2', function (done: any) {
      const app = express()
      app.use(function (req: any, res: any) {
        res.location('data:text/javascript,export default () => { }').end();
      });

      request(app)
        .get('/')
        .expect('Location', 'data:text/javascript,export%20default%20()%20=%3E%20%7B%20%7D')
        .expect(200, done)
    })

    it('should consistently handle non-string input: boolean', function (done: any) {
      const app = express()
      app.use(function (req: any, res: any) {
        res.location(true).end();
      });

      request(app)
        .get('/')
        .expect('Location', 'true')
        .expect(200, done)
    });

    it('should consistently handle non-string inputs: object', function (done: any) {
      const app = express()
      app.use(function (req: any, res: any) {
        res.location({}).end();
      });

      request(app)
        .get('/')
        .expect('Location', '[object%20Object]')
        .expect(200, done)
    });

    it('should consistently handle non-string inputs: array', function (done: any) {
      const app = express()
      app.use(function (req: any, res: any) {
        res.location([]).end();
      });

      request(app)
        .get('/')
        .expect('Location', '')
        .expect(200, done)
    });

    it('should consistently handle empty string input', function (done: any) {
      const app = express()
      app.use(function (req: any, res: any) {
        res.location('').end();
      });

      request(app)
        .get('/')
        .expect('Location', '')
        .expect(200, done)
    });


    if (typeof URL !== 'undefined') {
      it('should accept an instance of URL', function (done: any) {
        const app = express();

        app.use(function (req: any, res: any){
          res.location(new URL('http://google.com/')).end();
        });

        request(app)
          .get('/')
          .expect('Location', 'http://google.com/')
          .expect(200, done);
      });
    }
  })

  describe('location header encoding', function() {
    function createRedirectServerForDomain (domain) {
      const app = express();
      app.use(function (req: any, res: any) {
        const host = url.parse(req.query.q, false, true).host;
        // This is here to show a basic check one might do which
        // would pass but then the location header would still be bad
        if (host !== domain) {
          res.status(400).end('Bad host: ' + host + ' !== ' + domain);
        }
        res.location(req.query.q).end();
      });
      return app;
    }

    function testRequestedRedirect (app, inputUrl, expected, expectedHost, done) {
      return request(app)
        // Encode uri because old supertest does not and is required
        // to test older node versions. New supertest doesn't re-encode
        // so this works in both.
        .get('/?q=' + encodeURIComponent(inputUrl))
        .expect('') // No body.
        .expect(200)
        .expect('Location', expected)
        .end(function (err: any, res: any) {
          if (err) {
            console.log('headers:', res.headers)
            console.error('error', res.error, err);
            return done(err, res);
          }

          // Parse the hosts from the input URL and the Location header
          const inputHost = url.parse(inputUrl, false, true).host;
          const locationHost = url.parse(res.headers['location'], false, true).host;

          assert.strictEqual(locationHost, expectedHost);

          // Assert that the hosts are the same
          if (inputHost !== locationHost) {
            return done(new Error('Hosts do not match: ' + inputHost + " !== " +  locationHost));
          }

          return done(null, res);
        });
    }

    it('should not touch already-encoded sequences in "url"', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'https://google.com?q=%A710',
        'https://google.com?q=%A710',
        'google.com',
        done
      );
    });

    it('should consistently handle relative urls', function (done: any) {
      const app = createRedirectServerForDomain(null);
      testRequestedRedirect(
        app,
        '/foo/bar',
        '/foo/bar',
        null,
        done
      );
    });

    it('should not encode urls in such a way that they can bypass redirect allow lists', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'http://google.com\\@apple.com',
        'http://google.com\\@apple.com',
        'google.com',
        done
      );
    });

    it('should not be case sensitive', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'HTTP://google.com\\@apple.com',
        'HTTP://google.com\\@apple.com',
        'google.com',
        done
      );
    });

    it('should work with https', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'https://google.com\\@apple.com',
        'https://google.com\\@apple.com',
        'google.com',
        done
      );
    });

    it('should correctly encode schemaless paths', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        '//google.com\\@apple.com/',
        '//google.com\\@apple.com/',
        'google.com',
        done
      );
    });

    it('should keep backslashes in the path', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'https://google.com/foo\\bar\\baz',
        'https://google.com/foo\\bar\\baz',
        'google.com',
        done
      );
    });

    it('should escape header splitting for old node versions', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'http://google.com\\@apple.com/%0d%0afoo:%20bar',
        'http://google.com\\@apple.com/%0d%0afoo:%20bar',
        'google.com',
        done
      );
    });

    it('should encode unicode correctly', function (done: any) {
      const app = createRedirectServerForDomain(null);
      testRequestedRedirect(
        app,
        '/%e2%98%83',
        '/%e2%98%83',
        null,
        done
      );
    });

    it('should encode unicode correctly even with a bad host', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'http://google.com\\@apple.com/%e2%98%83',
        'http://google.com\\@apple.com/%e2%98%83',
        'google.com',
        done
      );
    });

    it('should work correctly despite using deprecated url.parse', function (done: any) {
      const app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'https://google.com\'.bb.com/1.html',
        'https://google.com\'.bb.com/1.html',
        'google.com',
        done
      );
    });

    it('should encode file uri path', function (done: any) {
      const app = createRedirectServerForDomain('');
      testRequestedRedirect(
        app,
        'file:///etc\\passwd',
        'file:///etc\\passwd',
        '',
        done
      );
    });
  });
})
