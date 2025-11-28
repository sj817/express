/**
 * Module dependencies.
 */

import express from '../..'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import path from 'node:path'
const app = express();
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import methodOverride from 'method-override'
import site from './site'
import post from './post'
import user from './user'

export default app;

// Config

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* istanbul ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  app.use(logger('dev'));
}

app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));

// General

app.get('/', site.index);

// User

app.get('/users', user.list);
app.all('/user/:id{/:op}', user.load);
app.get('/user/:id', user.view);
app.get('/user/:id/view', user.view);
app.get('/user/:id/edit', user.edit);
app.put('/user/:id/edit', user.update);

// Posts

app.get('/posts', post.list);

/* istanbul ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
