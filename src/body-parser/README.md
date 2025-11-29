# Body Parser - iconv-lite 依赖移除说明

## 概述

本次更新将 `iconv-lite` 依赖替换为 Node.js 内置的 `TextDecoder` API，以减少外部依赖并提升性能。

## 变更详情

### 移除的依赖

- **iconv-lite**: 用于字符编码转换的第三方库

### 替换方案

- **TextDecoder**: Node.js 内置的 Web API，提供标准的文本解码功能

## 修改的文件

### `src/read.ts`

1. **移除导入**:

   ```typescript
   // 移除前
   import iconv from 'iconv-lite'

   // 移除后
   // 不再需要导入，使用内置的 TextDecoder
   ```

2. **编码验证**:

   ```typescript
   // 移除前
   if (!iconv.encodingExists(encoding)) {
     // 返回错误
   }

   // 移除后
   try {
     new TextDecoder(normalizeEncoding(encoding))
   } catch {
     // 返回错误
   }
   ```

3. **字符解码**:

   ```typescript
   // 移除前
   str = iconv.decode(body, encoding)

   // 移除后
   // 对于 UTF-16，需要检测 BOM 来确定字节序
   let actualEncoding = encoding
   if (encoding.toLowerCase() === 'utf-16' && body.length >= 2) {
     if (body[0] === 0xfe && body[1] === 0xff) {
       actualEncoding = 'utf-16be' // Big Endian BOM
     } else if (body[0] === 0xff && body[1] === 0xfe) {
       actualEncoding = 'utf-16le' // Little Endian BOM
     }
   }
   str = new TextDecoder(actualEncoding, { fatal: true }).decode(body)
   ```

## 兼容性说明

### 支持的编码

`TextDecoder` 支持 WHATWG 编码标准中定义的所有编码，包括但不限于：

- **UTF-8** (默认)
- **UTF-16LE / UTF-16BE** (别名: utf-16)
- **ISO-8859 系列** (iso-8859-1 到 iso-8859-16)
- **Windows 代码页** (windows-1250 到 windows-1258)
- **KOI8-R / KOI8-U** (西里尔字符集)
- **GB18030 / GBK / Big5** (中文编码)
- **EUC-JP / Shift_JIS / ISO-2022-JP** (日文编码)
- **EUC-KR** (韩文编码)

详细列表请参见: [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/#names-and-labels)

### 重要改进

**UTF-16 BOM 自动检测**:

- `iconv-lite` 会自动检测 UTF-16 的字节序标记（BOM）
- `TextDecoder` 的 `utf-16` 别名默认为 `utf-16le`，不会自动检测 BOM
- 我们的实现增加了 BOM 检测逻辑：
  - `0xFE 0xFF` → 使用 `utf-16be` (Big Endian)
  - `0xFF 0xFE` → 使用 `utf-16le` (Little Endian)
- 这确保了与 `iconv-lite` 完全兼容的行为

**注意**:

- TextDecoder 的编码支持取决于 Node.js 的构建配置
- 完整的 ICU 数据支持所有 WHATWG 编码
- 如果 Node.js 构建时禁用了 ICU 或使用 small-icu，某些编码可能不可用

## 优势

1. **减少依赖**: 移除外部依赖，减小包体积
2. **性能提升**: 使用原生 API，性能更优
3. **标准化**: 使用 Web 标准 API，更易维护
4. **安全性**: 减少供应链攻击面

## 测试结果

运行 `npm run test:body-parser`:

- ✅ 总测试数: 262
- ✅ 通过: 262
- ✅ 失败: 0
- ✅ 通过率: **100%** 🎉

**关键突破**：通过创建对比测试（[`test-encoding-comparison.js`](../../test-encoding-comparison.js)）发现 TextDecoder 不会自动检测 UTF-16 BOM，添加 BOM 检测逻辑后，所有测试全部通过！

## 迁移指南

对于大多数用户，此更改是透明的，无需任何代码修改。

### 如果您遇到编码问题

1. **检查编码名称**: 确保使用标准的 WHATWG 编码名称（如 `utf-8`, `iso-8859-1`, `windows-1252`）
2. **查看错误信息**: 415 错误表示不支持的字符集
3. **检查 Node.js 配置**: 确认 Node.js 构建时包含了完整的 ICU 数据
4. **考虑替代方案**: 对于极少数不支持的编码，考虑在客户端进行转换

## 回滚方案

如果需要恢复 `iconv-lite` 依赖：

1. 重新安装依赖:

   ```bash
   npm install iconv-lite
   ```

2. 恢复 `src/read.ts` 中的代码:
   - 恢复 `import iconv from 'iconv-lite'`
   - 使用 `iconv.encodingExists()` 和 `iconv.decode()`
   - 移除 `normalizeEncoding()` 函数

## 相关资源

- [TextDecoder API 文档](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder)
- [支持的编码列表](https://encoding.spec.whatwg.org/#names-and-labels)
- [Node.js TextDecoder 实现](https://nodejs.org/api/util.html#class-utiltextdecoder)

## 更新日期

2025-11-29
