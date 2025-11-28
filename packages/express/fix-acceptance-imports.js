import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const acceptanceDir = path.join(__dirname, 'test', 'acceptance')

const files = fs.readdirSync(acceptanceDir)

for (const file of files) {
  if (!file.endsWith('.test.ts')) continue

  const filePath = path.join(acceptanceDir, file)
  let content = fs.readFileSync(filePath, 'utf8')

  // 将 import app from '../../examples/xxx.js' 改为使用 require
  const importMatch = content.match(/^import\s+(\w+)\s+from\s+['"]\.\.\/\.\.\/examples\/([^'"]+)\.js['"]/m)

  if (importMatch) {
    const varName = importMatch[1]
    const examplePath = importMatch[2]

    // 替换为使用 createRequire
    content = content.replace(
      importMatch[0],
      `import requireHelper from '../support/require-helper.js'\nconst ${varName} = requireHelper('../../examples/${examplePath}')`
    )

    fs.writeFileSync(filePath, content)
    console.log('✓ Fixed:', file)
  }
}

console.log('Done!')
