// import path from 'node:path'
import { builtinModules } from 'node:module'
import { defineConfig } from 'tsdown/config'

export default defineConfig({
  entry: ['./src/index.ts'],
  outExtensions: (context) => {
    if (context.format === 'es') {
      return {
        js: '.mjs',
        dts: '.d.ts',
      }
    }

    return { js: '.js', dts: '.d.ts' }
  },
  dts: {
    resolve: true,
    // resolver: 'tsc',
    // build: true,
  },
  format: ['esm'],
  shims: true,
  target: 'node18',
  platform: 'node',
  sourcemap: false,
  outDir: 'dist',
  clean: true,
  treeshake: true,
  // 忽略node内置模块的打包
  external: [
    ...builtinModules,
    ...builtinModules.map((node) => `node:${node}`),
  ],
  noExternal:[

  ]
  // outputOptions (outputOptions) {
  //   outputOptions.advancedChunks = {
  //     // includeDependenciesRecursively: true,
  //     groups: [
  //       {
  //         // 按包名分组
  //         name (id) {
  //           // if (id.includes('node_modules')) {
  //           //   const pkg = getPackageName(id)
  //           //   // /** 文件名称 不包含后缀 */
  //           //   const name = path.basename(id, path.extname(id))
  //           //   if (id.includes('BrowserContext.js')) return '@puppeteer/puppeteer-core/BrowserContext'
  //           //   if (id.includes('chromium-bidi')) return `chromium-bidi/chromium-bidi/${name}`
  //           //   if (id.includes('browsers')) return `@puppeteer/puppeteer-browsers/${name}`
  //           //   if (id.includes('puppeteer-core')) return `@puppeteer/puppeteer-core/${name}`
  //           //   return pkg
  //           // }
  //           return null
  //         },

  //         // 匹配 node_modules 下所有模块
  //         test: /node_modules[\\/]/,

  //         priority: 1,

  //         // 每个包最大 100KB，超过会拆成 2 个、1 个...
  //         maxSize: 100,

  //         // 单模块也不能超过 100 KB
  //         maxModuleSize: 100,

  //         // 必须为 0，否则太小的 chunk 会被默认逻辑吞掉
  //         minSize: 0,
  //       },
  //     ],
  //   }

  //   return outputOptions
  // },
})

// const getPackageName = (filePath: string): string | null => {
//   // 格式化为绝对路径
//   const absPath = path.resolve(filePath).replace(/\\/g, '/')

//   const idx = absPath.lastIndexOf('node_modules/')
//   if (idx === -1) return null

//   const suffix = absPath.slice(idx + 13)
//   const parts = suffix.split('/').filter(Boolean)

//   if (parts.length === 0) return null

//   // 组织包 (@scope/package)
//   if (parts[0].startsWith('@')) {
//     return parts.length > 1 ? `${parts[0]}/${parts[1]}` : null
//   }

//   // 普通包
//   return parts[0]
// }
