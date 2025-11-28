import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const examplesDir = path.join(__dirname, 'examples')

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  // 移除 'use strict'
  content = content.replace(/'use strict'\s*\n\s*/g, '')

  // 转换 require
  content = content.replace(/var\s+express\s*=\s*require\(['"](\.\.\/)+['"]\);?/g, "import express from '../../src/index.js'")
  content = content.replace(/var\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g, "import $1 from '$2'")

  // 转换 var 为 const
  content = content.replace(/\bvar\s+(\w+)\s*=/g, 'const $1 =')

  // 转换 module.exports
  content = content.replace(/var\s+app\s*=\s*module\.exports\s*=\s*express\(\)/g, 'const app = express()\nexport default app')
  content = content.replace(/module\.exports\s*=\s*(\w+)/g, 'export default $1')

  // 转换 module.parent 为 import.meta
  content = content.replace(/if\s*\(!module\.parent\)/g, 'if (import.meta.url === `file://${process.argv[1]}`)')
  content = content.replace(/module\.parent/g, 'false')

  // 添加 __dirname 支持（如果需要）
  if (content.includes('__dirname') && !content.includes('fileURLToPath')) {
    const imports = [
      "import { fileURLToPath } from 'node:url'",
      "import path from 'node:path'",
      '',
      'const __filename = fileURLToPath(import.meta.url)',
      'const __dirname = path.dirname(__filename)',
      ''
    ].join('\n')

    // 在第一个 import 之后插入
    const firstImportMatch = content.match(/^import .+$/m)
    if (firstImportMatch) {
      const insertPos = content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length
      content = content.slice(0, insertPos) + '\n' + imports + content.slice(insertPos)
    } else {
      content = imports + content
    }
  }

  if (content !== original) {
    // 重命名为 .ts
    const newPath = filePath.replace(/\.js$/, '.ts')
    fs.writeFileSync(newPath, content)
    // 删除原文件
    if (newPath !== filePath) {
      fs.unlinkSync(filePath)
    }
    return true
  }
  return false
}

function processDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true })
  let converted = 0

  for (const item of items) {
    const fullPath = path.join(dir, item.name)

    if (item.isDirectory()) {
      converted += processDir(fullPath)
    } else if (item.name.endsWith('.js') && item.name === 'index.js') {
      if (convertFile(fullPath)) {
        console.log('✓ Converted:', path.relative(examplesDir, fullPath))
        converted++
      }
    }
  }

  return converted
}

const converted = processDir(examplesDir)
console.log(`\nConverted ${converted} example files`)
