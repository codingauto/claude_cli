/**
 * 基础功能测试
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Basic Tests', () => {
  test('Node.js 环境正常', () => {
    assert.ok(process.version);
    assert.ok(process.platform);
  });

  test('ES模块导入正常', async () => {
    const { readFileSync } = await import('fs');
    assert.ok(typeof readFileSync === 'function');
  });

  test('配置文件存在', async () => {
    const { existsSync } = await import('fs');
    
    assert.ok(existsSync('./config/proxy.json'), 'proxy.json 配置文件应该存在');
    assert.ok(existsSync('./config/security.json'), 'security.json 配置文件应该存在');
  });

  test('主入口文件存在', async () => {
    const { existsSync } = await import('fs');
    
    assert.ok(existsSync('./src/index.js'), '主入口文件应该存在');
  });

  test('工具类文件存在', async () => {
    const { existsSync } = await import('fs');
    
    assert.ok(existsSync('./src/utils/logger.js'), 'Logger工具类应该存在');
    assert.ok(existsSync('./src/managers/ProxyManager.js'), 'ProxyManager应该存在');
  });
}); 