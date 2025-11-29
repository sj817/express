import path from 'node:path'
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
    // resolve: true,
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
  external: [
    ...builtinModules,
    ...builtinModules.map((node) => `node:${node}`),
    'iconv-lite',
  ],
  noExternal: [

  ],
  // 在开发模式下启用 用于分析打包体积
  // outputOptions (outputOptions) {
  //   outputOptions.chunkFileNames = 'chunks/[name]-[hash].js'
  //   outputOptions.advancedChunks = {
  //     // 该选项的作用是指示打包工具是否递归地将模块的依赖包含在生成的 chunk 中。
  //     includeDependenciesRecursively: false,
  //     groups: [
  //       {
  //         // 按包名分组
  //         name (id) {
  //           console.log(id)
  //           if (id.includes('node_modules')) {
  //             const pkg = getPackageName(id)
  //             // /** 文件名称 不包含后缀 */
  //             const name = path.basename(id, path.extname(id))
  //             return `${pkg || 'vendor'}/${name}`
  //           }
  //           return null
  //         },

  //         // 匹配 node_modules 下所有模块
  //         test: /.*/,

  //         priority: 1,

  //         // 每个包最大 100KB，超过会拆成 2 个、1 个...
  //         maxSize: 100000,

  //         // 单模块也不能超过 100 KB
  //         maxModuleSize: 250000,
  //       },
  //     ],
  //   }

  //   return outputOptions
  // },
})

const getPackageName = (filePath: string): string | null => {
  // 格式化为绝对路径
  const absPath = path.resolve(filePath).replace(/\\/g, '/')

  const idx = absPath.lastIndexOf('node_modules/')
  if (idx === -1) return null

  const suffix = absPath.slice(idx + 13)
  const parts = suffix.split('/').filter(Boolean)

  if (parts.length === 0) return null

  // 组织包 (@scope/package)
  if (parts[0].startsWith('@')) {
    return parts.length > 1 ? `${parts[0]}/${parts[1]}` : null
  }

  // 普通包
  return parts[0]
}
