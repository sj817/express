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
})
