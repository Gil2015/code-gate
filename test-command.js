import { Command } from 'commander';
import { runReviewCommit } from './cli/commands/review-commit.js';

// 创建一个简单的测试程序来验证新命令是否可用
const program = new Command();

program
  .command('review-commit <commit-hash>')
  .alias('rc')
  .description('Review code changes from a specific commit')
  .action(async (commitHash: string) => {
    console.log(`新命令被调用，commit hash: ${commitHash}`);
    // 不实际运行审查，只是验证命令存在
  });

// 解析命令行参数
program.parse(['--help']);