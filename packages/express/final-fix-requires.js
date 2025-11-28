import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testDir = path.join(__dirname, 'test')

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  // 修复 const { x } = require('node:buffer')
  content = content.replace(/const\s+\{\s*(\w+)\s*\}\s*=\s*require\(['"]node:buffer['"]\)/g,
    "import { $1 } from 'node:buffer'")

  // 修复 const x = require('node:async_hooks').AsyncLocalStorage
  content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]node:async_hooks['"]\)\.(\w+)/g,
    "import { $2 as $1 } from 'node:async_hooks'")

  // 修复 const x = require('../lib/utils').methods
  content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]\.\.\/lib\/utils['"]\)\.(\w+)/g,
    "import { $2 as $1 } from '../src/utils.ts'")

  // 修复 const utils = require('../lib/utils')
  content = content.replace(/const\s+utils\s*=\s*require\(['"]\.\.\/lib\/utils['"]\)/g,
    "import * as utils from '../src/utils.ts'")

  // 修复 const x = require('express')
  content = content.replace(/const\s+express\s*=\s*require\(['"]\.\.\/\.['"]\)/g,
    "import express from '../src/index'")

  // 修复 const x = require('cookie-parser')
  content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]cookie-parser['"]\)/g,
    "import $1 from 'cookie-parser'")

  // 修复 const onFinished = require('on-finished')
  content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]on-finished['"]\)/g,
    "import $1 from 'on-finished'")

  // 修复行内的 require('node:url')
  content = content.replace(/require\(['"]node:url['"]\)/g, "await import('node:url')")

  // 修复剩余的 , x = require(...) 模式
  content = content.replace(/,\s*(\w+)\s*=\s*require\(['"]node:assert['"]\)/g,
    "\nimport $1 from 'node:assert'")
  content = content.replace(/,\s*(\w+)\s*=\s*require\(['"]node:url['"]\)/g,
    "\nimport $1 from 'node:url'")
  content = content.replace(/,\s*(\w+)\s*=\s*require\(['"]supertest['"]\)/g,
    "\nimport $1 from 'supertest'")

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
