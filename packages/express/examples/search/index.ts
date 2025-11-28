// install redis first:
// https://redis.io/

// then:
// $ npm install redis
// $ redis-server

/**
 * Module dependencies.
 */

import express from '../..'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import path from 'node:path'
import redis from 'redis'

const db = redis.createClient();

// npm install redis

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// populate search

db.sadd('ferret', 'tobi');
db.sadd('ferret', 'loki');
db.sadd('ferret', 'jane');
db.sadd('cat', 'manny');
db.sadd('cat', 'luna');

/**
 * GET search for :query.
 */

app.get('/search/:query?', function(req, res, next){
  const query = req.params.query;
  db.smembers(query, function(err, vals){
    if (err) return next(err);
    res.send(vals);
  });
});

/**
 * GET client javascript. Here we use sendFile()
 * because serving __dirname with the static() middleware
 * would also mean serving our server "index.js" and the "search.jade"
 * template.
 */

app.get('/client.js', function(req, res){
  res.sendFile(path.join(__dirname, 'client.js'));
});

/* istanbul ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
