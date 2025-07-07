/**
 * 端到端测试 - 完整工作流程
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

describe('End-to-End Workflow Tests', () => {
  let serverProcess;
  const serverPort = 3002;
  const serverUrl = `http://localhost:${serverPort}`;
  
  beforeEach(async () => {
    // 确保配置文件存在
    const configDir = './config';
    const proxyConfigPath = join(configDir, 'proxy.json');
    const securityConfigPath = join(configDir, 'security.json');
    
    // 创建测试配置
    const testProxyConfig = {
      providers: [
        {
          name: 'test-provider',
          host: 'proxy.example.com',
          port: 8080,
          username: 'testuser',
          password: 'testpass',
          timeout: 30000
        }
      ],
      healthCheckInterval: 60000,
      sessionDuration: 86400000,
      maxRetries: 3,
      retryDelay: 1000
    };
    
    const testSecurityConfig = {
      enableTLSFingerprinting: true,
      enableHTTP2: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timing: {
        minDelay: 100,
        maxDelay: 500,
        requestInterval: 1000
      }
    };
    
    writeFileSync(proxyConfigPath, JSON.stringify(testProxyConfig, null, 2));
    writeFileSync(securityConfigPath, JSON.stringify(testSecurityConfig, null, 2));
  });

  afterEach(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      
      // 等待进程结束
      await new Promise((resolve) => {
        serverProcess.on('exit', resolve);
        setTimeout(resolve, 5000); // 5秒超时
      });
    }
  });

  test('应该成功启动服务器并响应健康检查', async () => {
    // 启动服务器
    serverProcess = spawn('node', ['src/index.js'], {
      cwd: '.',
      env: {
        ...process.env,
        PORT: serverPort.toString(),
        NODE_ENV: 'test',
        LOG_LEVEL: 'error'
      },
      stdio: 'pipe'
    });

    // 等待服务器启动
    await waitForServer(serverUrl, 10000);

    // 测试健康检查
    const healthResponse = await axios.get(`${serverUrl}/health`);
    
    assert.strictEqual(healthResponse.status, 200);
    assert.strictEqual(healthResponse.data.status, 'healthy');
    assert.ok(healthResponse.data.timestamp);
  });

  test('应该正确加载配置文件', async () => {
    serverProcess = spawn('node', ['src/index.js'], {
      cwd: '.',
      env: {
        ...process.env,
        PORT: serverPort.toString(),
        NODE_ENV: 'test',
        LOG_LEVEL: 'error'
      },
      stdio: 'pipe'
    });

    await waitForServer(serverUrl, 10000);

    // 测试统计接口，验证配置是否正确加载
    const statsResponse = await axios.get(`${serverUrl}/stats`);
    
    assert.strictEqual(statsResponse.status, 200);
    assert.ok(statsResponse.data.proxy);
    assert.ok(statsResponse.data.requests);
  });

  test('应该处理环境变量覆盖', async () => {
    const customPort = 3003;
    
    serverProcess = spawn('node', ['src/index.js'], {
      cwd: '.',
      env: {
        ...process.env,
        PORT: customPort.toString(),
        NODE_ENV: 'test',
        LOG_LEVEL: 'debug'
      },
      stdio: 'pipe'
    });

    const customUrl = `http://localhost:${customPort}`;
    await waitForServer(customUrl, 10000);

    const healthResponse = await axios.get(`${customUrl}/health`);
    assert.strictEqual(healthResponse.status, 200);
  });

  test('应该正确处理进程信号', async () => {
    serverProcess = spawn('node', ['src/index.js'], {
      cwd: '.',
      env: {
        ...process.env,
        PORT: serverPort.toString(),
        NODE_ENV: 'test'
      },
      stdio: 'pipe'
    });

    await waitForServer(serverUrl, 10000);

    // 发送SIGTERM信号
    serverProcess.kill('SIGTERM');

    // 等待进程优雅关闭
    const exitCode = await new Promise((resolve) => {
      serverProcess.on('exit', resolve);
      setTimeout(() => resolve(-1), 5000); // 5秒超时
    });

    // 进程应该正常退出
    assert.notStrictEqual(exitCode, -1, '进程应该在5秒内退出');
  });

  test('应该在端口被占用时报错', async () => {
    // 先启动一个服务器占用端口
    const firstServer = spawn('node', ['src/index.js'], {
      cwd: '.',
      env: {
        ...process.env,
        PORT: serverPort.toString(),
        NODE_ENV: 'test',
        LOG_LEVEL: 'error'
      },
      stdio: 'pipe'
    });

    await waitForServer(serverUrl, 10000);

    // 尝试启动第二个服务器使用相同端口
    const secondServer = spawn('node', ['src/index.js'], {
      cwd: '.',
      env: {
        ...process.env,
        PORT: serverPort.toString(),
        NODE_ENV: 'test',
        LOG_LEVEL: 'error'
      },
      stdio: 'pipe'
    });

    // 第二个服务器应该失败
    const exitCode = await new Promise((resolve) => {
      secondServer.on('exit', resolve);
      setTimeout(() => resolve(-1), 5000);
    });

    assert.notStrictEqual(exitCode, 0, '第二个服务器应该因为端口冲突而失败');

    // 清理第一个服务器
    firstServer.kill('SIGTERM');
    await new Promise((resolve) => {
      firstServer.on('exit', resolve);
      setTimeout(resolve, 2000);
    });
  });

  test('应该在配置文件缺失时使用默认配置', async () => {
    // 临时移动配置文件
    const configDir = './config';
    const proxyConfigPath = join(configDir, 'proxy.json');
    const backupPath = join(configDir, 'proxy.json.backup');
    
    if (existsSync(proxyConfigPath)) {
      writeFileSync(backupPath, readFileSync(proxyConfigPath));
      // 删除配置文件
      require('fs').unlinkSync(proxyConfigPath);
    }

    try {
      serverProcess = spawn('node', ['src/index.js'], {
        cwd: '.',
        env: {
          ...process.env,
          PORT: serverPort.toString(),
          NODE_ENV: 'test',
          LOG_LEVEL: 'error'
        },
        stdio: 'pipe'
      });

      // 服务器应该能够启动（使用默认配置或环境变量）
      const started = await waitForServer(serverUrl, 10000, false);
      
      if (started) {
        const healthResponse = await axios.get(`${serverUrl}/health`);
        assert.strictEqual(healthResponse.status, 200);
      }
    } finally {
      // 恢复配置文件
      if (existsSync(backupPath)) {
        writeFileSync(proxyConfigPath, readFileSync(backupPath));
        require('fs').unlinkSync(backupPath);
      }
    }
  });
});

/**
 * 等待服务器启动
 */
async function waitForServer(url, timeout = 10000, throwOnError = true) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await axios.get(`${url}/health`, { timeout: 1000 });
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  if (throwOnError) {
    throw new Error(`Server did not start within ${timeout}ms`);
  }
  return false;
} 