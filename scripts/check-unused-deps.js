#!/usr/bin/env node

/**
 * 检查未使用的依赖包脚本
 * 使用方法: node scripts/check-unused-deps.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const packageJsonPath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const dependencies = Object.keys(packageJson.dependencies || {})
const devDependencies = Object.keys(packageJson.devDependencies || {})

console.log('🔍 检查未使用的依赖包...\n')

// 检查生产依赖
console.log('📦 生产依赖 (dependencies):')
const unusedDeps = []
const usedDeps = []

dependencies.forEach(dep => {
  try {
    // 使用 grep 搜索导入语句
    const result = execSync(
      `grep -r "from ['\"]${dep}['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null || true`,
      { encoding: 'utf8', cwd: process.cwd() }
    )
    
    // 检查 package.json 中的引用（可能是间接依赖）
    const packageRef = execSync(
      `grep -r "${dep}" package.json pnpm-lock.yaml 2>/dev/null || true`,
      { encoding: 'utf8', cwd: process.cwd() }
    )
    
    if (result.trim() || packageRef.trim()) {
      usedDeps.push(dep)
    } else {
      unusedDeps.push(dep)
    }
  } catch (error) {
    // 如果搜索失败，假设依赖被使用
    usedDeps.push(dep)
  }
})

if (unusedDeps.length > 0) {
  console.log('❌ 可能未使用的依赖:')
  unusedDeps.forEach(dep => {
    console.log(`   - ${dep}`)
  })
} else {
  console.log('✅ 所有依赖都在使用中')
}

console.log(`\n📊 统计:`)
console.log(`   - 总依赖数: ${dependencies.length}`)
console.log(`   - 已使用: ${usedDeps.length}`)
console.log(`   - 可能未使用: ${unusedDeps.length}`)

// 检查开发依赖
console.log('\n📦 开发依赖 (devDependencies):')
const unusedDevDeps = []
const usedDevDeps = []

devDependencies.forEach(dep => {
  try {
    const result = execSync(
      `grep -r "${dep}" --include="*.json" --include="*.js" --include="*.mjs" --include="*.ts" . 2>/dev/null || true`,
      { encoding: 'utf8', cwd: process.cwd() }
    )
    
    if (result.trim()) {
      usedDevDeps.push(dep)
    } else {
      unusedDevDeps.push(dep)
    }
  } catch (error) {
    usedDevDeps.push(dep)
  }
})

if (unusedDevDeps.length > 0) {
  console.log('❌ 可能未使用的依赖:')
  unusedDevDeps.forEach(dep => {
    console.log(`   - ${dep}`)
  })
} else {
  console.log('✅ 所有依赖都在使用中')
}

console.log(`\n📊 统计:`)
console.log(`   - 总依赖数: ${devDependencies.length}`)
console.log(`   - 已使用: ${usedDevDeps.length}`)
console.log(`   - 可能未使用: ${unusedDevDeps.length}`)

// 生成移除命令
if (unusedDeps.length > 0 || unusedDevDeps.length > 0) {
  console.log('\n💡 建议移除命令:')
  if (unusedDeps.length > 0) {
    console.log(`pnpm remove ${unusedDeps.join(' ')}`)
  }
  if (unusedDevDeps.length > 0) {
    console.log(`pnpm remove -D ${unusedDevDeps.join(' ')}`)
  }
  console.log('\n⚠️  注意: 请手动验证这些依赖确实未被使用后再移除')
}

console.log('\n✅ 检查完成')

