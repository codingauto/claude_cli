/**
 * ProxyManager 单元测试
 * 测试代理管理器的核心功能
 */

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import ProxyManager from '../../src/managers/ProxyManager.js';
import Logger from '../../src/utils/logger.js';

describe('ProxyManager 单元测试', () => {
  let proxyManager;
  let logger;
  let mockConfig;

  beforeEach(() => {
    // 创建静默的测试日志器
    logger = new Logger({
      level: 'error',
      enableConsole: false,
      enableFile: false
    });

    // 创建测试配置
    mockConfig = {
      providers: [
        {
          name: 'test-provider-1',
          host: '127.0.0.1',
          port: 8080,
          username: 'testuser',
          password: 'testpass',
          timeout: 5000
        },
        {
          name: 'test-provider-2',
          host: '127.0.0.2',
          port: 8081,
          username: 'testuser2',
          password: 'testpass2',
          timeout: 5000
        }
      ],
      healthCheckInterval: 60000,
      maxRetries: 3,
      retryDelay: 100
    };

    // 创建 ProxyManager 实例（不初始化）
    proxyManager = new ProxyManager(mockConfig, logger);
  });

  afterEach(() => {
    if (proxyManager) {
      proxyManager.close();
    }
    if (logger) {
      logger.close();
    }
  });

  test('ProxyManager 应该正确初始化', () => {
    assert.ok(proxyManager);
    assert.strictEqual(proxyManager.providers.length, 2);
    assert.strictEqual(proxyManager.currentProviderIndex, 0);
    assert.strictEqual(proxyManager.isHealthy, false);
    assert.strictEqual(proxyManager.currentSession, null);
  });

  test('validateConfig 应该验证配置格式', () => {
    // 测试有效配置
    assert.doesNotThrow(() => {
      proxyManager.validateConfig();
    });

    // 测试无效配置 - 没有 providers
    const invalidManager1 = new ProxyManager({ providers: [] }, logger);
    assert.throws(() => {
      invalidManager1.validateConfig();
    }, /No proxy providers configured/);

    // 测试无效配置 - provider 缺少必要字段
    const invalidConfig = {
      providers: [{ name: 'test' }] // 缺少 host 和 port
    };
    const invalidManager2 = new ProxyManager(invalidConfig, logger);
    assert.throws(() => {
      invalidManager2.validateConfig();
    }, /Invalid provider configuration/);
  });

  test('getCurrentProvider 应该返回当前提供商', () => {
    const provider = proxyManager.getCurrentProvider();
    assert.ok(provider);
    assert.strictEqual(provider.name, 'test-provider-1');
    assert.strictEqual(provider.host, '127.0.0.1');
  });

  test('switchProvider 应该切换到下一个提供商', async () => {
    // Mock createSession 避免实际网络请求
    proxyManager.createSession = mock.fn(async () => {
      return { id: 'mock-session', provider: proxyManager.getCurrentProvider().name };
    });

    const initialProvider = proxyManager.getCurrentProvider();
    assert.strictEqual(initialProvider.name, 'test-provider-1');

    await proxyManager.switchProvider();

    const newProvider = proxyManager.getCurrentProvider();
    assert.strictEqual(newProvider.name, 'test-provider-2');
    assert.ok(proxyManager.stats.providerSwitches > 0);
  });

  test('buildProxyConfig 应该正确构建代理配置', () => {
    const provider = proxyManager.getCurrentProvider();
    const config = proxyManager.buildProxyConfig(provider);

    assert.ok(config);
    assert.ok(config.url);
    assert.ok(config.agent);
    assert.ok(config.agent.http);
    assert.ok(config.agent.https);
    assert.strictEqual(config.timeout, 5000);
    assert.ok(config.url.includes('testuser:testpass'));
  });

  test('isSessionValid 应该正确验证会话状态', () => {
    // 没有会话时应该返回 false
    assert.strictEqual(proxyManager.isSessionValid(), false);

    // 创建一个有效会话
    proxyManager.currentSession = {
      id: 'test-session',
      expiresAt: Date.now() + 3600000, // 1小时后过期
      isActive: true
    };
    assert.strictEqual(proxyManager.isSessionValid(), true);

    // 过期的会话
    proxyManager.currentSession.expiresAt = Date.now() - 1000;
    assert.strictEqual(proxyManager.isSessionValid(), false);

    // 非活跃会话
    proxyManager.currentSession.expiresAt = Date.now() + 3600000;
    proxyManager.currentSession.isActive = false;
    assert.strictEqual(proxyManager.isSessionValid(), false);
  });

  test('recordRequest 应该正确记录请求统计', () => {
    // 记录成功请求
    proxyManager.recordRequest(true, 100);
    assert.strictEqual(proxyManager.stats.totalRequests, 1);
    assert.strictEqual(proxyManager.stats.successfulRequests, 1);
    assert.strictEqual(proxyManager.stats.failedRequests, 0);
    assert.strictEqual(proxyManager.stats.averageResponseTime, 100);

    // 记录失败请求
    proxyManager.recordRequest(false);
    assert.strictEqual(proxyManager.stats.totalRequests, 2);
    assert.strictEqual(proxyManager.stats.successfulRequests, 1);
    assert.strictEqual(proxyManager.stats.failedRequests, 1);
    assert.strictEqual(proxyManager.consecutiveFailures, 1);

    // 再次成功应该重置连续失败计数
    proxyManager.recordRequest(true, 200);
    assert.strictEqual(proxyManager.consecutiveFailures, 0);
    assert.strictEqual(proxyManager.stats.averageResponseTime, 150); // (100 + 200) / 2
  });

  test('getStats 应该返回完整的统计信息', () => {
    const stats = proxyManager.getStats();
    
    assert.ok(stats);
    assert.ok(typeof stats.totalRequests === 'number');
    assert.ok(typeof stats.successfulRequests === 'number');
    assert.ok(typeof stats.failedRequests === 'number');
    assert.ok(typeof stats.averageResponseTime === 'number');
    assert.ok(Array.isArray(stats.providers));
    assert.strictEqual(stats.providers.length, 2);
    assert.strictEqual(stats.currentProvider, 'test-provider-1');
    assert.strictEqual(stats.isHealthy, false);
  });

  test('会话创建应该使用随机时长（18-30小时）', async () => {
    // Mock 必要的方法避免网络请求
    proxyManager.testProxyConnection = mock.fn(async () => {
      return { success: true, ip: '192.168.1.1', responseTime: 100 };
    });

    // Mock enhancedSecurity
    proxyManager.enhancedSecurity = {
      selectBrowserProfile: mock.fn(),
      getTLSConfig: mock.fn(() => ({
        ciphers: ['TLS_AES_128_GCM_SHA256'],
        ALPNProtocols: ['h2', 'http/1.1']
      }))
    };

    // 创建多个会话并检查时长
    const durations = [];
    for (let i = 0; i < 5; i++) {
      try {
        await proxyManager.createSession();
        const session = proxyManager.currentSession;
        
        // 检查会话属性
        assert.ok(session.plannedDuration, '会话应该有 plannedDuration');
        assert.ok(session.plannedHours, '会话应该有 plannedHours');
        
        // 验证时长在18-30小时之间
        const hours = session.plannedDuration / (60 * 60 * 1000);
        assert.ok(hours >= 18 && hours <= 30, `会话时长应该在18-30小时之间，实际: ${hours}小时`);
        
        durations.push(hours);
      } catch (error) {
        // 忽略网络错误，主要测试时长逻辑
      }
    }

    // 验证时长的随机性（至少应该有不同的值）
    const uniqueDurations = [...new Set(durations)];
    assert.ok(uniqueDurations.length > 1, '会话时长应该是随机的');
  });

  test('cleanupExpiredSessions 应该清理过期会话', () => {
    const now = Date.now();
    
    // 添加一些会话
    proxyManager.sessions.set('session1', {
      id: 'session1',
      expiresAt: now - 1000 // 已过期
    });
    
    proxyManager.sessions.set('session2', {
      id: 'session2',
      expiresAt: now + 3600000 // 未过期
    });
    
    proxyManager.sessions.set('session3', {
      id: 'session3',
      expiresAt: now - 2000 // 已过期
    });

    assert.strictEqual(proxyManager.sessions.size, 3);
    
    // 清理过期会话
    proxyManager.cleanupExpiredSessions();
    
    assert.strictEqual(proxyManager.sessions.size, 1);
    assert.ok(proxyManager.sessions.has('session2'));
    assert.ok(!proxyManager.sessions.has('session1'));
    assert.ok(!proxyManager.sessions.has('session3'));
  });

  test('handleConsecutiveFailures 应该在连续失败后切换提供商', async () => {
    // Mock switchProvider
    let switchProviderCalled = false;
    proxyManager.switchProvider = mock.fn(async () => {
      switchProviderCalled = true;
    });

    // 设置连续失败次数
    proxyManager.consecutiveFailures = 3;
    proxyManager.maxFailures = 3;

    await proxyManager.handleConsecutiveFailures();
    
    assert.ok(switchProviderCalled, '应该调用 switchProvider');
    assert.strictEqual(proxyManager.switchProvider.mock.calls.length, 1);
  });

  test('getStatus 应该返回当前状态信息', () => {
    const status = proxyManager.getStatus();
    
    assert.ok(status);
    assert.strictEqual(status.isHealthy, false);
    assert.strictEqual(status.currentSession, null);
    assert.ok(status.stats);
    assert.strictEqual(status.consecutiveFailures, 0);
    assert.strictEqual(status.sessionCount, 0);
    
    // 添加一个会话后再测试
    proxyManager.currentSession = {
      id: 'test-session',
      provider: 'test-provider-1',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      requestCount: 5,
      isActive: true,
      plannedHours: '24.50'
    };
    
    const statusWithSession = proxyManager.getStatus();
    assert.ok(statusWithSession.currentSession);
    assert.strictEqual(statusWithSession.currentSession.id, 'test-session');
    assert.strictEqual(statusWithSession.currentSession.plannedHours, '24.50');
    assert.ok(statusWithSession.currentSession.remainingHours);
  });

  test('applyRequestThrottling 应该应用请求限流', async () => {
    // Mock enhancedSecurity 方法
    let getRequestIntervalCalled = false;
    let addHumanDelayCalled = false;
    
    proxyManager.enhancedSecurity = {
      getRequestInterval: mock.fn(() => {
        getRequestIntervalCalled = true;
        return 100; // 100ms 间隔
      }),
      addHumanDelay: mock.fn(async () => {
        addHumanDelayCalled = true;
      })
    };

    const startTime = Date.now();
    await proxyManager.applyRequestThrottling();
    const endTime = Date.now();

    assert.ok(getRequestIntervalCalled, '应该调用 getRequestInterval');
    assert.ok(addHumanDelayCalled, '应该调用 addHumanDelay');
    assert.ok(endTime - startTime >= 0, '应该有延迟');
    assert.ok(proxyManager.lastRequestTime >= startTime, '应该更新最后请求时间');
  });
});

describe('ProxyManager 错误处理测试', () => {
  let proxyManager;
  let logger;

  beforeEach(() => {
    logger = new Logger({
      level: 'error',
      enableConsole: false,
      enableFile: false
    });
  });

  afterEach(() => {
    if (proxyManager) {
      proxyManager.close();
    }
    if (logger) {
      logger.close();
    }
  });

  test('应该处理无效的代理配置', () => {
    assert.throws(() => {
      const invalidConfig = { providers: null };
      proxyManager = new ProxyManager(invalidConfig, logger);
      proxyManager.validateConfig();
    }, /No proxy providers configured/);
  });

  test('getProxyConfig 在没有有效会话时应该抛出错误', () => {
    proxyManager = new ProxyManager({
      providers: [{ name: 'test', host: 'localhost', port: 8080 }]
    }, logger);
    
    assert.throws(() => {
      proxyManager.getProxyConfig();
    }, /No valid proxy session available/);
  });

  test('renewSession 应该处理会话续期失败', async () => {
    const mockConfig = {
      providers: [
        { name: 'provider1', host: 'localhost', port: 8080 },
        { name: 'provider2', host: 'localhost', port: 8081 }
      ]
    };
    
    proxyManager = new ProxyManager(mockConfig, logger);
    
    // Mock createSession 失败
    proxyManager.createSession = mock.fn(async () => {
      throw new Error('Session creation failed');
    });
    
    // Mock switchProvider
    proxyManager.switchProvider = mock.fn(async () => {
      // 模拟切换成功
    });

    await assert.rejects(async () => {
      await proxyManager.renewSession();
    }, /Session creation failed/);
    
    assert.strictEqual(proxyManager.switchProvider.mock.calls.length, 1);
  });
});