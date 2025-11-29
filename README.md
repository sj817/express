# @karinjs/express

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/@karinjs/express.svg)](https://www.npmjs.com/package/@karinjs/express)
[![License](https://img.shields.io/npm/l/@karinjs/express.svg)](https://github.com/sj817/express/blob/main/LICENSE)
[![Node Version](https://img.shields.io/node/v/@karinjs/express.svg)](https://nodejs.org)

**基于 TypeScript 重写的 Express 5.x 框架**

快速、极简、无约束的 Web 框架

[English](./README_EN.md) | 简体中文

</div>

## 📖 项目简介

这是一个完全使用 TypeScript 重写的 Express 5.x 框架，旨在提供更好的类型安全性和开发体验，同时保持与原版 Express 的 API 兼容性。

### 🎯 项目初衷

本项目专为 [github.com/karinjs/karin](https://github.com/karinjs/karin) 优化而开发，针对其特定使用场景进行了深度定制和性能优化。

## ⚠️ 特别声明

> [!WARNING]
> **本项目未经生产环境充分验证，不建议非专业用户使用。**
>
> - 🔴 本项目仍在积极开发中
> - 🔴 未经过大规模生产环境的长期验证
> - 🔴 建议仅在开发和测试环境中使用
> - 🔴 生产环境使用需自行承担风险

## 📋 免责声明

- 本项目按 "原样" 提供，不提供任何明示或暗示的保证
- 使用本项目所产生的任何直接或间接损失，开发者不承担责任
- 本项目基于 Express 5.x 进行重写，但与官方 Express 项目无关
- 在生产环境使用前，请进行充分的测试和评估
- 对于关键业务系统，建议使用经过验证的稳定版本（如官方 Express）

## ✨ 主要特性

- 🎯 **完整的 TypeScript 重写**：核心代码全部使用 TypeScript 编写
- 🔒 **类型安全**：提供完整的类型定义，享受更好的 IDE 智能提示
- 📦 **Monorepo 架构**：使用 pnpm workspace 管理多个相关包
- 🚀 **现代化构建**：使用 tsdown 进行高效打包
- ⚡ **ESM 优先**：原生支持 ES Modules
- 🔄 **API 兼容**：保持与 Express 5.x 的 API 兼容性
- 🧪 **完整测试**：包含大量单元测试和集成测试

## 🏗️ 项目架构

### Monorepo 结构

本项目采用 pnpm workspace 管理，包含以下子包：

```yaml
packages:
  - "packages/path-to-regexp"   # 路径匹配和参数提取
  - "packages/send"              # 文件发送类型定义
  - "packages/connect"           # Connect 中间件类型定义
  - "packages/serve-static"      # 静态文件服务
```

### 核心模块

```
src/
├── application.ts          # Application 类 - 核心应用逻辑
├── express.ts             # Express 工厂函数和导出
├── request.ts             # Request 类 - 扩展的请求对象
├── response.ts            # Response 类 - 扩展的响应对象
├── view.ts                # 视图渲染系统
├── utils.ts               # 工具函数
├── router/                # 路由系统
│   ├── index.ts          # Router 类
│   ├── layer.ts          # 路由层
│   └── route.ts          # Route 类
├── body-parser/           # 请求体解析器
│   └── src/
└── serve-static/          # 静态文件服务实现
    └── index.ts
```

## 🔄 与原版 Express 的主要区别

### 1. **完全的 TypeScript 实现**

- **原版**：JavaScript 实现，通过 `@types/express` 提供类型
- **本项目**：TypeScript 原生实现，类型定义即源码

```typescript
// 更好的类型推导
const app = express()
app.get('/user/:id', (req, res) => {
  // req.params 自动推导类型
  const id = req.params.id // string
  res.json({ id })
})
```

### 2. **模块化架构**

- **原版**：依赖外部 npm 包（如 `path-to-regexp`、`send` 等）
- **本项目**：将核心依赖纳入 monorepo，便于维护和定制

### 3. **现代化的构建系统**

- **原版**：传统的 CommonJS 模块
- **本项目**：
  - 使用 `tsdown` 构建，生成 ESM 格式
  - 支持 Tree-shaking
  - 更小的包体积

```typescript
// tsdown.config.ts
export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  dts: { resolve: true, build: true },
  target: 'node18',
  platform: 'node',
})
```

### 4. **增强的类型系统**

- **Application 类**：完整的类型定义，包括所有 HTTP 方法
- **Request/Response**：泛型支持，更精确的类型推导
- **路由系统**：路径参数、查询参数的类型安全

```typescript
// 泛型支持示例
class Request<
  P = ParamsDictionary,      // 路径参数类型
  ResBody = any,             // 响应体类型
  ReqBody = any,             // 请求体类型
  ReqQuery = ParsedQs,       // 查询参数类型
  LocalsObj = Record<string, any>  // 本地变量类型
> extends IncomingMessage
```

### 5. **内置模块重写**

#### Router 模块

- 完全 TypeScript 重写
- 更好的路由匹配性能
- 类型安全的中间件链

#### Body Parser

- 集成到核心，无需单独安装
- TypeScript 原生实现
- 支持 JSON、URL-encoded、Raw、Text 等格式

#### Serve Static

- 静态文件服务的 TypeScript 实现
- 更好的错误处理
- 内置安全特性

### 6. **改进的错误处理**

```typescript
// Application.status() - 更严格的状态码验证
status(code: StatusCode): this {
  if (!Number.isInteger(code)) {
    throw new TypeError(`Invalid status code: ${JSON.stringify(code)}`)
  }
  if (code < 100 || code > 999) {
    throw new RangeError(`Invalid status code: ${JSON.stringify(code)}`)
  }
  this.statusCode = code
  return this
}
```

### 7. **优化的开发体验**

- **路径别名配置**：

```json
{
  "paths": {
    "router": ["./src/router/index.ts"],
    "body-parser": ["./src/body-parser/src/index.ts"],
    "serve-static": ["./src/serve-static/index.ts"]
  }
}
```

- **统一的测试框架**：所有模块使用 Mocha + TypeScript
- **现代化的工具链**：ESLint、TypeScript 5.x

## 📦 安装

```bash
npm install @karinjs/express
# 或
pnpm add @karinjs/express
# 或
yarn add @karinjs/express
```

## 🚀 快速开始

```typescript
import express from '@karinjs/express'

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})
```

## 💡 核心改进点

### 1. 类型安全的中间件

```typescript
import { RequestHandler } from '@karinjs/express'

const authMiddleware: RequestHandler = (req, res, next) => {
  // 完整的类型提示
  const token = req.get('Authorization')
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
```

### 2. 泛型路由处理

```typescript
interface UserParams {
  id: string
}

interface UserBody {
  name: string
  email: string
}

app.post<UserParams, any, UserBody>('/user/:id', (req, res) => {
  const { id } = req.params  // 类型: { id: string }
  const { name, email } = req.body  // 类型: { name: string, email: string }
  res.json({ id, name, email })
})
```

### 3. 内置 Body Parser

```typescript
// 无需额外安装 body-parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/api/data', (req, res) => {
  console.log(req.body)  // 自动解析
  res.json({ received: true })
})
```

### 4. 静态文件服务

```typescript
// 使用内置的 serve-static
app.use(express.static('public'))
app.use('/static', express.static('assets'))
```

## 📚 API 文档

本项目保持与 Express 5.x 的 API 兼容性。主要的 API 包括：

### Application

- `app.get(path, ...handlers)`
- `app.post(path, ...handlers)`
- `app.put(path, ...handlers)`
- `app.delete(path, ...handlers)`
- `app.use([path], ...middleware)`
- `app.listen(port, [callback])`
- `app.set(setting, value)`
- `app.engine(ext, callback)`
- `app.render(view, [locals], callback)`

### Request

- `req.params` - 路径参数
- `req.query` - 查询参数
- `req.body` - 请求体
- `req.get(field)` - 获取请求头
- `req.accepts(types)` - 内容协商
- `req.is(type)` - 检查 Content-Type

### Response

- `res.status(code)` - 设置状态码
- `res.send(body)` - 发送响应
- `res.json(obj)` - 发送 JSON
- `res.redirect([status], url)` - 重定向
- `res.render(view, [locals], [callback])` - 渲染视图
- `res.sendFile(path, [options], [callback])` - 发送文件

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行特定模块测试
pnpm test:router
pnpm test:body-parser
pnpm test:serve-static

# 运行验收测试
pnpm test:acceptance

# 生成覆盖率报告
pnpm test-cov
```

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/sj817/express.git
cd express

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行 Lint
pnpm lint

# 修复 Lint 问题
pnpm lint:fix
```

## 📋 为什么要重写？

### 1. **类型安全**

原版 Express 的类型定义存在于 `@types/express`，与实现分离，容易出现类型不匹配的问题。TypeScript 原生实现可以确保类型与代码完全一致。

### 2. **更好的维护性**

Monorepo 架构使得核心依赖都在一个仓库中，便于整体维护和优化，减少版本不兼容的风险。

### 3. **现代化特性**

- 原生 ESM 支持
- 更小的包体积（Tree-shaking）
- 更好的构建性能（tsdown）

### 4. **学习和定制**

完全掌握代码实现，方便根据项目需求进行定制和优化。

### 5. **性能优化**

- 减少依赖层级
- 优化的路由匹配算法
- 更高效的类型推导

## 🎯 项目目标

- ✅ 完整的 TypeScript 重写
- ✅ 保持 API 兼容性
- ✅ Monorepo 架构
- ✅ 完整的测试覆盖
- ✅ 现代化构建系统
- 🚧 性能优化
- 🚧 更多示例和文档

## 📄 许可证

[MIT](./LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📦 打包产物

本项目使用 [`tsdown`](https://tsdown.dev) 进行打包，最终产物为**零依赖**的纯 ESM 模块：

```
✨ 打包产物信息:
ℹ dist/index.mjs   904.62 kB │ gzip: 278.74 kB
ℹ dist/index.d.ts   75.65 kB │ gzip:  20.25 kB
ℹ 2 files, total: 980.27 kB

📊 对比数据:
源包大小: 2.2MB / 65 packages (数据来源: https://pkg-size.dev/express)
打包后: 980.27 kB / 0 dependencies ⚡
```

### 🎯 零依赖优势

打包后的代码完全独立运行，无需安装任何额外依赖：

- ✅ **部署简单**：无需担心依赖版本冲突
- ✅ **体积更小**：打包后仅 980 KB（压缩后 278 KB）
- ✅ **安全可靠**：减少供应链攻击风险
- ✅ **性能优化**：减少模块加载开销

### 🚀 ESM 现代化

由于采用 ESM 格式，代码可完全参与任何现代化打包器的优化：

- 🌲 **Tree-shaking**：自动移除未使用的代码
- 📦 **打包器友好**：完美支持 Vite、Rollup、esbuild、webpack 等
- 🔒 **类型完整**：包含完整的 TypeScript 类型定义
- ⚡ **按需加载**：支持动态 import 和代码分割

**妈妈再也不用担心打包器无法处理 Express 啦！** 🎉

## 🙏 致谢

本项目基于 [Express](https://github.com/expressjs/express) 进行重写，感谢 Express 团队及所有贡献者的杰出工作。

### 上游核心依赖

本项目将以下核心依赖整合到 Monorepo 中，并进行了 TypeScript 重写：

#### 路由与中间件

- **[path-to-regexp](https://github.com/pillarjs/path-to-regexp)** (v8.3.0) - 路径匹配和参数提取
- **[router](https://github.com/pillarjs/router)** (v2.2.0) - HTTP 路由系统
- **[@types/connect](https://www.npmjs.com/package/@types/connect)** (v3.4.38) - Connect 中间件类型定义

#### 静态文件服务

- **[serve-static](https://github.com/expressjs/serve-static)** (v2.2.0) - 静态文件服务
- **[@types/send](https://www.npmjs.com/package/@types/send)** (v1.2.1) - 文件发送类型定义

#### 请求体解析

- **[body-parser](https://github.com/expressjs/body-parser)** - 请求体解析器（已整合重写）
  - JSON 解析
  - URL-encoded 解析
  - Raw 解析
  - Text 解析

### 运行时依赖库

以下依赖库在打包时被内联，最终产物为零依赖：

#### HTTP 工具

- **[accepts](https://github.com/jshttp/accepts)** - 内容协商
- **[content-disposition](https://github.com/jshttp/content-disposition)** - Content-Disposition 头处理
- **[content-type](https://github.com/jshttp/content-type)** - Content-Type 解析
- **[cookie](https://github.com/jshttp/cookie)** - Cookie 解析和序列化
- **[cookie-signature](https://github.com/tj/node-cookie-signature)** - Cookie 签名
- **[encodeurl](https://github.com/pillarjs/encodeurl)** - URL 编码
- **[escape-html](https://github.com/component/escape-html)** - HTML 转义
- **[etag](https://github.com/jshttp/etag)** - ETag 生成
- **[fresh](https://github.com/jshttp/fresh)** - HTTP 缓存验证
- **[http-errors](https://github.com/jshttp/http-errors)** - HTTP 错误创建
- **[merge-descriptors](https://github.com/component/merge-descriptors)** - 对象属性合并
- **[methods](https://github.com/jshttp/methods)** - HTTP 方法列表
- **[mime-types](https://github.com/jshttp/mime-types)** - MIME 类型解析
- **[on-finished](https://github.com/jshttp/on-finished)** - HTTP 响应完成检测
- **[parseurl](https://github.com/pillarjs/parseurl)** - URL 解析
- **[proxy-addr](https://github.com/jshttp/proxy-addr)** - 代理地址解析
- **[qs](https://github.com/karinjs/qs)** - 查询字符串解析（使用 @karinjs/qs）
- **[range-parser](https://github.com/jshttp/range-parser)** - Range 头解析
- **[safe-buffer](https://github.com/feross/safe-buffer)** - 安全的 Buffer API
- **[send](https://github.com/pillarjs/send)** - 文件发送
- **[statuses](https://github.com/jshttp/statuses)** - HTTP 状态码
- **[type-is](https://github.com/jshttp/type-is)** - Content-Type 检测
- **[vary](https://github.com/jshttp/vary)** - Vary 头处理

#### 工具库

- **[bytes](https://github.com/visionmedia/bytes.js)** - 字节大小解析
- **[debug](https://github.com/debug-js/debug)** - 调试工具
- **[depd](https://github.com/dougwilson/nodejs-depd)** - 弃用警告
- **[finalhandler](https://github.com/pillarjs/finalhandler)** - 最终请求处理器
- **[iconv-lite](https://github.com/ashtuchkin/iconv-lite)** - 字符编码转换
- **[raw-body](https://github.com/stream-utils/raw-body)** - 原始请求体读取

### 开发工具

#### 构建与类型

- **[TypeScript](https://www.typescriptlang.org/)** (v5.9.3) - TypeScript 编译器
- **[tsdown](https://tsdown.dev)** (v0.16.7) - 高性能 TypeScript 打包工具
- **[tsx](https://github.com/privatenumber/tsx)** - TypeScript 执行器

#### 测试框架

- **[Mocha](https://mochajs.org/)** - 测试框架
- **[nyc](https://github.com/istanbuljs/nyc)** - 代码覆盖率工具
- **[supertest](https://github.com/visionmedia/supertest)** - HTTP 断言库

#### 代码质量

- **[ESLint](https://eslint.org/)** - 代码检查工具
- **[neostandard](https://github.com/neostandard/neostandard)** - 现代 JavaScript 标准
- **[depcheck](https://github.com/depcheck/depcheck)** - 依赖检查工具

### 特别感谢

- **[TJ Holowaychuk](https://github.com/tj)** - Express 和众多 Node.js 生态库的创始人
- **[Douglas Wilson](https://github.com/dougwilson)** - Express 核心维护者
- **[Express 团队](https://github.com/expressjs)** - 维护 Express 及相关生态
- **[jshttp 组织](https://github.com/jshttp)** - 提供众多 HTTP 工具库
- **[pillarjs 组织](https://github.com/pillarjs)** - 提供路由和中间件基础设施

## 📮 联系方式

- GitHub: [sj817/express](https://github.com/sj817/express)
- npm: [@karinjs/express](https://www.npmjs.com/package/@karinjs/express)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

</div>
