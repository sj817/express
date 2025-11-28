import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testDir = path.join(__dirname, 'test')

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  // 修复所有剩余的 require 语句
  content = content.replace(/=\s*require\(['"]([^'"]+)['"]\)/g, (match, modulePath) => {
    return `= await import('${modulePath}')`
  })

  // 如果有 await import，文件开头需要是异步的，但测试文件不需要这样做
  // 所以我们使用同步的 import 语句
  content = content.replace(/=\s*await import\(['"]([^'"]+)['"]\)/g, (match, modulePath) => {
    // 对于 node: 模块，使用正常的 import
    if (modulePath.startsWith('node:') || modulePath.startsWith('.')) {
      return `from '${modulePath}'`
    }
    return `from '${modulePath}'`
  })

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    return true
  }
  return false
}

function processDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  let fixed = 0

  for (const file of files) {
    const fullPath = path.join(dir, file.name)

    if (file.isDirectory()) {
      fixed += processDir(fullPath)
    } else if (file.name.endsWith('.test.ts')) {
      if (fixFile(fullPath)) {
        console.log('✓ Fixed:', path.relative(testDir, fullPath))
        fixed++
      }
    }
  }

  return fixed
}

const fixed = processDir(testDir)
console.log(`\nFixed ${fixed} files`)
