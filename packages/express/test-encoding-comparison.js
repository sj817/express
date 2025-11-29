/**
 * 对比 iconv-lite 和 TextDecoder 的编码行为
 * 特别针对失败的测试用例：UTF-16 with BOM
 */

import iconv from 'iconv-lite'

// 测试数据：UTF-16 编码的 {"name":"论"}，带有 BOM (0xfeff)
const utf16Buffer = Buffer.from('feff007b0022006e0061006d00650022003a00228bba0022007d', 'hex')

console.log('=== UTF-16 编码对比测试 ===\n')
console.log('测试数据（hex）:', utf16Buffer.toString('hex'))
console.log('测试数据（Buffer）:', utf16Buffer)
console.log('预期结果: {"name":"论"}\n')

// 测试 iconv-lite
console.log('--- iconv-lite 测试 ---')
try {
  // 检查编码是否存在
  const iconvSupported = iconv.encodingExists('utf-16')
  console.log('iconv.encodingExists("utf-16"):', iconvSupported)

  // 解码
  const iconvResult = iconv.decode(utf16Buffer, 'utf-16')
  console.log('iconv.decode 结果:', iconvResult)
  console.log('iconv.decode 结果（JSON）:', JSON.stringify(iconvResult))
  console.log('解码成功 ✓\n')
} catch (err) {
  console.error('iconv.decode 失败:', err.message, '\n')
}

// 测试 TextDecoder
console.log('--- TextDecoder 测试 ---')

// 测试1: 使用 'utf-16' (应该是别名)
console.log('\n1. TextDecoder("utf-16"):')
try {
  const decoder1 = new TextDecoder('utf-16')
  console.log('  创建成功')
  const result1 = decoder1.decode(utf16Buffer)
  console.log('  解码结果:', result1)
  console.log('  解码结果（JSON）:', JSON.stringify(result1))
} catch (err) {
  console.error('  失败:', err.message)
}

// 测试2: 使用 'utf-16le'
console.log('\n2. TextDecoder("utf-16le"):')
try {
  const decoder2 = new TextDecoder('utf-16le')
  console.log('  创建成功')
  const result2 = decoder2.decode(utf16Buffer)
  console.log('  解码结果:', result2)
  console.log('  解码结果（JSON）:', JSON.stringify(result2))
} catch (err) {
  console.error('  失败:', err.message)
}

// 测试3: 使用 'utf-16be'
console.log('\n3. TextDecoder("utf-16be"):')
try {
  const decoder3 = new TextDecoder('utf-16be')
  console.log('  创建成功')
  const result3 = decoder3.decode(utf16Buffer)
  console.log('  解码结果:', result3)
  console.log('  解码结果（JSON）:', JSON.stringify(result3))
} catch (err) {
  console.error('  失败:', err.message)
}

// 测试4: 使用 'utf-16le' + ignoreBOM: false (默认)
console.log('\n4. TextDecoder("utf-16le", { ignoreBOM: false }):')
try {
  const decoder4 = new TextDecoder('utf-16le', { ignoreBOM: false })
  console.log('  创建成功')
  const result4 = decoder4.decode(utf16Buffer)
  console.log('  解码结果:', result4)
  console.log('  解码结果（JSON）:', JSON.stringify(result4))
} catch (err) {
  console.error('  失败:', err.message)
}

// 测试5: 使用 'utf-16le' + ignoreBOM: true
console.log('\n5. TextDecoder("utf-16le", { ignoreBOM: true }):')
try {
  const decoder5 = new TextDecoder('utf-16le', { ignoreBOM: true })
  console.log('  创建成功')
  const result5 = decoder5.decode(utf16Buffer)
  console.log('  解码结果:', result5)
  console.log('  解码结果（JSON）:', JSON.stringify(result5))
} catch (err) {
  console.error('  失败:', err.message)
}

// 测试6: 使用 fatal: true
console.log('\n6. TextDecoder("utf-16", { fatal: true }):')
try {
  const decoder6 = new TextDecoder('utf-16', { fatal: true })
  console.log('  创建成功')
  const result6 = decoder6.decode(utf16Buffer)
  console.log('  解码结果:', result6)
  console.log('  解码结果（JSON）:', JSON.stringify(result6))
} catch (err) {
  console.error('  失败:', err.message)
}

// 测试7: 使用 fatal: false
console.log('\n7. TextDecoder("utf-16", { fatal: false }):')
try {
  const decoder7 = new TextDecoder('utf-16', { fatal: false })
  console.log('  创建成功')
  const result7 = decoder7.decode(utf16Buffer)
  console.log('  解码结果:', result7)
  console.log('  解码结果（JSON）:', JSON.stringify(result7))
} catch (err) {
  console.error('  失败:', err.message)
}

console.log('\n=== 测试完成 ===')
