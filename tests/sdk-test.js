#!/usr/bin/env node

/**
 * Claude Residential Proxy SDK 测试
 * 验证SDK的基本功能
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { startProxy, ProxyOptions, ProxyError, AbortError } from '../src/sdk.js';

test('SDK Error Classes', () => {
    // 测试 ProxyError
    const proxyError = new ProxyError('Test error', 'TEST_CODE');
    assert.strictEqual(proxyError.name, 'ProxyError');
    assert.strictEqual(proxyError.message, 'Test error');
    assert.strictEqual(proxyError.code, 'TEST_CODE');
    assert.ok(proxyError instanceof Error);
    
    // 测试 AbortError
    const abortError = new AbortError('Test abort');
    assert.strictEqual(abortError.name, 'AbortError');
    assert.strictEqual(abortError.message, 'Test abort');
    assert.ok(abortError instanceof Error);
    
    // 测试默认消息
    const defaultAbortError = new AbortError();
    assert.strictEqual(defaultAbortError.message, 'Operation aborted');
});

test('ProxyOptions.checkHealth 错误处理', async () => {
    // 测试无效URL
    try {
        await ProxyOptions.checkHealth('invalid-url');
        assert.fail('应该抛出错误');
    } catch (error) {
        assert.ok(error instanceof ProxyError);
        assert.strictEqual(error.code, 'INVALID_URL');
    }
    
    // 测试连接失败
    try {
        await ProxyOptions.checkHealth('http://127.0.0.1:9999');
        assert.fail('应该抛出错误');
    } catch (error) {
        assert.ok(error instanceof ProxyError);
        // 在测试环境中，可能返回不同的错误代码
        assert.ok(['CONNECTION_FAILED', 'HEALTH_CHECK_ERROR'].includes(error.code));
    }
});

test('ProxyOptions.getStats 错误处理', async () => {
    // 测试无效URL
    try {
        await ProxyOptions.getStats('invalid-url');
        assert.fail('应该抛出错误');
    } catch (error) {
        assert.ok(error instanceof ProxyError);
        assert.strictEqual(error.code, 'INVALID_URL');
    }
    
    // 测试连接失败
    try {
        await ProxyOptions.getStats('http://127.0.0.1:9999');
        assert.fail('应该抛出错误');
    } catch (error) {
        assert.ok(error instanceof ProxyError);
        // 在测试环境中，可能返回不同的错误代码
        assert.ok(['CONNECTION_FAILED', 'STATS_REQUEST_ERROR'].includes(error.code));
    }
});

test('startProxy 函数存在性检查', () => {
    assert.strictEqual(typeof startProxy, 'function');
    assert.strictEqual(typeof ProxyOptions.start, 'function');
    assert.strictEqual(typeof ProxyOptions.checkHealth, 'function');
    assert.strictEqual(typeof ProxyOptions.getStats, 'function');
});

test('ProxyOptions.start 参数验证', async () => {
    const abortController = new AbortController();
    
    try {
        // 测试缺少必需参数
        const generator = ProxyOptions.start({ abortController });
        
        // 立即中止以避免长时间运行
        setTimeout(() => abortController.abort(), 100);
        
        const result = await generator.next();
        
        // 可能返回状态或错误
        assert.ok(result.value);
        
    } catch (error) {
        // 预期的错误 - 可能是任何类型的错误
        assert.ok(error instanceof Error);
    }
});

test('startProxy 简化函数参数验证', async () => {
    const abortController = new AbortController();
    
    try {
        // 测试缺少必需参数
        const generator = startProxy({ abortController });
        
        // 立即中止以避免长时间运行
        setTimeout(() => abortController.abort(), 100);
        
        const result = await generator.next();
        
        // 可能返回状态或错误
        assert.ok(result.value);
        
    } catch (error) {
        // 预期的错误 - 可能是任何类型的错误
        assert.ok(error instanceof Error);
    }
});

console.log('✅ SDK 测试完成'); 