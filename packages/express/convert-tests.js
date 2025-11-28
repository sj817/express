import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const testDir = path.join(__dirname, 'test')

// 转换单个文件
function convertFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const fileName = path.basename(filePath, '.js')
  const newFileName = fileName.endsWith('.test') ? fileName + '.ts' : fileName + '.test.ts'
  const newFilePath = path.join(path.dirname(filePath), newFileName)

  // 基本转换规则
  let converted = content
    // 移除 'use strict'
    .replace(/'use strict'\s*\n\s*/g, '')
    // 转换 require 为 import
    .replace(/var\s+(\w+)\s*=\s*require\(['"]node:assert['"]\)/g, "import assert from 'node:assert'")
    .replace(/var\s+(\w+)\s*=\s*require\(['"]\.\.\/['"]\)/g, "import express from '../src/index'")
    .replace(/var\s+(\w+)\s*=\s*require\(['"]\.\.['"]\)/g, "import express from '../src/index'")
    .replace(/var\s+(\w+)\s*=\s*require\(['"]supertest['"]\)/g, "import request from 'supertest'")
    .replace(/var\s+(\w+)\s*=\s*require\(['"]after['"]\)/g, "import after from 'after'")
    .replace(/var\s+(\w+)\s*=\s*require\(['"]node:fs['"]\)/g, "import fs from 'node:fs'")
    .replace(/var\s+(\w+)\s*=\s*require\(['"]node:path['"]\)/g, "import path from 'node:path'")
    .replace(/var\s+(\w+)\s*=\s*require\(['"]node:http['"]\)/g, "import http from 'node:http'")
    .replace(/var\s+express\s*=\s*require\([^)]+\)\s*,\s*request\s*=\s*require\(['"]supertest['"]\)/g, "import express from '../src/index'\nimport request from 'supertest'")
    // 转换 var 为 const
    .replace(/\bvar\s+(\w+)\s*=/g, 'const $1 =')
    // 添加类型注解到回调函数
    .replace(/function\s*\(req,\s*res,\s*next\)/g, 'function (req: any, res: any, next: any)')
    .replace(/function\s*\(req,\s*res\)/g, 'function (req: any, res: any)')
    .replace(/function\s*\(err,\s*req,\s*res,\s*next\)/g, 'function (err: any, req: any, res: any, next: any)')
    .replace(/function\s*\(err,\s*str\)/g, 'function (err: any, str: any)')
    .replace(/function\s*\(err,\s*res\)/g, 'function (err: any, res: any)')
    .replace(/function\s*\(err\)/g, 'function (err: any)')
    .replace(/function\s*\(done\)/g, 'function (done: any)')

  // 如果需要 __dirname (ESM 中需要特殊处理)
  if (content.includes('__dirname')) {
    const imports = [
      "import { fileURLToPath } from 'node:url'",
      '',
      'const __filename = fileURLToPath(import.meta.url)',
      'const __dirname = path.dirname(__filename)',
      ''
    ].join('\n')

    // 找到第一个 import 之后插入
    const firstImportMatch = converted.match(/^import .+$/m)
    if (firstImportMatch) {
      const insertPos = converted.indexOf(firstImportMatch[0]) + firstImportMatch[0].length
      converted = converted.slice(0, insertPos) + '\n' + imports + converted.slice(insertPos)
    }
  }

  return { newFilePath, content: converted }
}

// 获取所有需要转换的 .js 文件
function getAllJsFiles(dir, exclude = []) {
  const files = []
  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)

    if (item.isDirectory() && !exclude.includes(item.name)) {
      files.push(...getAllJsFiles(fullPath, exclude))
    } else if (item.isFile() && item.name.endsWith('.js') && !item.name.endsWith('.test.ts')) {
      // 检查是否已经有对应的 .test.ts 文件
      const baseName = path.basename(item.name, '.js')
      const tsPath = path.join(dir, baseName + '.test.ts')
      if (!fs.existsSync(tsPath)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

// 主函数
const files = getAllJsFiles(testDir, ['fixtures', 'support'])
console.log(`Found ${files.length} files to convert`)

let converted = 0
for (const file of files) {
  try {
    const { newFilePath, content } = convertFile(file)
    fs.writeFileSync(newFilePath, content)
    console.log(`✓ Converted: ${path.relative(testDir, file)} -> ${path.basename(newFilePath)}`)
    converted++
  } catch (err) {
    console.error(`✗ Failed to convert ${file}:`, err.message)
  }
}

console.log(`\nConverted ${converted}/${files.length} files`)
