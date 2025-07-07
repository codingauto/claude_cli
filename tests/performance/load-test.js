/**
 * 性能测试
 * 测试并发处理能力和长时间运行稳定性
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import axios from 'axios';
import { setTimeout as delay } from 'timers/promises';
import os from 'os';

const TEST_PORT = 8889;
const TEST_BASE_URL = `http://localhost:${TEST_PORT}`;

describe('性能测试', () => {
  let serverProcess;

  beforeEach(async () => {
    // 启动测试服务器
    serverProcess = spawn('node', ['src/index.js'], {
      env: {
        ...process.env,
        PORT: TEST_PORT,
        NODE_ENV: 'test',
        SKIP_PROVIDER_PROMPT: 'true',
        LOG_LEVEL: 'error' // 减少日志输出
      }
    });

    // 等待服务器启动
    await delay(3000);
  });

  afterEach(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await delay(1000);
    }
  });

  test('应该能够处理并发请求', async () => {
    const concurrentRequests = 10;
    const requests = [];

    // 记录开始时间
    const startTime = Date.now();

    // 创建并发请求
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        axios.get(`${TEST_BASE_URL}/health`).catch(err => ({
          error: err.message,
          status: err.response?.status
        }))
      );
    }

    // 等待所有请求完成
    const results = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // 验证结果
    let successCount = 0;
    let errorCount = 0;

    results.forEach(result => {
      if (result.data && result.status === 200) {
        successCount++;
      } else {
        errorCount++;
      }
    });

    console.log(`并发测试结果: ${successCount}/${concurrentRequests} 成功, 耗时: ${totalTime}ms`);

    // 至少 80% 的请求应该成功
    assert.ok(successCount >= concurrentRequests * 0.8, 
      `成功率过低: ${successCount}/${concurrentRequests}`);
    
    // 平均响应时间应该合理
    const avgResponseTime = totalTime / concurrentRequests;
    assert.ok(avgResponseTime < 1000, 
      `平均响应时间过长: ${avgResponseTime}ms`);
  });

  test('应该能够处理持续的请求负载', async () => {
    const duration = 10000; // 10秒
    const startTime = Date.now();
    let requestCount = 0;
    let errorCount = 0;
    const responseTimes = [];

    // 持续发送请求
    while (Date.now() - startTime < duration) {
      const reqStartTime = Date.now();
      
      try {
        const response = await axios.get(`${TEST_BASE_URL}/stats`);
        if (response.status === 200) {
          requestCount++;
          responseTimes.push(Date.now() - reqStartTime);
        }
      } catch (error) {
        errorCount++;
      }

      // 短暂延迟避免过度负载
      await delay(100);
    }

    const totalRequests = requestCount + errorCount;
    const successRate = requestCount / totalRequests;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    console.log(`持续负载测试结果:
      总请求数: ${totalRequests}
      成功请求: ${requestCount}
      失败请求: ${errorCount}
      成功率: ${(successRate * 100).toFixed(2)}%
      平均响应时间: ${avgResponseTime.toFixed(2)}ms
      最小响应时间: ${minResponseTime}ms
      最大响应时间: ${maxResponseTime}ms
    `);

    // 验证性能指标
    assert.ok(successRate > 0.95, `成功率应该大于95%，实际: ${(successRate * 100).toFixed(2)}%`);
    assert.ok(avgResponseTime < 200, `平均响应时间应该小于200ms，实际: ${avgResponseTime.toFixed(2)}ms`);
    assert.ok(maxResponseTime < 1000, `最大响应时间应该小于1秒，实际: ${maxResponseTime}ms`);
  });

  test('内存使用应该保持稳定', async () => {
    const memorySnapshots = [];
    const duration = 15000; // 15秒
    const interval = 1000; // 每秒采样

    // 获取初始内存使用
    const initialMemory = process.memoryUsage();
    memorySnapshots.push({
      time: 0,
      heapUsed: initialMemory.heapUsed,
      external: initialMemory.external,
      rss: initialMemory.rss
    });

    // 持续监控内存使用
    const startTime = Date.now();
    let requestCount = 0;

    while (Date.now() - startTime < duration) {
      // 发送请求
      try {
        await axios.get(`${TEST_BASE_URL}/health`);
        requestCount++;
      } catch (error) {
        // 忽略错误
      }

      // 记录内存使用
      const memory = process.memoryUsage();
      memorySnapshots.push({
        time: Date.now() - startTime,
        heapUsed: memory.heapUsed,
        external: memory.external,
        rss: memory.rss
      });

      await delay(interval);
    }

    // 分析内存使用趋势
    const initialHeap = memorySnapshots[0].heapUsed;
    const finalHeap = memorySnapshots[memorySnapshots.length - 1].heapUsed;
    const heapGrowth = ((finalHeap - initialHeap) / initialHeap) * 100;

    const maxHeap = Math.max(...memorySnapshots.map(s => s.heapUsed));
    const avgHeap = memorySnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / memorySnapshots.length;

    console.log(`内存使用测试结果:
      初始堆内存: ${(initialHeap / 1024 / 1024).toFixed(2)}MB
      最终堆内存: ${(finalHeap / 1024 / 1024).toFixed(2)}MB
      堆内存增长: ${heapGrowth.toFixed(2)}%
      最大堆内存: ${(maxHeap / 1024 / 1024).toFixed(2)}MB
      平均堆内存: ${(avgHeap / 1024 / 1024).toFixed(2)}MB
      总请求数: ${requestCount}
    `);

    // 验证内存使用
    assert.ok(heapGrowth < 50, `堆内存增长应该小于50%，实际: ${heapGrowth.toFixed(2)}%`);
    assert.ok(maxHeap < 200 * 1024 * 1024, `最大堆内存应该小于200MB，实际: ${(maxHeap / 1024 / 1024).toFixed(2)}MB`);
  });
});

describe('压力测试', () => {
  let serverProcess;

  beforeEach(async () => {
    serverProcess = spawn('node', ['src/index.js'], {
      env: {
        ...process.env,
        PORT: TEST_PORT,
        NODE_ENV: 'test',
        SKIP_PROVIDER_PROMPT: 'true',
        LOG_LEVEL: 'error'
      }
    });
    await delay(3000);
  });

  afterEach(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await delay(1000);
    }
  });

  test('应该能够从高负载恢复', async () => {
    // 阶段1: 正常负载
    console.log('阶段1: 正常负载测试...');
    let normalSuccessCount = 0;
    for (let i = 0; i < 10; i++) {
      try {
        await axios.get(`${TEST_BASE_URL}/health`);
        normalSuccessCount++;
      } catch (error) {
        // 忽略
      }
      await delay(100);
    }

    // 阶段2: 高负载
    console.log('阶段2: 高负载测试...');
    const highLoadRequests = [];
    for (let i = 0; i < 50; i++) {
      highLoadRequests.push(
        axios.get(`${TEST_BASE_URL}/health`, { timeout: 5000 })
          .catch(() => null)
      );
    }
    await Promise.all(highLoadRequests);

    // 阶段3: 恢复期
    console.log('阶段3: 恢复期测试...');
    await delay(2000); // 给服务器恢复时间

    let recoverySuccessCount = 0;
    for (let i = 0; i < 10; i++) {
      try {
        await axios.get(`${TEST_BASE_URL}/health`);
        recoverySuccessCount++;
      } catch (error) {
        // 忽略
      }
      await delay(100);
    }

    console.log(`压力测试结果:
      正常负载成功率: ${normalSuccessCount}/10
      恢复期成功率: ${recoverySuccessCount}/10
    `);

    // 验证恢复能力
    assert.ok(normalSuccessCount >= 8, '正常负载时成功率应该高于80%');
    assert.ok(recoverySuccessCount >= 8, '恢复期成功率应该高于80%');
  });
});

describe('资源使用测试', () => {
  test('CPU 使用应该保持在合理范围', async () => {
    const serverProcess = spawn('node', ['src/index.js'], {
      env: {
        ...process.env,
        PORT: TEST_PORT,
        NODE_ENV: 'test',
        SKIP_PROVIDER_PROMPT: 'true',
        LOG_LEVEL: 'error'
      }
    });

    await delay(3000);

    // 获取进程PID
    const pid = serverProcess.pid;
    
    // 监控CPU使用（简化版本）
    const cpuUsages = [];
    const startUsage = process.cpuUsage();
    const startTime = Date.now();

    // 发送一些请求
    for (let i = 0; i < 20; i++) {
      try {
        await axios.get(`${TEST_BASE_URL}/stats`);
      } catch (error) {
        // 忽略
      }
      await delay(500);
    }

    const endUsage = process.cpuUsage(startUsage);
    const elapsedTime = Date.now() - startTime;
    
    // 计算CPU使用百分比
    const userCPUPercent = (endUsage.user / 1000 / elapsedTime) * 100;
    const systemCPUPercent = (endUsage.system / 1000 / elapsedTime) * 100;
    const totalCPUPercent = userCPUPercent + systemCPUPercent;

    console.log(`CPU使用测试结果:
      用户CPU: ${userCPUPercent.toFixed(2)}%
      系统CPU: ${systemCPUPercent.toFixed(2)}%
      总CPU: ${totalCPUPercent.toFixed(2)}%
    `);

    // 验证CPU使用
    assert.ok(totalCPUPercent < 50, `CPU使用应该小于50%，实际: ${totalCPUPercent.toFixed(2)}%`);

    serverProcess.kill('SIGTERM');
    await delay(1000);
  });
});