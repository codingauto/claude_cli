/**
 * BehaviorManager 单元测试
 * 测试人类行为模拟状态机
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import BehaviorManager from '../../src/managers/BehaviorManager.js';
import Logger from '../../src/utils/logger.js';

describe('BehaviorManager 单元测试', () => {
  let behaviorManager;
  let logger;

  beforeEach(() => {
    logger = new Logger({
      level: 'error',
      enableConsole: false,
      enableFile: false
    });
    behaviorManager = new BehaviorManager(logger);
  });

  test('应该正确初始化', () => {
    assert.ok(behaviorManager);
    assert.strictEqual(behaviorManager.currentState, behaviorManager.STATES.IDLE);
    assert.ok(behaviorManager.stateStartTime);
    assert.ok(Array.isArray(behaviorManager.requestHistory));
    assert.strictEqual(behaviorManager.requestHistory.length, 0);
  });

  test('状态定义应该包含所有必要状态', () => {
    assert.ok(behaviorManager.STATES.ACTIVE);
    assert.ok(behaviorManager.STATES.THINKING);
    assert.ok(behaviorManager.STATES.IDLE);
    assert.strictEqual(Object.keys(behaviorManager.STATES).length, 3);
  });

  test('recordRequest 应该记录请求历史', () => {
    assert.strictEqual(behaviorManager.requestHistory.length, 0);
    
    behaviorManager.recordRequest();
    assert.strictEqual(behaviorManager.requestHistory.length, 1);
    
    behaviorManager.recordRequest();
    assert.strictEqual(behaviorManager.requestHistory.length, 2);
    
    // 测试历史记录大小限制
    for (let i = 0; i < 25; i++) {
      behaviorManager.recordRequest();
    }
    assert.strictEqual(behaviorManager.requestHistory.length, 20); // maxHistorySize
  });

  test('getNextDelay 应该根据状态返回合适的延迟', () => {
    // IDLE 状态 - 长延迟
    behaviorManager.currentState = behaviorManager.STATES.IDLE;
    const idleDelay = behaviorManager.getNextDelay();
    assert.ok(idleDelay >= 27000, 'IDLE延迟应该至少27秒（30秒-10%）');
    assert.ok(idleDelay <= 132000, 'IDLE延迟不应超过132秒（120秒+10%）');
    
    // ACTIVE 状态 - 短延迟
    behaviorManager.currentState = behaviorManager.STATES.ACTIVE;
    const activeDelay = behaviorManager.getNextDelay();
    assert.ok(activeDelay >= 90, 'ACTIVE延迟应该至少90ms（100ms-10%）');
    assert.ok(activeDelay <= 550, 'ACTIVE延迟不应超过550ms（500ms+10%）');
    
    // THINKING 状态 - 中等延迟
    behaviorManager.currentState = behaviorManager.STATES.THINKING;
    const thinkingDelay = behaviorManager.getNextDelay();
    assert.ok(thinkingDelay >= 1800, 'THINKING延迟应该至少1800ms（2000ms-10%）');
    assert.ok(thinkingDelay <= 5500, 'THINKING延迟不应超过5500ms（5000ms+10%）');
  });

  test('calculateRequestFrequency 应该正确计算请求频率', () => {
    // 初始没有请求
    assert.strictEqual(behaviorManager.calculateRequestFrequency(), 0);
    
    // 添加一些最近的请求
    const now = Date.now();
    behaviorManager.requestHistory = [
      now - 10000,  // 10秒前
      now - 20000,  // 20秒前
      now - 30000,  // 30秒前
      now - 40000,  // 40秒前
      now - 50000,  // 50秒前
      now - 70000   // 70秒前（超过1分钟）
    ];
    
    // 应该只计算1分钟内的请求（前5个）
    assert.strictEqual(behaviorManager.calculateRequestFrequency(), 5);
  });

  test('setState 应该强制设置状态', () => {
    assert.strictEqual(behaviorManager.currentState, behaviorManager.STATES.IDLE);
    
    behaviorManager.setState('ACTIVE');
    assert.strictEqual(behaviorManager.currentState, behaviorManager.STATES.ACTIVE);
    
    behaviorManager.setState('THINKING');
    assert.strictEqual(behaviorManager.currentState, behaviorManager.STATES.THINKING);
    
    // 测试无效状态
    assert.throws(() => {
      behaviorManager.setState('INVALID_STATE');
    }, /Invalid state/);
  });

  test('transitionTo 应该正确转换状态', () => {
    const initialState = behaviorManager.currentState;
    const initialTime = behaviorManager.stateStartTime;
    
    behaviorManager.transitionTo(behaviorManager.STATES.ACTIVE);
    assert.strictEqual(behaviorManager.currentState, behaviorManager.STATES.ACTIVE);
    assert.ok(behaviorManager.stateStartTime >= initialTime);
    
    // 转换到相同状态不应该改变
    const sameStateTime = behaviorManager.stateStartTime;
    behaviorManager.transitionTo(behaviorManager.STATES.ACTIVE);
    assert.strictEqual(behaviorManager.stateStartTime, sameStateTime);
  });

  test('shouldTransition 应该基于请求频率决定是否转换', () => {
    // 设置不同的场景
    
    // 场景1: ACTIVE状态但请求很少
    behaviorManager.currentState = behaviorManager.STATES.ACTIVE;
    let transitionChance = 0;
    let shouldTransitionCount = 0;
    
    // 多次测试以获得概率估计
    for (let i = 0; i < 100; i++) {
      if (behaviorManager.shouldTransition(3)) { // 请求频率低
        shouldTransitionCount++;
      }
    }
    // 应该有约50%的概率转换
    assert.ok(shouldTransitionCount > 30 && shouldTransitionCount < 70, 
      `ACTIVE状态低请求频率应该有约50%概率转换，实际: ${shouldTransitionCount}%`);
    
    // 场景2: IDLE状态但请求很多
    behaviorManager.currentState = behaviorManager.STATES.IDLE;
    shouldTransitionCount = 0;
    for (let i = 0; i < 100; i++) {
      if (behaviorManager.shouldTransition(15)) { // 请求频率高
        shouldTransitionCount++;
      }
    }
    // 应该有约80%的概率转换
    assert.ok(shouldTransitionCount > 65 && shouldTransitionCount < 95,
      `IDLE状态高请求频率应该有约80%概率转换，实际: ${shouldTransitionCount}%`);
  });

  test('selectNewState 应该根据概率选择新状态', () => {
    // 测试从不同状态的转换
    const stateTransitions = {
      ACTIVE: { ACTIVE: 0, THINKING: 0, IDLE: 0 },
      THINKING: { ACTIVE: 0, THINKING: 0, IDLE: 0 },
      IDLE: { ACTIVE: 0, THINKING: 0, IDLE: 0 }
    };
    
    // 对每个初始状态进行多次转换测试
    for (const initialState of Object.keys(behaviorManager.STATES)) {
      behaviorManager.currentState = initialState;
      
      // 进行1000次转换以获得统计分布
      for (let i = 0; i < 1000; i++) {
        const newState = behaviorManager.selectNewState();
        stateTransitions[initialState][newState]++;
      }
    }
    
    // 验证转换概率大致符合配置
    // ACTIVE -> ACTIVE 应该约60%
    const activeToActive = stateTransitions.ACTIVE.ACTIVE / 1000;
    assert.ok(activeToActive > 0.55 && activeToActive < 0.65,
      `ACTIVE->ACTIVE 应该约60%，实际: ${(activeToActive * 100).toFixed(1)}%`);
    
    // THINKING -> THINKING 应该约50%
    const thinkingToThinking = stateTransitions.THINKING.THINKING / 1000;
    assert.ok(thinkingToThinking > 0.45 && thinkingToThinking < 0.55,
      `THINKING->THINKING 应该约50%，实际: ${(thinkingToThinking * 100).toFixed(1)}%`);
    
    // IDLE -> IDLE 应该约50%
    const idleToIdle = stateTransitions.IDLE.IDLE / 1000;
    assert.ok(idleToIdle > 0.45 && idleToIdle < 0.55,
      `IDLE->IDLE 应该约50%，实际: ${(idleToIdle * 100).toFixed(1)}%`);
  });

  test('getState 应该返回当前状态信息', () => {
    // 添加一些请求历史
    behaviorManager.recordRequest();
    behaviorManager.recordRequest();
    behaviorManager.recordRequest();
    
    const state = behaviorManager.getState();
    assert.ok(state);
    assert.strictEqual(state.current, behaviorManager.STATES.IDLE);
    assert.ok(typeof state.duration === 'number');
    assert.strictEqual(state.requestHistory, 3);
    assert.ok(typeof state.requestFrequency === 'number');
  });

  test('getStats 应该返回完整的统计信息', () => {
    behaviorManager.recordRequest();
    behaviorManager.recordRequest();
    
    const stats = behaviorManager.getStats();
    assert.ok(stats);
    assert.strictEqual(stats.currentState, behaviorManager.STATES.IDLE);
    assert.ok(typeof stats.stateDuration === 'number');
    assert.strictEqual(stats.totalRequests, 2);
    assert.ok(typeof stats.requestsPerMinute === 'number');
    assert.ok(stats.stateHistory);
    assert.ok(stats.stateHistory.ACTIVE !== undefined);
    assert.ok(stats.stateHistory.THINKING !== undefined);
    assert.ok(stats.stateHistory.IDLE !== undefined);
  });

  test('getStateDistribution 应该基于请求频率返回状态分布', () => {
    // 高频率请求
    behaviorManager.requestHistory = new Array(20).fill(Date.now());
    let distribution = behaviorManager.getStateDistribution();
    assert.strictEqual(distribution.ACTIVE, 70);
    assert.strictEqual(distribution.THINKING, 25);
    assert.strictEqual(distribution.IDLE, 5);
    
    // 中等频率请求
    behaviorManager.requestHistory = new Array(8).fill(Date.now());
    distribution = behaviorManager.getStateDistribution();
    assert.strictEqual(distribution.ACTIVE, 30);
    assert.strictEqual(distribution.THINKING, 50);
    assert.strictEqual(distribution.IDLE, 20);
    
    // 低频率请求
    behaviorManager.requestHistory = new Array(2).fill(Date.now());
    distribution = behaviorManager.getStateDistribution();
    assert.strictEqual(distribution.ACTIVE, 10);
    assert.strictEqual(distribution.THINKING, 30);
    assert.strictEqual(distribution.IDLE, 60);
  });

  test('reset 应该重置管理器状态', () => {
    // 修改状态
    behaviorManager.currentState = behaviorManager.STATES.ACTIVE;
    behaviorManager.recordRequest();
    behaviorManager.recordRequest();
    
    // 重置
    behaviorManager.reset();
    
    // 验证重置结果
    assert.strictEqual(behaviorManager.currentState, behaviorManager.STATES.IDLE);
    assert.strictEqual(behaviorManager.requestHistory.length, 0);
    assert.ok(behaviorManager.stateStartTime <= Date.now());
  });

  test('checkStateTransition 应该在合适的时机触发状态转换', () => {
    // Mock checkStateTransition 的内部方法
    let transitionTriggered = false;
    behaviorManager.transitionTo = (newState) => {
      transitionTriggered = true;
    };
    
    // 设置为 ACTIVE 状态（最小持续时间 5 秒）
    behaviorManager.currentState = behaviorManager.STATES.ACTIVE;
    behaviorManager.stateStartTime = Date.now();
    
    // 立即检查 - 不应该转换（未达到最小时间）
    behaviorManager.checkStateTransition();
    assert.strictEqual(transitionTriggered, false);
    
    // 模拟超过最大持续时间
    behaviorManager.stateStartTime = Date.now() - 31000; // 31秒前
    behaviorManager.shouldTransition = () => true; // 强制返回应该转换
    behaviorManager.selectNewState = () => behaviorManager.STATES.THINKING;
    
    behaviorManager.checkStateTransition();
    assert.strictEqual(transitionTriggered, true);
  });
});

describe('BehaviorManager 状态转换逻辑测试', () => {
  let behaviorManager;
  let logger;

  beforeEach(() => {
    logger = new Logger({
      level: 'error', 
      enableConsole: false,
      enableFile: false
    });
    behaviorManager = new BehaviorManager(logger);
  });

  test('状态配置应该定义合理的延迟和持续时间', () => {
    const config = behaviorManager.stateConfig;
    
    // ACTIVE 状态 - 快速响应
    assert.ok(config.ACTIVE.minDelay < config.ACTIVE.maxDelay);
    assert.ok(config.ACTIVE.minDuration < config.ACTIVE.maxDuration);
    assert.ok(config.ACTIVE.maxDelay <= 1000, 'ACTIVE 最大延迟应该较短');
    
    // THINKING 状态 - 中等响应
    assert.ok(config.THINKING.minDelay > config.ACTIVE.maxDelay);
    assert.ok(config.THINKING.minDuration > config.ACTIVE.minDuration);
    
    // IDLE 状态 - 缓慢响应
    assert.ok(config.IDLE.minDelay > config.THINKING.maxDelay);
    assert.ok(config.IDLE.minDuration > config.THINKING.maxDuration);
  });

  test('转换概率总和应该为1', () => {
    const probabilities = behaviorManager.transitionProbabilities;
    
    for (const state of Object.keys(probabilities)) {
      const sum = Object.values(probabilities[state]).reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1.0) < 0.001, `${state} 状态的转换概率总和应该为1，实际: ${sum}`);
    }
  });
});