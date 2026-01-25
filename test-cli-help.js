#!/usr/bin/env node

// 测试新功能是否正确集成到CLI
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 构建并运行CLI帮助命令来确认新命令存在
const child = spawn('node', ['--loader', 'ts-node/esm', join(__dirname, 'src/cli/index.ts'), '--help']);

child.stdout.on('data', (data) => {
  console.log(`输出: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`错误: ${data}`);
});

child.on('close', (code) => {
  console.log(`子进程退出，退出码 ${code}`);
});