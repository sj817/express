import express from '../src/index';
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import path from 'node:path'
import request from 'supertest';
import tmpl from './support/tmpl.js';

describe('res', function(){
  describe('.render(name)', function(){
    it('should support absolute paths', function (done: any){
      const app = createApp();

      app.locals.user = { name: 'tobi' };

      app.use(function (req: any, res: any){
        res.render(path.join(__dirname, 'fixtures', 'user.tmpl'))
      });

      request(app)
      .get('/')
      .expect('<p>tobi</p>', done);
    })

    it('should support absolute paths with "view engine"', function (done: any){
      const app = createApp();

      app.locals.user = { name: 'tobi' };
      app.set('view engine', 'tmpl');

      app.use(function (req: any, res: any){
        res.render(path.join(__dirname, 'fixtures', 'user'))
      });

      request(app)
      .get('/')
      .expect('<p>tobi</p>', done);
    })

    it('should error without "view engine" set and file extension to a non-engine module', function (done: any) {
      const app = createApp()

      app.locals.user = { name: 'tobi' }

      app.use(function (req: any, res: any) {
        res.render(path.join(__dirname, 'fixtures', 'broken.send'))
      })

      request(app)
      .get('/')
      .expect(500, /does not provide a view engine/, done)
    })

    it('should error without "view engine" set and no file extension', function (done: any) {
      const app = createApp();

      app.locals.user = { name: 'tobi' };

      app.use(function (req: any, res: any){
        res.render(path.join(__dirname, 'fixtures', 'user'))
      });

      request(app)
      .get('/')
      .expect(500, /No default engine was specified/, done);
    })

    it('should expose app.locals', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.locals.user = { name: 'tobi' };

      app.use(function (req: any, res: any){
        res.render('user.tmpl');
      });

      request(app)
      .get('/')
      .expect('<p>tobi</p>', done);
    })

    it('should expose app.locals with `name` property', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.locals.name = 'tobi';

      app.use(function (req: any, res: any){
        res.render('name.tmpl');
      });

      request(app)
      .get('/')
      .expect('<p>tobi</p>', done);
    })

    it('should support index.<engine>', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.set('view engine', 'tmpl');

      app.use(function (req: any, res: any){
        res.render('blog/post');
      });

      request(app)
      .get('/')
      .expect('<h1>blog post</h1>', done);
    })

    describe('when an error occurs', function(){
      it('should next(err)', function (done: any){
        const app = createApp();

        app.set('views', path.join(__dirname, 'fixtures'))

        app.use(function (req: any, res: any){
          res.render('user.tmpl');
        });

        app.use(function (err: any, req: any, res: any, next: any){
          res.status(500).send('got error: ' + err.name)
        });

        request(app)
        .get('/')
        .expect(500, 'got error: RenderError', done)
      })
    })

    describe('when "view engine" is given', function(){
      it('should render the template', function (done: any){
        const app = createApp();

        app.set('view engine', 'tmpl');
        app.set('views', path.join(__dirname, 'fixtures'))

        app.use(function (req: any, res: any){
          res.render('email');
        });

        request(app)
        .get('/')
        .expect('<p>This is an email</p>', done);
      })
    })

    describe('when "views" is given', function(){
      it('should lookup the file in the path', function (done: any){
        const app = createApp();

        app.set('views', path.join(__dirname, 'fixtures', 'default_layout'))

        app.use(function (req: any, res: any){
          res.render('user.tmpl', { user: { name: 'tobi' } });
        });

        request(app)
        .get('/')
        .expect('<p>tobi</p>', done);
      })

      describe('when array of paths', function(){
        it('should lookup the file in the path', function (done: any){
          const app = createApp();
          const views = [
            path.join(__dirname, 'fixtures', 'local_layout'),
            path.join(__dirname, 'fixtures', 'default_layout')
          ]

          app.set('views', views);

          app.use(function (req: any, res: any){
            res.render('user.tmpl', { user: { name: 'tobi' } });
          });

          request(app)
          .get('/')
          .expect('<span>tobi</span>', done);
        })

        it('should lookup in later paths until found', function (done: any){
          const app = createApp();
          const views = [
            path.join(__dirname, 'fixtures', 'local_layout'),
            path.join(__dirname, 'fixtures', 'default_layout')
          ]

          app.set('views', views);

          app.use(function (req: any, res: any){
            res.render('name.tmpl', { name: 'tobi' });
          });

          request(app)
          .get('/')
          .expect('<p>tobi</p>', done);
        })
      })
    })
  })

  describe('.render(name, option)', function(){
    it('should render the template', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))

      const user = { name: 'tobi' };

      app.use(function (req: any, res: any){
        res.render('user.tmpl', { user: user });
      });

      request(app)
      .get('/')
      .expect('<p>tobi</p>', done);
    })

    it('should expose app.locals', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.locals.user = { name: 'tobi' };

      app.use(function (req: any, res: any){
        res.render('user.tmpl');
      });

      request(app)
      .get('/')
      .expect('<p>tobi</p>', done);
    })

    it('should expose res.locals', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))

      app.use(function (req: any, res: any){
        res.locals.user = { name: 'tobi' };
        res.render('user.tmpl');
      });

      request(app)
      .get('/')
      .expect('<p>tobi</p>', done);
    })

    it('should give precedence to res.locals over app.locals', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.locals.user = { name: 'tobi' };

      app.use(function (req: any, res: any){
        res.locals.user = { name: 'jane' };
        res.render('user.tmpl', {});
      });

      request(app)
      .get('/')
      .expect('<p>jane</p>', done);
    })

    it('should give precedence to res.render() locals over res.locals', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))
      const jane = { name: 'jane' };

      app.use(function (req: any, res: any){
        res.locals.user = { name: 'tobi' };
        res.render('user.tmpl', { user: jane });
      });

      request(app)
      .get('/')
      .expect('<p>jane</p>', done);
    })

    it('should give precedence to res.render() locals over app.locals', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.locals.user = { name: 'tobi' };
      const jane = { name: 'jane' };

      app.use(function (req: any, res: any){
        res.render('user.tmpl', { user: jane });
      });

      request(app)
      .get('/')
      .expect('<p>jane</p>', done);
    })
  })

  describe('.render(name, options, fn)', function(){
    it('should pass the resulting string', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))

      app.use(function (req: any, res: any){
        const tobi = { name: 'tobi' };
        res.render('user.tmpl', { user: tobi }, function (err, html) {
          html = html.replace('tobi', 'loki');
          res.end(html);
        });
      });

      request(app)
      .get('/')
      .expect('<p>loki</p>', done);
    })
  })

  describe('.render(name, fn)', function(){
    it('should pass the resulting string', function (done: any){
      const app = createApp();

      app.set('views', path.join(__dirname, 'fixtures'))

      app.use(function (req: any, res: any){
        res.locals.user = { name: 'tobi' };
        res.render('user.tmpl', function (err, html) {
          html = html.replace('tobi', 'loki');
          res.end(html);
        });
      });

      request(app)
      .get('/')
      .expect('<p>loki</p>', done);
    })

    describe('when an error occurs', function(){
      it('should pass it to the callback', function (done: any){
        const app = createApp();

        app.set('views', path.join(__dirname, 'fixtures'))

        app.use(function (req: any, res: any){
          res.render('user.tmpl', function (err: any) {
            if (err) {
              res.status(500).send('got error: ' + err.name)
            }
          });
        });

        request(app)
        .get('/')
        .expect(500, 'got error: RenderError', done)
      })
    })
  })
})

function createApp() {
  const app = express();

  app.engine('.tmpl', tmpl);

  return app;
}
