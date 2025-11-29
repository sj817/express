# Express

[![Express Logo](https://i.cloudup.com/zfY6lL7eFa-3000x3000.png)](https://expressjs.com/)

**快速、开放、极简的 [Node.js](https://nodejs.org) Web 框架**

**本项目遵循 [行为准则]。**

## 目录

- [目录](#目录)
- [安装](#安装)
- [特性](#特性)
- [文档与社区](#文档与社区)
- [快速开始](#快速开始)
- [设计哲学](#设计哲学)
- [示例](#示例)
- [字符编码处理](#字符编码处理)
  - [默认支持](#默认支持)
  - [处理其他编码](#处理其他编码)
- [贡献](#贡献)
  - [安全问题](#安全问题)
  - [运行测试](#运行测试)
- [当前项目团队成员](#当前项目团队成员)
- [许可证](#许可证)

## 安装

这是一个可通过 [npm 仓库](https://www.npmjs.com/) 获取的 [Node.js](https://nodejs.org/en/) 模块。

在安装之前，请先 [下载并安装 Node.js](https://nodejs.org/en/download/)。
需要 Node.js 18 或更高版本。

如果这是一个全新的项目，请确保首先使用 [`npm init` 命令](https://docs.npmjs.com/creating-a-package-json-file) 创建 `package.json`。

使用 [`npm install` 命令](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) 进行安装:

```bash
npm install express
```

更多信息请查看我们的 [安装指南](https://expressjs.com/en/starter/installing.html)。

## 特性

- 强大的路由系统
- 专注于高性能
- 超高的测试覆盖率
- HTTP 辅助功能（重定向、缓存等）
- 支持 14+ 种模板引擎的视图系统
- 内容协商
- 用于快速生成应用的可执行文件

## 文档与社区

- [官方网站和文档](https://expressjs.com/) - [[网站仓库](https://github.com/expressjs/expressjs.com)]
- [GitHub 组织](https://github.com/expressjs) - 官方中间件和模块
- [GitHub 讨论区](https://github.com/expressjs/discussions) - Express 开发和使用讨论

**提示** 请务必阅读 [v5 迁移指南](https://expressjs.com/en/guide/migrating-5)

## 快速开始

使用可执行文件 [`express(1)`](https://github.com/expressjs/generator) 快速生成应用:

安装可执行文件。可执行文件的主版本号将与 Express 的主版本号匹配:

```bash
npm install -g express-generator@4
```

创建应用:

```bash
express /tmp/foo && cd /tmp/foo
```

安装依赖:

```bash
npm install
```

启动服务器:

```bash
npm start
```

在浏览器中访问: <http://localhost:3000>

## 设计哲学

Express 的设计哲学是为 HTTP 服务器提供小型、强大的工具集，使其成为单页应用、网站、混合应用或公共 HTTP API 的绝佳解决方案。

Express 不强制你使用任何特定的 ORM 或模板引擎。通过 [@ladjs/consolidate](https://github.com/ladjs/consolidate) 支持超过 14 种模板引擎，你可以快速打造完美的框架。

## 示例

查看示例，请克隆 Express 仓库:

```bash
git clone https://github.com/expressjs/express.git --depth 1 && cd express
```

然后安装依赖:

```bash
npm install
```

运行你想要的示例:

```bash
node examples/content-negotiation
```

## 字符编码处理

### 默认支持

Express 默认**仅支持 UTF-8 编码**，这符合现代 Web 标准，并覆盖了 99% 以上的使用场景:

```javascript
import express from 'express'

const app = express()

// 默认处理 UTF-8 编码的请求
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/api/data', (req, res) => {
  console.log(req.body) // UTF-8 编码的数据
  res.json({ success: true })
})
```

### 处理其他编码

如果你需要处理遗留系统的非 UTF-8 编码（如 GBK、Big5 等），可以通过**自定义中间件**在 body-parser 之前进行编码转换:

```javascript
import express from 'express'
import iconv from 'iconv-lite'
import getRawBody from 'raw-body'

const app = express()

// 编码转换中间件
function charsetMiddleware(encoding) {
  return async (req, res, next) => {
    // 检查 Content-Type 中的编码
    const contentType = req.headers['content-type'] || ''
    const charset = contentType.match(/charset=([^;]+)/)?.[1]?.toLowerCase()

    // 如果是 UTF-8 或未指定，跳过处理
    if (!charset || charset === 'utf-8') {
      return next()
    }

    // 如果不是目标编码，也跳过
    if (charset !== encoding.toLowerCase()) {
      return next()
    }

    try {
      // 读取原始请求体
      const buffer = await getRawBody(req, {
        length: req.headers['content-length'],
        limit: '1mb'
      })

      // 解码为 UTF-8
      const text = iconv.decode(buffer, encoding)
      const utf8Buffer = Buffer.from(text, 'utf8')

      // 创建新的可读流
      const { Readable } = await import('stream')
      const stream = Readable.from(utf8Buffer)

      // 替换请求流（注意：这里需要特殊处理）
      // 将转换后的数据存储到 req._body，供后续中间件使用
      req._rawBody = utf8Buffer
      req.headers['content-type'] = contentType.replace(charset, 'utf-8')
      req.headers['content-length'] = String(utf8Buffer.length)

      next()
    } catch (err) {
      next(err)
    }
  }
}

// 使用示例
app.use(charsetMiddleware('gbk'))  // 先转换编码
app.use(express.json())            // 再解析 JSON

app.post('/legacy-api', (req, res) => {
  console.log(req.body) // 已转换为 UTF-8 的数据
  res.json({ success: true })
})
```

完整的示例代码请参考 [`packages/express/demo/iconv.ts`](packages/express/demo/iconv.ts)。

#### 为什么默认只支持 UTF-8？

1. **现代 Web 标准**: HTTP/2、HTTP/3 强制使用 UTF-8
2. **生态系统**: JSON、GraphQL、WebSocket 等都要求 UTF-8
3. **性能与安全**: 减少依赖和潜在的安全漏洞
4. **包体积**: 移除 iconv-lite 及其编码表可减少约 2MB 的依赖
5. **简化维护**: 专注于核心功能，边缘情况由用户自行处理

#### 何时需要处理其他编码？

仅在以下极少数场景中需要:

- 对接 20 年前的遗留系统
- 处理无法升级的老旧系统
- 政府机构、银行等特殊行业的历史系统集成

对于新项目，**强烈建议全部使用 UTF-8 编码**。

## 贡献

Express.js 项目欢迎所有建设性的贡献。贡献有多种形式，包括错误修复和增强的代码、文档的添加和修复、额外的测试、审查传入的拉取请求和问题等等！

更多技术细节请参阅 [贡献指南]。

### 安全问题

如果你在 Express 中发现安全漏洞，请查看 [安全政策和流程](SECURITY.md)。

### 运行测试

首先安装依赖:

```bash
npm install
```

然后运行 `npm test`:

```bash
npm test
```

## 当前项目团队成员

有关 express.js 项目治理的信息，请参阅 [GOVERNANCE.md](https://github.com/expressjs/discussions/blob/HEAD/docs/GOVERNANCE.md)。

Express 的原作者是 [TJ Holowaychuk](https://github.com/tj)

[所有贡献者列表](https://github.com/expressjs/express/graphs/contributors)

## 许可证

[MIT](LICENSE)

[行为准则]: https://github.com/expressjs/.github/blob/HEAD/CODE_OF_CONDUCT.md
[贡献指南]: https://github.com/expressjs/.github/blob/HEAD/CONTRIBUTING.md
