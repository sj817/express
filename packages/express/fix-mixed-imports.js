import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testDir = path.join(__dirname, 'test')

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  // 修复 import ... , var = require(...) 模式
  content = content.replace(
    /^(import\s+[^\n]+)\n\s*,\s*(\w+)\s*=\s*require\(([^)]+)\);?/gm,
    '$1\nimport $2 from $3'
  )

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
