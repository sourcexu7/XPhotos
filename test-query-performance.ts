'use server'

import { fetchServerImagesPageByAlbum, fetchClientImagesListByAlbum } from './lib/db/query/images'

async function testQueryPerformance() {
  console.log('开始测试查询性能...')
  
  // 测试 1: 后台图片列表查询
  console.log('\n测试 1: 后台图片列表查询')
  const start1 = Date.now()
  const result1 = await fetchServerImagesPageByAlbum(1, '', -1, -1, '', '', '', '', '', [], 'and', 8)
  const end1 = Date.now()
  console.log(`查询耗时: ${end1 - start1}ms`)
  console.log(`返回图片数量: ${result1.items.length}`)
  console.log(`总图片数量: ${result1.total}`)
  
  // 测试 2: 客户端图片列表查询
  console.log('\n测试 2: 客户端图片列表查询')
  const start2 = Date.now()
  const result2 = await fetchClientImagesListByAlbum(1, '/')
  const end2 = Date.now()
  console.log(`查询耗时: ${end2 - start2}ms`)
  console.log(`返回图片数量: ${result2.length}`)
  
  // 测试 3: 带筛选条件的查询
  console.log('\n测试 3: 带筛选条件的查询')
  const start3 = Date.now()
  const result3 = await fetchServerImagesPageByAlbum(1, '', 0, -1, '', '', '', '', '', [], 'and', 8)
  const end3 = Date.now()
  console.log(`查询耗时: ${end3 - start3}ms`)
  console.log(`返回图片数量: ${result3.items.length}`)
  
  console.log('\n性能测试完成！')
}

testQueryPerformance().catch(console.error)
