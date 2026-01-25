import { saveOutput } from './src/ui/server.js';
import { defaultConfig } from './src/config/defaults.js';

// 测试saveOutput函数
const testConfig = { ...defaultConfig };
const testId = 'test';
const testHtml = '<html><body>Test</body></html>';

console.log('开始测试saveOutput...');
console.log('输出目录:', testConfig.output?.dir || '.review-logs');

try {
  saveOutput(testConfig, testId, testHtml);
  console.log('saveOutput调用成功');
  
  // 检查文件是否创建
  import('fs').then(fs => {
    const filePath = './.review-logs/review-test.html';
    if (fs.default.existsSync(filePath)) {
      console.log('文件创建成功:', filePath);
    } else {
      console.log('文件未找到:', filePath);
    }
  });
} catch (error) {
  console.error('saveOutput调用失败:', error);
}