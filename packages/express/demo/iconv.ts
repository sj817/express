/**
 * Express 字符编码处理演示
 *
 * 本示例展示如何处理非 UTF-8 编码的请求体
 *
 * 注意: Express 默认只支持 UTF-8 编码
 * 如果需要处理其他编码(如 GBK, Big5 等),需要使用自定义中间件
 */

import express from '../src/index'
import type { Request, Response, NextFunction } from '../src/index'
import iconv from 'iconv-lite'

// 简单的读取 body 函数
async function readBody (req: Request, limit: number = 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('Request entity too large'))
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    req.on('error', reject)
  })
}

const app = express()

/**
 * 字符编码转换中间件
 * 在 body-parser 之前将非 UTF-8 编码转换为 UTF-8
 *
 * @param encoding - 源编码格式 (如 'gbk', 'big5', 'shift_jis' 等)
 */
function charsetConverter (encoding: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 解析 Content-Type 头
    const contentType = req.headers['content-type'] || ''
    const charsetMatch = contentType.match(/charset=([^;]+)/)
    const charset = charsetMatch?.[1]?.toLowerCase()

    // 如果是 UTF-8 或未指定编码，直接跳过
    if (!charset || charset === 'utf-8') {
      return next()
    }

    // 如果不是我们要处理的编码，也跳过
    if (charset !== encoding.toLowerCase()) {
      return next()
    }

    console.log(`检测到 ${charset.toUpperCase()} 编码，开始转换...`)

    try {
      // 读取原始请求体 Buffer
      const buffer = await readBody(req)

      console.log(`原始数据大小: ${buffer.length} 字节`)

      // 使用 iconv-lite 解码
      const text = iconv.decode(buffer, encoding)
      console.log(`解码后文本: ${text.substring(0, 100)}...`)

      // 重新编码为 UTF-8
      const utf8Buffer = Buffer.from(text, 'utf8')
      console.log(`UTF-8 数据大小: ${utf8Buffer.length} 字节`)

      // 简化方式: 直接将转换后的数据解析并存入 req.body
      // 这样避免了复杂的流替换操作

      // 根据 Content-Type 解析数据
      if (contentType.includes('application/json')) {
        req.body = JSON.parse(text)
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        req.body = Object.fromEntries(new URLSearchParams(text))
      } else {
        req.body = text
      }

      // 标记已处理，避免 body-parser 再次处理
      ; (req as any)._body = true

      console.log('编码转换完成!')
      next()
    } catch (err) {
      console.error('编码转换失败:', err)
      next(err)
    }
  }
}

/**
 * 简化版: 直接处理编码并存储到 req.body
 * 适用于简单场景
 */
function simpleCharsetConverter (encoding: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || ''
    const charset = contentType.match(/charset=([^;]+)/)?.[1]?.toLowerCase()

    if (!charset || charset === 'utf-8' || charset !== encoding.toLowerCase()) {
      return next()
    }

    try {
      const buffer = await readBody(req)

      // 解码
      const text = iconv.decode(buffer, encoding)

      // 根据 Content-Type 解析
      if (contentType.includes('application/json')) {
        req.body = JSON.parse(text)
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // 简单的表单解析
        req.body = Object.fromEntries(new URLSearchParams(text))
      } else {
        req.body = text
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

// ============================================
// 使用示例 1: 处理 GBK 编码的 JSON
// ============================================

app.post('/api/gbk-json',
  charsetConverter('gbk'),  // 转换编码并直接解析
  (req, res) => {
    console.log('收到的数据:', req.body)
    res.json({
      success: true,
      message: '成功接收 GBK 编码的数据',
      data: req.body,
    })
  }
)

// ============================================
// 使用示例 2: 处理 Big5 编码的表单
// ============================================

app.post('/api/big5-form',
  charsetConverter('big5'),  // 转换编码并直接解析
  (req, res) => {
    console.log('收到的表单数据:', req.body)
    res.json({
      success: true,
      message: '成功接收 Big5 编码的表单',
      data: req.body,
    })
  }
)

// ============================================
// 使用示例 3: 简化版，直接解析 GBK JSON
// ============================================

app.post('/api/simple-gbk',
  simpleCharsetConverter('gbk'),
  (req, res) => {
    console.log('收到的数据:', req.body)
    res.json({
      success: true,
      data: req.body,
    })
  }
)

// ============================================
// 使用示例 4: 标准 UTF-8 接口（无需额外处理）
// ============================================

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/api/utf8', (req, res) => {
  console.log('收到的 UTF-8 数据:', req.body)
  res.json({
    success: true,
    message: 'UTF-8 数据处理（推荐使用）',
    data: req.body,
  })
})

// ============================================
// 测试端点
// ============================================

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>Express 字符编码处理演示</title>
      </head>
      <body>
        <h1>Express 字符编码处理演示</h1>

        <h2>测试说明</h2>
        <p>本示例展示如何在 Express 中处理非 UTF-8 编码的请求。</p>

        <h3>可用端点:</h3>
        <ul>
          <li>POST /api/utf8 - UTF-8 编码 (推荐)</li>
          <li>POST /api/gbk-json - GBK 编码的 JSON</li>
          <li>POST /api/big5-form - Big5 编码的表单</li>
          <li>POST /api/simple-gbk - GBK 编码 (简化版)</li>
        </ul>

        <h3>测试命令:</h3>
        <pre>
# UTF-8 (推荐)
curl -X POST http://localhost:3000/api/utf8 \\
  -H "Content-Type: application/json; charset=utf-8" \\
  -d '{"name":"张三","message":"你好世界"}'

# GBK 编码 (需要 iconv 工具)
echo '{"name":"张三","message":"你好"}' | iconv -f utf-8 -t gbk | \\
  curl -X POST http://localhost:3000/api/gbk-json \\
  -H "Content-Type: application/json; charset=gbk" \\
  --data-binary @-
        </pre>

        <h3>重要提示:</h3>
        <ul>
          <li>✅ <strong>推荐使用 UTF-8</strong>: 符合现代 Web 标准，无需额外处理</li>
          <li>⚠️ 非 UTF-8 编码: 仅在对接遗留系统时使用</li>
          <li>📦 需要安装 iconv-lite: <code>npm install iconv-lite</code></li>
          <li>🔧 自定义中间件: 可根据实际需求调整转换逻辑</li>
        </ul>
      </body>
    </html>
  `)
})

// ============================================
// 错误处理
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('错误:', err)
  res.status(500).json({
    success: false,
    error: err.message,
  })
})

// ============================================
// 启动服务器
// ============================================

const PORT = process.env.PORT || 9999

app.listen(PORT, () => {
  console.log(`
========================================
Express 字符编码处理演示服务器已启动
========================================

访问地址: http://localhost:${PORT}

端点列表:
  - GET  /                  查看说明页面
  - POST /api/utf8          UTF-8 编码 (推荐)
  - POST /api/gbk-json      GBK 编码的 JSON
  - POST /api/big5-form     Big5 编码的表单
  - POST /api/simple-gbk    GBK 编码 (简化版)

提示:
  现代应用推荐全部使用 UTF-8 编码
  非 UTF-8 仅用于对接无法升级的遗留系统

========================================
  `)
})

export default app
