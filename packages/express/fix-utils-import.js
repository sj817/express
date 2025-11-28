import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testDir = path.join(__dirname, 'test')

const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.ts'))

let fixed = 0
for (const file of files) {
  const filePath = path.join(testDir, file)
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  content = content.replace(/import utils from ['"]\.\/support\/utils\.js['"]/g, "import * as utils from './support/utils.js'")
  content = content.replace(/import utils from ['"]\.\.\/support\/utils\.ts['"]/g, "import * as utils from '../support/utils.ts'")

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    console.log('✓ Fixed:', file)
    fixed++
  }
}

console.log(`\nFixed ${fixed} files`)
