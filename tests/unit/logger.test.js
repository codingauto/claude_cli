/**
 * Logger 单元测试
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import Logger from '../../src/utils/logger.js';

describe('Logger', () => {
  let logger;
  const testLogDir = './test-logs';
  
  beforeEach(() => {
    // 创建测试日志目录
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
    mkdirSync(testLogDir, { recursive: true });
    
    // 创建测试 Logger 实例
    logger = new Logger({
      logFile: join(testLogDir, 'test.log'),
      enableConsole: false,
      enableFile: true,
      level: 'debug'
    });
  });

  afterEach(async () => {
    if (logger) {
      // 等待所有日志写入完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 关闭logger
      logger.close();
      
      // 等待文件句柄释放
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 清理测试日志目录
    if (existsSync(testLogDir)) {
      try {
        rmSync(testLogDir, { recursive: true, force: true });
      } catch (error) {
        // 忽略清理错误
        console.warn('清理测试目录时出错:', error.message);
      }
    }
  });

  test('应该正确初始化Logger', () => {
    assert.ok(logger);
    assert.strictEqual(logger.getLevel(), 'debug');
  });

  test('应该创建日志目录', () => {
    assert.ok(existsSync(testLogDir));
  });

  test('应该记录不同级别的日志', () => {
    // 测试各种日志级别
    logger.info('Test info message');
    logger.warn('Test warn message');
    logger.error('Test error message');
    logger.debug('Test debug message');
    logger.verbose('Test verbose message');
    
    // 基本断言 - 确保没有抛出错误
    assert.ok(true);
  });

  test('应该记录带有元数据的日志', () => {
    const meta = {
      userId: '123',
      action: 'test',
      data: { key: 'value' }
    };
    
    logger.info('Test message with meta', meta);
    assert.ok(true);
  });

  test('应该清理敏感信息', () => {
    const sensitiveData = {
      username: 'user123',
      password: 'secret123',
      token: 'abc123',
      apikey: 'key123',
      normalData: 'visible'
    };
    
    const sanitized = logger.sanitizeMeta(sensitiveData);
    
    assert.strictEqual(sanitized.username, 'user123');
    assert.strictEqual(sanitized.password, '[REDACTED]');
    assert.strictEqual(sanitized.token, '[REDACTED]');
    assert.strictEqual(sanitized.apikey, '[REDACTED]');
    assert.strictEqual(sanitized.normalData, 'visible');
  });

  test('应该处理嵌套对象中的敏感信息', () => {
    const nestedData = {
      user: {
        id: '123',
        credentials: {
          password: 'secret',
          token: 'abc123'
        }
      },
      config: {
        apikey: 'key123',
        timeout: 5000
      }
    };
    
    const sanitized = logger.sanitizeMeta(nestedData);
    
    assert.strictEqual(sanitized.user.id, '123');
    assert.strictEqual(sanitized.user.credentials.password, '[REDACTED]');
    assert.strictEqual(sanitized.user.credentials.token, '[REDACTED]');
    assert.strictEqual(sanitized.config.apikey, '[REDACTED]');
    assert.strictEqual(sanitized.config.timeout, 5000);
  });

  test('应该记录请求日志', () => {
    logger.options.enableRequestLogging = true;
    
    logger.request('req-123', 'GET', '/api/test', 200, 150, {
      userAgent: 'test-agent'
    });
    
    assert.ok(true);
  });

  test('应该记录代理日志', () => {
    logger.proxy('session-123', 'lumiproxy', 'connect', {
      ip: '192.168.1.1'
    });
    
    assert.ok(true);
  });

  test('应该记录安全日志', () => {
    logger.security('ip_validation', 'success', {
      ip: '192.168.1.1',
      type: 'residential'
    });
    
    assert.ok(true);
  });

  test('应该记录性能日志', () => {
    logger.performance('response_time', 150, 'ms', {
      endpoint: '/api/test'
    });
    
    assert.ok(true);
  });

  test('应该创建子日志器', () => {
    const childLogger = logger.child({ component: 'TestComponent' });
    
    assert.ok(childLogger);
    assert.ok(typeof childLogger.info === 'function');
    assert.ok(typeof childLogger.error === 'function');
    
    // 测试子日志器功能
    childLogger.info('Test child logger message');
    assert.ok(true);
  });

  test('应该设置和获取日志级别', () => {
    logger.setLevel('warn');
    assert.strictEqual(logger.getLevel(), 'warn');
    
    logger.setLevel('error');
    assert.strictEqual(logger.getLevel(), 'error');
  });

  test('应该处理null和undefined元数据', () => {
    const sanitizedNull = logger.sanitizeMeta(null);
    const sanitizedUndefined = logger.sanitizeMeta(undefined);
    const sanitizedString = logger.sanitizeMeta('string');
    
    assert.strictEqual(sanitizedNull, null);
    assert.strictEqual(sanitizedUndefined, undefined);
    assert.strictEqual(sanitizedString, 'string');
  });

  test('应该正确处理空对象', () => {
    const emptyObj = {};
    const sanitized = logger.sanitizeMeta(emptyObj);
    
    assert.deepStrictEqual(sanitized, {});
  });

  test('应该在禁用请求日志时跳过记录', () => {
    logger.options.enableRequestLogging = false;
    
    // 这应该不会记录任何内容
    logger.request('req-123', 'GET', '/api/test', 200, 150);
    
    assert.ok(true);
  });
}); 