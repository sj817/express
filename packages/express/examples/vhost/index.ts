/**
 * Module dependencies.
 */

import express from '../..'
import logger from 'morgan'
import vhost from 'vhost'

/*
edit /etc/hosts:

127.0.0.1       foo.example.com
127.0.0.1       bar.example.com
127.0.0.1       example.com
*/

// Main server app

const main = express();

if (import.meta.url === `file://${process.argv[1]}`) main.use(logger('dev'));

main.get('/', function(req, res){
  res.send('Hello from main app!');
});

main.get('/:sub', function(req, res){
  res.send('requested ' + req.params.sub);
});

// Redirect app

const redirect = express();

redirect.use(function(req, res){
  if (import.meta.url === `file://${process.argv[1]}`) console.log(req.vhost);
  res.redirect('http://example.com:3000/' + req.vhost[0]);
});

// Vhost app

const app = export default express();

app.use(vhost('*.example.com', redirect)); // Serves all subdomains via Redirect app
app.use(vhost('example.com', main)); // Serves top level domain via Main server app

/* istanbul ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
