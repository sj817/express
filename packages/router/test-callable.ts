import { Router } from './src/index'

const router1 = Router()  // 不用 new 调用
const router2 = new Router()  // 用 new 调用

console.log('router1 type:', typeof router1)
console.log('router2 type:', typeof router2)
console.log('router1 has param:', typeof router1.param === 'function')
console.log('router2 has param:', typeof router2.param === 'function')

console.log('router1 keys:', Object.keys(router1.prototype))
console.log('router2 keys:', Object.keys(router2.prototype))

console.log('router1 prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(router1)).length)
console.log('router2 prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(router2)).length)

// 测试是否可调用
try {
  router1({}, {}, () => { })
  console.log('✅ router1 is callable!')
} catch (e) {
  console.log('❌ router1 is NOT callable:', (e as Error).message)
}

try {
  router2({}, {}, () => { })
  console.log('✅ router2 is callable!')
} catch (e) {
  console.log('❌ router2 is NOT callable:', (e as Error).message)
}

console.log(router1.params)
console.log(router2.params)
