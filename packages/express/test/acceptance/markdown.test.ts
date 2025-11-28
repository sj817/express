
import requireHelper from '../support/require-helper.js'
const app = import('../../examples/markdown.ts')
import request from 'supertest'

describe('markdown', function(){
  describe('GET /', function(){
    it('should respond with html', function (done: any){
      request(app)
        .get('/')
        .expect(/<h1[^>]*>Markdown Example<\/h1>/,done)
    })
  })

  describe('GET /fail',function(){
    it('should respond with an error', function (done: any){
      request(app)
        .get('/fail')
        .expect(500,done)
    })
  })
})
