import { runReviewFlow } from './dist/core/review.js';
import { getCommitFiles, getCommitVsParentDiff, getCommitInfo } from './dist/core/git.js';
import { filterFiles } from './dist/core/git.js';
import { loadConfig } from './dist/config/index.js';

async function testReviewFlow() {
  console.log('开始测试runReviewFlow...');
  
  const commitHash = 'a2907c2';
  
  // 获取commit信息
  const commitInfo = getCommitInfo(commitHash);
  console.log('Commit Info:', commitInfo);

  // 获取commit的文件列表
  const allFiles = getCommitFiles(commitHash);
  console.log('All Files:', allFiles);

  // 加载配置
  const cfg = await loadConfig();
  console.log('Config loaded');

  // 根据配置过滤文件
  const filteredFiles = filterFiles(allFiles, cfg.fileTypes, cfg.exclude);
  console.log('Filtered Files:', filteredFiles);
  
  // 获取commit的diff
  const diff = getCommitVsParentDiff(commitHash);
  console.log('Has Diff:', !!diff);

  // 使用现有的审查流程，传入自定义参数
  console.log('开始运行审查流程...');
  const result = await runReviewFlow({
    customFiles: filteredFiles,
    customDiff: diff,
    customSubtitle: `Commit: ${commitInfo.hash.substring(0, 8)} | ${commitInfo.message}`,
    customCommitHash: commitHash, // 传递commit hash用于获取特定文件的diff
    onStart: (total) => {
      console.log(`准备审查 ${total} 个文件...`)
    },
    onProgress: (file, index, total) => {
      console.log(`已处理: ${file} (${index}/${total})`)
    },
    onServerReady: (url) => {
      console.log(`审查服务器已启动: ${url}`)
    }
  });
  
  console.log('审查流程完成，返回值:', result);
  
  // 检查是否生成了文件
  import('fs').then(fs => {
    const dir = './.review-logs';
    if (fs.default.existsSync(dir)) {
      const files = fs.default.readdirSync(dir);
      console.log('在 .review-logs 目录中找到文件:', files);
    } else {
      console.log('目录 .review-logs 不存在');
    }
  });
}

testReviewFlow().catch(console.error);