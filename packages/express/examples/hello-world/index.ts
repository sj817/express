import express from '../../src/index.js'

const app = export default express()

app.get('/', function(req, res){
  res.send('Hello World');
});

/* istanbul ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
