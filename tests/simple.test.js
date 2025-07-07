/**
 * 简化功能测试 - 专注于核心组件测试
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';

// 导入核心组件
import Logger from '../src/utils/logger.js';
import ProxyManager from '../src/managers/ProxyManager.js';
import SessionManager from '../src/managers/SessionManager.js';
import SecurityManager from '../src/managers/SecurityManager.js';

describe('核心组件测试', () => {
  let logger, proxyManager, sessionManager, securityManager;
  
  beforeEach(() => {
    // 创建测试配置
    const testProxyConfig = {
      providers: [
        {
          name: 'test-provider',
          host: 'proxy.example.com',
          port: 8080,
          username: 'testuser',
          password: 'testpass'
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
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timing: {
        minDelay: 100,
        maxDelay: 500,
        requestInterval: 1000
      }
    };
    
    // 初始化组件
    logger = new Logger({
      level: 'error',
      enableConsole: false,
      enableFile: false
    });
    
    proxyManager = new ProxyManager(testProxyConfig, logger);
    sessionManager = new SessionManager(testProxyConfig, logger);
    securityManager = new SecurityManager(testSecurityConfig, logger);
  });
  
  afterEach(() => {
    if (sessionManager) {
      sessionManager.close();
    }
    if (proxyManager) {
      proxyManager.close();
    }
    if (logger) {
      logger.close();
    }
  });

  test('Logger 应该正确初始化', () => {
    assert.ok(logger);
    assert.strictEqual(typeof logger.info, 'function');
    assert.strictEqual(typeof logger.error, 'function');
    assert.strictEqual(typeof logger.debug, 'function');
  });

  test('ProxyManager 应该正确初始化', () => {
    assert.ok(proxyManager);
    assert.strictEqual(typeof proxyManager.getStats, 'function');
    assert.strictEqual(typeof proxyManager.checkHealth, 'function');
    assert.strictEqual(proxyManager.isHealthy, false); // 初始状态
  });

  test('SessionManager 应该正确创建会话', async () => {
    assert.ok(sessionManager);
    
    const session = await sessionManager.createSession({
      ip: '192.168.1.100',
      region: 'US'
    });
    
    assert.ok(session);
    assert.ok(session.id);
    assert.strictEqual(session.ip, '192.168.1.100');
    assert.strictEqual(session.status, 'active');
    
    const currentSession = sessionManager.getCurrentSession();
    assert.strictEqual(currentSession.id, session.id);
  });

  test('SecurityManager 应该正确生成请求配置', () => {
    assert.ok(securityManager);
    
    const config = securityManager.getRequestConfig();
    assert.ok(config);
    assert.ok(config.headers);
    assert.ok(config.headers['User-Agent']);
    assert.strictEqual(config.timeout, 30000);
  });

  test('SecurityManager 应该验证IP安全性', () => {
    const validResult = securityManager.validateIPSecurity('192.168.1.100', {
      org: 'Residential ISP',
      country: 'US'
    });
    
    assert.ok(validResult.isSecure);
    assert.strictEqual(validResult.issues.length, 0);
    assert.strictEqual(validResult.score, 100);
    
    const invalidResult = securityManager.validateIPSecurity('1.2.3.4', {
      org: 'Amazon Technologies Inc.',
      asn: 'AS16509'
    });
    
    assert.strictEqual(invalidResult.isSecure, false);
    assert.ok(invalidResult.issues.length > 0);
  });

  test('SessionManager 应该正确处理会话续期', async () => {
    const session = await sessionManager.createSession();
    assert.ok(session);
    
    const renewed = await sessionManager.renewSession(session.id);
    assert.strictEqual(renewed, true);
    
    const currentSession = sessionManager.getCurrentSession();
    assert.strictEqual(currentSession.status, 'renewed');
  });

  test('SecurityManager 应该清理敏感信息', () => {
    const testData = {
      username: 'test',
      password: 'secret123',
      authorization: 'Bearer token123',
      normalField: 'normal value'
    };
    
    const sanitized = securityManager.sanitizeLogData(testData);
    
    assert.strictEqual(sanitized.username, 'test');
    assert.strictEqual(sanitized.password, '[REDACTED]');
    assert.strictEqual(sanitized.authorization, '[REDACTED]');
    assert.strictEqual(sanitized.normalField, 'normal value');
  });

  test('ProxyManager 应该正确获取统计信息', () => {
    const stats = proxyManager.getStats();
    
    assert.ok(stats);
    assert.ok(typeof stats.totalRequests === 'number');
    assert.ok(typeof stats.successfulRequests === 'number');
    assert.ok(typeof stats.failedRequests === 'number');
    assert.ok(Array.isArray(stats.providers));
  });

  test('SessionManager 应该正确获取统计信息', async () => {
    await sessionManager.createSession();
    
    const stats = sessionManager.getStats();
    
    assert.ok(stats);
    assert.ok(stats.current);
    assert.ok(stats.total);
    assert.strictEqual(stats.total.activeSessions, 1);
  });

  test('SecurityManager 应该生成唯一的请求ID', () => {
    const id1 = securityManager.generateRequestId();
    const id2 = securityManager.generateRequestId();
    
    assert.ok(id1);
    assert.ok(id2);
    assert.notStrictEqual(id1, id2);
    assert.strictEqual(id1.length, 32); // 16 bytes = 32 hex chars
  });
});

describe('配置文件测试', () => {
  test('应该能够读取代理配置文件', () => {
    const configPath = './config/proxy.json';
    
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      assert.ok(config);
      assert.ok(Array.isArray(config.providers) || config.providers === undefined);
    } else {
      // 配置文件不存在也是可以的，会使用默认配置
      assert.ok(true);
    }
  });

  test('应该能够读取安全配置文件', () => {
    const configPath = './config/security.json';
    
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      assert.ok(config);
    } else {
      // 配置文件不存在也是可以的，会使用默认配置
      assert.ok(true);
    }
  });
});

describe('错误处理测试', () => {
  test('SessionManager 应该处理无效的会话ID', async () => {
    const sessionManager = new SessionManager({}, new Logger({
      level: 'error',
      enableConsole: false,
      enableFile: false
    }));
    
    const renewed = await sessionManager.renewSession('invalid-session-id');
    assert.strictEqual(renewed, false);
    
    sessionManager.close();
  });

  test('SecurityManager 应该处理空的日志数据', () => {
    const securityManager = new SecurityManager({}, new Logger({
      level: 'error',
      enableConsole: false,
      enableFile: false
    }));
    
    assert.strictEqual(securityManager.sanitizeLogData(null), null);
    assert.strictEqual(securityManager.sanitizeLogData(undefined), undefined);
    assert.strictEqual(securityManager.sanitizeLogData('string'), 'string');
    assert.deepStrictEqual(securityManager.sanitizeLogData({}), {});
  });
}); 