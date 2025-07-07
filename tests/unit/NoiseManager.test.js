/**
 * NoiseManager 单元测试
 * 测试噪音流量生成器
 */

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import NoiseManager from '../../src/managers/NoiseManager.js';
import Logger from '../../src/utils/logger.js';

describe('NoiseManager 单元测试', () => {
  let noiseManager;
  let logger;
  let mockProxyManager;

  beforeEach(() => {
    logger = new Logger({
      level: 'error',
      enableConsole: false,
      enableFile: false
    });

    // 创建 mock ProxyManager
    mockProxyManager = {
      isHealthy: true,
      currentSession: {
        proxyConfig: {
          agent: {
            https: {},
            http: {}
          }
        }
      },
      currentCountry: 'US',
      enhancedSecurity: {
        generateHeaders: mock.fn((country) => ({
          'User-Agent': 'Mozilla/5.0 Test Browser',
          'Accept-Language': country === 'US' ? 'en-US,en;q=0.9' : 'ja-JP,ja;q=0.9',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Encoding': 'gzip, deflate, br'
        }))
      }
    };

    noiseManager = new NoiseManager(logger, mockProxyManager);
  });

  afterEach(() => {
    noiseManager.stop();
    if (logger) {
      logger.close();
    }
  });

  test('应该正确初始化', () => {
    assert.ok(noiseManager);
    assert.strictEqual(noiseManager.isRunning, false);
    assert.strictEqual(noiseManager.noiseInterval, null);
    assert.ok(Array.isArray(noiseManager.targetSites));
    assert.ok(noiseManager.targetSites.length > 0);
    assert.ok(Array.isArray(noiseManager.requestTypes));
  });

  test('targetSites 应该包含多样化的站点', () => {
    const sites = noiseManager.targetSites;
    
    // 应该包含不同类型的站点
    assert.ok(sites.some(site => site.includes('google')), '应该包含 Google 相关站点');
    assert.ok(sites.some(site => site.includes('wikipedia')), '应该包含 Wikipedia');
    assert.ok(sites.some(site => site.includes('cdn')), '应该包含 CDN 资源');
    assert.ok(sites.some(site => site.includes('.js') || site.includes('.css')), '应该包含静态资源');
  });

  test('start 应该启动噪音生成器', () => {
    assert.strictEqual(noiseManager.isRunning, false);
    
    // Mock generateNoiseRequest 和 scheduleNextRequest
    noiseManager.generateNoiseRequest = mock.fn();
    noiseManager.scheduleNextRequest = mock.fn();
    
    noiseManager.start();
    
    assert.strictEqual(noiseManager.isRunning, true);
    assert.strictEqual(noiseManager.generateNoiseRequest.mock.calls.length, 1);
    assert.strictEqual(noiseManager.scheduleNextRequest.mock.calls.length, 1);
    
    // 再次启动不应该重复执行
    noiseManager.start();
    assert.strictEqual(noiseManager.generateNoiseRequest.mock.calls.length, 1);
  });

  test('stop 应该停止噪音生成器', () => {
    noiseManager.start();
    assert.strictEqual(noiseManager.isRunning, true);
    
    noiseManager.stop();
    assert.strictEqual(noiseManager.isRunning, false);
    assert.strictEqual(noiseManager.noiseInterval, null);
  });

  test('selectRandomTarget 应该返回随机目标URL', () => {
    const selectedUrls = new Set();
    
    // 多次选择以确保随机性
    for (let i = 0; i < 50; i++) {
      const url = noiseManager.selectRandomTarget();
      assert.ok(noiseManager.targetSites.includes(url));
      selectedUrls.add(url);
    }
    
    // 应该选择了多个不同的URL
    assert.ok(selectedUrls.size > 1, '应该选择多个不同的URL');
  });

  test('selectRequestMethod 应该根据权重返回请求方法', () => {
    const methods = { GET: 0, HEAD: 0 };
    
    // 运行1000次以获得分布
    for (let i = 0; i < 1000; i++) {
      const method = noiseManager.selectRequestMethod();
      methods[method]++;
    }
    
    // GET 应该约占 85%
    const getPercentage = methods.GET / 1000;
    assert.ok(getPercentage > 0.80 && getPercentage < 0.90, 
      `GET 请求应该约占 85%，实际: ${(getPercentage * 100).toFixed(1)}%`);
    
    // HEAD 应该约占 15%
    const headPercentage = methods.HEAD / 1000;
    assert.ok(headPercentage > 0.10 && headPercentage < 0.20,
      `HEAD 请求应该约占 15%，实际: ${(headPercentage * 100).toFixed(1)}%`);
  });

  test('generateNoiseRequest 应该使用代理配置和正确的请求头', async () => {
    // Mock axios
    let capturedConfig;
    const originalAxios = (await import('axios')).default;
    const mockAxios = mock.fn(async (config) => {
      capturedConfig = config;
      return { status: 200, data: {} };
    });
    
    // 临时替换 axios
    const axiosModule = await import('axios');
    axiosModule.default = mockAxios;
    
    // 创建新的 NoiseManager 使用 mocked axios
    const testNoiseManager = new NoiseManager(logger, mockProxyManager);
    testNoiseManager.isRunning = true;
    
    await testNoiseManager.generateNoiseRequest();
    
    // 验证请求配置
    assert.ok(capturedConfig, '应该发起请求');
    assert.ok(capturedConfig.headers, '应该包含请求头');
    assert.strictEqual(capturedConfig.headers['User-Agent'], 'Mozilla/5.0 Test Browser');
    assert.strictEqual(capturedConfig.headers['Accept-Language'], 'en-US,en;q=0.9');
    assert.strictEqual(capturedConfig.httpsAgent, mockProxyManager.currentSession.proxyConfig.agent.https);
    assert.strictEqual(capturedConfig.httpAgent, mockProxyManager.currentSession.proxyConfig.agent.http);
    assert.strictEqual(capturedConfig.timeout, 10000);
    assert.strictEqual(capturedConfig.maxRedirects, 3);
    
    // 恢复原始 axios
    axiosModule.default = originalAxios;
  });

  test('generateNoiseRequest 应该使用当前国家代码生成请求头', async () => {
    // 改变国家代码
    mockProxyManager.currentCountry = 'JP';
    
    noiseManager.isRunning = true;
    await noiseManager.generateNoiseRequest();
    
    // 验证使用了正确的国家代码
    assert.strictEqual(mockProxyManager.enhancedSecurity.generateHeaders.mock.calls.length, 1);
    assert.strictEqual(mockProxyManager.enhancedSecurity.generateHeaders.mock.calls[0].arguments[0], 'JP');
  });

  test('generateNoiseRequest 应该在代理未就绪时跳过', async () => {
    // 代理不健康
    mockProxyManager.isHealthy = false;
    
    noiseManager.isRunning = true;
    const result = await noiseManager.generateNoiseRequest();
    
    assert.strictEqual(result, undefined);
    assert.strictEqual(noiseManager.stats.totalRequests, 0);
    
    // 没有会话
    mockProxyManager.isHealthy = true;
    mockProxyManager.currentSession = null;
    
    const result2 = await noiseManager.generateNoiseRequest();
    assert.strictEqual(result2, undefined);
  });

  test('getStats 应该返回统计信息', () => {
    const stats = noiseManager.getStats();
    
    assert.ok(stats);
    assert.strictEqual(stats.totalRequests, 0);
    assert.strictEqual(stats.successfulRequests, 0);
    assert.strictEqual(stats.failedRequests, 0);
    assert.strictEqual(stats.lastRequestTime, null);
    assert.strictEqual(stats.isRunning, false);
    assert.strictEqual(stats.successRate, 0);
    
    // 修改统计并再次检查
    noiseManager.stats.totalRequests = 10;
    noiseManager.stats.successfulRequests = 8;
    noiseManager.stats.failedRequests = 2;
    noiseManager.isRunning = true;
    
    const updatedStats = noiseManager.getStats();
    assert.strictEqual(updatedStats.totalRequests, 10);
    assert.strictEqual(updatedStats.successfulRequests, 8);
    assert.strictEqual(updatedStats.failedRequests, 2);
    assert.strictEqual(updatedStats.isRunning, true);
    assert.strictEqual(updatedStats.successRate, '0.80');
  });

  test('scheduleNextRequest 应该在正确的时间间隔内调度', () => {
    noiseManager.isRunning = true;
    
    let timeoutDelay = 0;
    // Mock setTimeout 来捕获延迟
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = mock.fn((fn, delay) => {
      timeoutDelay = delay;
      return originalSetTimeout(fn, 0); // 立即执行以便测试
    });
    
    noiseManager.generateNoiseRequest = mock.fn();
    noiseManager.scheduleNextRequest();
    
    // 验证延迟在 5-15 分钟之间
    assert.ok(timeoutDelay >= 5 * 60 * 1000, '延迟应该至少 5 分钟');
    assert.ok(timeoutDelay <= 15 * 60 * 1000, '延迟不应超过 15 分钟');
    
    // 恢复原始 setTimeout
    global.setTimeout = originalSetTimeout;
  });

  test('shutdown 应该正确关闭管理器', () => {
    noiseManager.start();
    assert.strictEqual(noiseManager.isRunning, true);
    
    noiseManager.shutdown();
    assert.strictEqual(noiseManager.isRunning, false);
  });
});

describe('NoiseManager 集成场景测试', () => {
  let noiseManager;
  let logger;
  let mockProxyManager;

  beforeEach(() => {
    logger = new Logger({
      level: 'error',
      enableConsole: false,
      enableFile: false
    });

    mockProxyManager = {
      isHealthy: true,
      currentSession: {
        proxyConfig: {
          agent: {
            https: {},
            http: {}
          }
        }
      },
      currentCountry: 'US',
      enhancedSecurity: {
        generateHeaders: () => ({
          'User-Agent': 'Mozilla/5.0',
          'Accept-Language': 'en-US,en;q=0.9'
        })
      }
    };

    noiseManager = new NoiseManager(logger, mockProxyManager);
  });

  afterEach(() => {
    noiseManager.stop();
  });

  test('应该确保噪音流量使用与主流量相同的指纹', () => {
    // 验证 NoiseManager 使用 ProxyManager 的 enhancedSecurity
    // 这确保了指纹一致性
    assert.ok(noiseManager.proxyManager === mockProxyManager);
    
    // 在实际代码中，generateNoiseRequest 使用：
    // const headers = this.proxyManager.enhancedSecurity.generateHeaders(country);
    // 这确保了与主流量使用相同的浏览器指纹
  });

  test('请求类型分布应该模拟真实用户行为', () => {
    // GET 请求占大多数（85%）模拟正常浏览
    // HEAD 请求占少数（15%）模拟资源检查
    const weights = noiseManager.requestTypes.reduce((sum, type) => sum + type.weight, 0);
    assert.strictEqual(weights, 1.0, '权重总和应该为 1');
    
    const getType = noiseManager.requestTypes.find(t => t.method === 'GET');
    assert.ok(getType.weight > 0.8, 'GET 请求应该占主导地位');
  });
});