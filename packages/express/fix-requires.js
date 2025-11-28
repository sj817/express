import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testDir = path.join(__dirname, 'test')

function fixRequires(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    const fullPath = path.join(dir, file.name)

    if (file.isDirectory()) {
      fixRequires(fullPath)
    } else if (file.name.endsWith('.test.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      const original = content

      // 修复 require('../examples/...')
      content = content.replace(/const\s+(\w+)\s*=\s*require\(['"](\.\.\/\.\.\/examples\/[^'"]+)['"]\)/g, 'import $1 from \'$2.js\'')

      // 修复 require('./support/...')
      content = content.replace(/const\s+(\w+)\s*=\s*require\(['"](\.\/support\/[^'"]+)['"]\)/g, 'import $1 from \'$2.js\'')

      // 修复 require('../support/...')
      content = content.replace(/const\s+(\w+)\s*=\s*require\(['"](\.\.\/support\/[^'"]+)['"]\)/g, 'import $1 from \'$2.ts\'')

      if (content !== original) {
        fs.writeFileSync(fullPath, content)
        console.log('✓ Fixed:', path.relative(testDir, fullPath))
      }
    }
  }
}

fixRequires(testDir)
console.log('Done!')
