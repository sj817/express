import express from '../../src/index.js'
const app = export default express();
import users from './db'

// so either you can deal with different types of formatting
// for expected response in index.js
app.get('/', function(req, res){
  res.format({
    html: function(){
      res.send('<ul>' + users.map(function(user){
        return '<li>' + user.name + '</li>';
      }).join('') + '</ul>');
    },

    text: function(){
      res.send(users.map(function(user){
        return ' - ' + user.name + '\n';
      }).join(''));
    },

    json: function(){
      res.json(users);
    }
  });
});

// or you could write a tiny middleware like
// this to add a layer of abstraction
// and make things a bit more declarative:

function format(path) {
  const obj = require(path);
  return function(req, res){
    res.format(obj);
  };
}

app.get('/users', format('./users'));

/* istanbul ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
