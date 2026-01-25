#!/usr/bin/env node

// 简单测试脚本，验证新功能是否正确实现
import { runReviewCommit } from './dist/cli/commands/review-commit.js';
import fs from 'fs';
import path from 'path';

// 检查是否提供了commit hash参数
if (process.argv.length < 3) {
  console.log('用法: node test-review-commit.js <commit-hash>');
  process.exit(1);
}

const commitHash = process.argv[2];
console.log('当前工作目录:', process.cwd());

console.log(`正在测试对commit ${commitHash}的审查功能...`);

// 调用我们的函数
try {
  await runReviewCommit(commitHash);

  // 检查是否生成了审查文件
  const reviewDir = path.join(process.cwd(), '.review-logs');
  console.log('检查目录:', reviewDir);

  if (fs.existsSync(reviewDir)) {
    const files = fs.readdirSync(reviewDir);
    console.log('在 .review-logs 目录中找到文件:', files);
  } else {
    console.log('目录 .review-logs 不存在');
  }

  console.log('测试完成');
} catch (error) {
  console.error('测试过程中出现错误:', error);
}