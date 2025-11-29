/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import debugModule from 'debug'

const require = createRequire(import.meta.url)

/**
 * 视图引擎函数类型
 * @private
 */
interface ViewEngine {
  (path: string, options: Record<string, unknown>, callback: (err: Error | null, rendered?: string) => void): void
}

/**
 * 视图选项接口
 * @private
 */
interface ViewOptions {
  /** 默认模板引擎名称 */
  defaultEngine?: string
  /** 模板引擎缓存 */
  engines: Record<string, ViewEngine>
  /** 视图查找的根路径 */
  root: string | string[]
}

/**
 * 模块依赖
 * @private
 */
const debug = debugModule('express:view')

/**
 * 视图类
 * @public
 */
export class View {
  /** 默认引擎名称 */
  defaultEngine?: string
  /** 文件扩展名 */
  ext: string
  /** 视图名称 */
  name: string
  /** 视图根路径 */
  root: string | string[]
  /** 视图引擎函数 */
  engine: ViewEngine
  /** 视图文件路径 */
  path: string | undefined

  /**
   * 使用给定的 `name` 初始化一个新的 `View`
   *
   * 选项：
   *
   *   - `defaultEngine` 默认模板引擎名称
   *   - `engines` 模板引擎 require() 缓存
   *   - `root` 视图查找的根路径
   *
   * @param name - 视图名称
   * @param options - 视图选项
   * @public
   */
  constructor (name: string, options: ViewOptions) {
    const opts = options

    this.defaultEngine = opts.defaultEngine
    this.ext = path.extname(name)
    this.name = name
    this.root = opts.root

    if (!this.ext && !this.defaultEngine) {
      throw new Error('No default engine was specified and no extension was provided.')
    }

    let fileName = name

    if (!this.ext) {
      // get extension from default engine name
      this.ext = this.defaultEngine![0] !== '.' ? '.' + this.defaultEngine! : this.defaultEngine!
      fileName += this.ext
    }

    if (!opts.engines[this.ext]) {
      // load engine
      const mod = this.ext.slice(1)
      debug('require "%s"', mod)

      // default engine export
      const fn = require(mod).__express

      if (typeof fn !== 'function') {
        throw new Error('Module "' + mod + '" does not provide a view engine.')
      }

      opts.engines[this.ext] = fn
    }

    // store loaded engine
    this.engine = opts.engines[this.ext]

    // lookup path
    this.path = this.lookup(fileName)
  }

  /**
   * 通过给定的 `name` 查找视图
   *
   * @param name - 视图名称
   * @returns 视图文件路径，如果未找到则返回 undefined
   * @private
   */
  lookup (name: string): string | undefined {
    let filePath
    const roots: string[] = Array.isArray(this.root) ? this.root : [this.root]

    debug('lookup "%s"', name)

    for (let i = 0; i < roots.length && !filePath; i++) {
      const root = roots[i]

      // resolve the path
      const loc = path.resolve(root, name)
      const dir = path.dirname(loc)
      const file = path.basename(loc)

      // resolve the file
      filePath = this.resolve(dir, file)
    }

    return filePath
  }

  /**
   * 使用给定的选项渲染视图
   *
   * @param options - 渲染选项
   * @param callback - 渲染完成后的回调函数
   * @private
   */
  render (options: Record<string, unknown>, callback: (err: Error | null, rendered?: string) => void): void {
    let sync = true

    debug('render "%s"', this.path)

    // render, normalizing sync callbacks
    this.engine(this.path!, options, (err: Error | null, rendered?: string) => {
      if (!sync) {
        return callback(err, rendered)
      }

      // force callback to be async
      return process.nextTick(() => {
        return callback(err, rendered)
      })
    })

    sync = false
  }

  /**
   * 在给定目录中解析文件
   *
   * @param dir - 目录路径
   * @param file - 文件名
   * @returns 解析后的文件路径，如果未找到则返回 undefined
   * @private
   */
  resolve (dir: string, file: string): string | undefined {
    const ext = this.ext

    // <path>.<ext>
    let filePath = path.join(dir, file)
    let stat = tryStat(filePath)

    if (stat && stat.isFile()) {
      return filePath
    }

    // <path>/index.<ext>
    filePath = path.join(dir, path.basename(file, ext), 'index' + ext)
    stat = tryStat(filePath)

    if (stat && stat.isFile()) {
      return filePath
    }
  }
}

/**
 * 尝试获取文件状态
 *
 * @param filePath - 文件路径
 * @returns 文件状态对象，如果失败则返回 undefined
 * @private
 */
function tryStat (filePath: string): fs.Stats | undefined {
  debug('stat "%s"', filePath)

  try {
    return fs.statSync(filePath)
  } catch (e) {
    return undefined
  }
}
