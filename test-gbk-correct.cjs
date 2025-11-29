// 使用 Node.js 正确测试 GBK 编码
const http = require('http')
const iconv = require('./packages/body-parser/node_modules/iconv-lite')

// 原始 UTF-8 字符串
const jsonStr = JSON.stringify({
  name: '张三',
  message: '你好世界',
})

console.log('原始 JSON (UTF-8):', jsonStr)

// 转换为 GBK 编码
const gbkBuffer = iconv.encode(jsonStr, 'gbk')
console.log('GBK 字节数:', gbkBuffer.length)
console.log('GBK 字节:', gbkBuffer.toString('hex'))

// 发送请求
const options = {
  hostname: 'localhost',
  port: 9999,
  path: '/api/gbk-json',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=gbk',
    'Content-Length': gbkBuffer.length,
  },
}

const req = http.request(options, (res) => {
  console.log('\n响应状态:', res.statusCode)
  console.log('响应头:', res.headers)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('\n响应内容:')
    console.log(JSON.parse(data))
  })
})

req.on('error', (error) => {
  console.error('错误:', error)
})

req.write(gbkBuffer)
req.end()
