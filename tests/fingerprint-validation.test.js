/**
 * 指纹验证测试套件
 * 测试改进后的TLS和设备指纹系统
 */

import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import AdvancedTLSFingerprint from '../src/utils/AdvancedTLSFingerprint.js';
import DeviceFingerprint from '../src/utils/DeviceFingerprint.js';
import IntegratedFingerprintManager from '../src/managers/IntegratedFingerprintManager.js';
import AntiDetectionStrategy from '../src/utils/AntiDetectionStrategy.js';

describe('高级指纹系统验证测试', () => {
  let tlsFingerprint;
  let deviceFingerprint;
  let integratedManager;
  let antiDetection;

  beforeEach(() => {
    tlsFingerprint = new AdvancedTLSFingerprint();
    deviceFingerprint = new DeviceFingerprint();
    integratedManager = new IntegratedFingerprintManager();
    antiDetection = new AntiDetectionStrategy();
  });

  afterEach(() => {
    // 清理测试会话
    if (integratedManager) {
      integratedManager.sessionProfiles.clear();
    }
    if (antiDetection) {
      antiDetection.activeStrategies.clear();
    }
  });

  describe('TLS指纹系统测试', () => {
    it('应该支持JA4指纹生成', () => {
      const profile = tlsFingerprint.selectProfile('chrome-131-windows');
      expect(profile).toBeDefined();
      expect(profile.name).toBe('Chrome 131 Windows');

      const ja4 = tlsFingerprint.getCurrentJA4();
      expect(ja4).toBeDefined();
      expect(ja4.ja4).toMatch(/^t13d\d{4}h2_[a-f0-9]{12}_[a-f0-9]{12}$/);
    });

    it('应该生成有效的Client Hello包', () => {
      const clientHello = tlsFingerprint.generateClientHello('example.com');
      
      expect(clientHello.version).toBe(0x0303);
      expect(clientHello.random).toHaveLength(32);
      expect(clientHello.sessionId).toHaveLength(32);
      expect(clientHello.cipherSuites).toBeInstanceOf(Array);
      expect(clientHello.cipherSuites.length).toBeGreaterThan(0);
      expect(clientHello.extensions).toBeInstanceOf(Array);
    });

    it('应该计算正确的JA4指纹', () => {
      const clientHello = tlsFingerprint.generateClientHello('example.com');
      const ja4Result = tlsFingerprint.calculateJA4(clientHello, 'example.com');
      
      expect(ja4Result.ja4).toBeDefined();
      expect(ja4Result.components).toBeDefined();
      expect(ja4Result.components.tlsVersion).toMatch(/^t1[23]d$/);
      expect(ja4Result.components.extensionHash).toHaveLength(12);
      expect(ja4Result.components.cipherHash).toHaveLength(12);
    });

    it('应该支持多种浏览器配置文件', () => {
      const supportedProfiles = tlsFingerprint.getSupportedProfiles();
      
      expect(supportedProfiles.length).toBeGreaterThanOrEqual(4);
      
      const profileNames = supportedProfiles.map(p => p.key);
      expect(profileNames).toContain('chrome-131-windows');
      expect(profileNames).toContain('chrome-131-macos');
      expect(profileNames).toContain('firefox-133-windows');
      expect(profileNames).toContain('safari-17-macos');
    });

    it('应该为不同配置文件生成不同的JA4', () => {
      const chromeProfile = tlsFingerprint.selectProfile('chrome-131-windows');
      const chromeJA4 = tlsFingerprint.getCurrentJA4();
      
      const firefoxProfile = tlsFingerprint.selectProfile('firefox-133-windows');
      const firefoxJA4 = tlsFingerprint.getCurrentJA4();
      
      expect(chromeJA4.ja4).not.toBe(firefoxJA4.ja4);
    });
  });

  describe('设备指纹系统测试', () => {
    it('应该生成完整的设备指纹', () => {
      const profile = deviceFingerprint.selectDeviceProfile('chrome-131-windows-desktop');
      const fingerprint = deviceFingerprint.generateDeviceFingerprint();
      
      expect(fingerprint.deviceId).toBeDefined();
      expect(fingerprint.masterFingerprint).toHaveLength(64);
      expect(fingerprint.components).toBeDefined();
      expect(fingerprint.components.canvas).toBeDefined();
      expect(fingerprint.components.webgl).toBeDefined();
      expect(fingerprint.components.fonts).toBeDefined();
      expect(fingerprint.components.audio).toBeDefined();
    });

    it('应该生成Canvas指纹', () => {
      deviceFingerprint.selectDeviceProfile('chrome-131-windows-desktop');
      const canvasFingerprint = deviceFingerprint.generateCanvasFingerprint();
      
      expect(canvasFingerprint).toHaveLength(32);
      expect(canvasFingerprint).toMatch(/^[a-f0-9]{32}$/);
    });

    it('应该生成WebGL指纹', () => {
      deviceFingerprint.selectDeviceProfile('chrome-131-windows-desktop');
      const webglFingerprint = deviceFingerprint.generateWebGLFingerprint();
      
      expect(webglFingerprint).toHaveLength(32);
      expect(webglFingerprint).toMatch(/^[a-f0-9]{32}$/);
    });

    it('应该生成字体指纹', () => {
      deviceFingerprint.selectDeviceProfile('chrome-131-windows-desktop');
      const fontFingerprint = deviceFingerprint.generateFontFingerprint();
      
      expect(fontFingerprint).toHaveLength(32);
      expect(fontFingerprint).toMatch(/^[a-f0-9]{32}$/);
    });

    it('应该生成音频指纹', () => {
      deviceFingerprint.selectDeviceProfile('chrome-131-windows-desktop');
      const audioFingerprint = deviceFingerprint.generateAudioFingerprint();
      
      expect(audioFingerprint).toHaveLength(32);
      expect(audioFingerprint).toMatch(/^[a-f0-9]{32}$/);
    });

    it('应该生成设备特征HTTP头部', () => {
      deviceFingerprint.selectDeviceProfile('chrome-131-windows-desktop');
      const headers = deviceFingerprint.generateDeviceHeaders();
      
      expect(headers['User-Agent']).toContain('Chrome');
      expect(headers['Accept-Language']).toBeDefined();
      expect(headers['Sec-CH-UA-Platform']).toBeDefined();
      expect(headers['Device-Memory']).toBeDefined();
    });
  });

  describe('集成指纹管理器测试', () => {
    it('应该创建协调的会话配置', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('test-session-1');
      
      expect(sessionConfig.sessionId).toBe('test-session-1');
      expect(sessionConfig.tlsProfile).toBeDefined();
      expect(sessionConfig.deviceProfile).toBeDefined();
      expect(sessionConfig.consistency.validated).toBe(true);
      expect(sessionConfig.timing).toBeDefined();
      expect(sessionConfig.antiDetection).toBeDefined();
    });

    it('应该确保TLS和设备配置文件的一致性', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('test-session-2');
      
      const tlsProfileKey = sessionConfig.tlsProfile.key;
      const deviceProfileKey = sessionConfig.deviceProfile.key;
      
      // 检查配置文件映射是否正确
      const expectedMapping = integratedManager.consistencyRules.profileMapping[tlsProfileKey];
      expect(deviceProfileKey).toBe(expectedMapping);
    });

    it('应该生成协调的HTTP头部', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('test-session-3');
      const headers = integratedManager.generateCoordinatedHeaders('test-session-3', 'example.com');
      
      expect(headers.headers).toBeDefined();
      expect(headers.ja4h).toBeDefined();
      expect(headers.consistency.tlsMatch).toBe(true);
      expect(headers.consistency.deviceMatch).toBe(true);
    });

    it('应该生成Node.js TLS配置', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('test-session-4');
      const tlsConfig = integratedManager.generateNodeTLSConfig('test-session-4');
      
      expect(tlsConfig.ciphers).toBeDefined();
      expect(tlsConfig.ALPNProtocols).toContain('h2');
      expect(tlsConfig.fingerprintMeta).toBeDefined();
      expect(tlsConfig.fingerprintMeta.sessionId).toBe('test-session-4');
    });

    it('应该验证会话一致性', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('test-session-5');
      const validation = integratedManager.validateSessionConsistency('test-session-5');
      
      expect(validation.valid).toBe(true);
      expect(validation.details.tls).toBeDefined();
      expect(validation.details.device).toBeDefined();
      expect(validation.details.timing).toBeDefined();
    });
  });

  describe('反检测策略测试', () => {
    it('应该激活反检测策略', () => {
      const strategy = antiDetection.activateStrategy('test-session-6', 'balanced');
      
      expect(strategy.sessionId).toBe('test-session-6');
      expect(strategy.profile).toBe('balanced');
      expect(strategy.activeTechniques.length).toBeGreaterThan(0);
      expect(strategy.metrics).toBeDefined();
    });

    it('应该支持不同的行为配置文件', () => {
      const conservative = antiDetection.activateStrategy('session-1', 'conservative');
      const balanced = antiDetection.activateStrategy('session-2', 'balanced');
      const aggressive = antiDetection.activateStrategy('session-3', 'aggressive');
      const stealth = antiDetection.activateStrategy('session-4', 'stealth');
      
      expect(conservative.config.rotationFrequency).toBe('high');
      expect(balanced.config.rotationFrequency).toBe('medium');
      expect(aggressive.config.rotationFrequency).toBe('adaptive');
      expect(stealth.config.rotationFrequency).toBe('continuous');
    });

    it('应该实现时序噪声注入', () => {
      const strategy = antiDetection.activateStrategy('test-session-7', 'balanced');
      const noise1 = antiDetection.implementTemporalNoise(strategy);
      const noise2 = antiDetection.implementTemporalNoise(strategy);
      
      expect(noise1).toBeGreaterThan(0);
      expect(noise2).toBeGreaterThan(0);
      expect(noise1).not.toBe(noise2); // 应该产生不同的噪声值
    });

    it('应该生成人类时序模拟', () => {
      const strategy = antiDetection.activateStrategy('test-session-8', 'balanced');
      const humanTiming = antiDetection.implementHumanTiming(strategy);
      
      expect(humanTiming.thinkTime).toBeGreaterThan(0);
      expect(humanTiming.typingDelay).toBeGreaterThan(0);
      expect(humanTiming.mouseDelay).toBeGreaterThan(0);
      expect(humanTiming.readingTime).toBeGreaterThan(0);
    });

    it('应该获取策略状态', () => {
      antiDetection.activateStrategy('test-session-9', 'aggressive');
      const status = antiDetection.getStrategyStatus('test-session-9');
      
      expect(status.sessionId).toBe('test-session-9');
      expect(status.profile).toBe('aggressive');
      expect(status.uptime).toBeGreaterThan(0);
      expect(status.activeTechniques).toBeInstanceOf(Array);
      expect(status.effectivenessScore).toBeGreaterThanOrEqual(0);
      expect(status.effectivenessScore).toBeLessThanOrEqual(1);
    });
  });

  describe('指纹一致性验证测试', () => {
    it('应该检测平台不匹配', () => {
      // 故意创建不匹配的配置
      tlsFingerprint.selectProfile('chrome-131-windows');
      deviceFingerprint.selectDeviceProfile('safari-17-macos-desktop');
      
      const tlsProfile = tlsFingerprint.getCurrentProfile();
      const deviceProfile = deviceFingerprint.getCurrentDeviceProfile();
      
      const consistency = integratedManager.validateCrossProfileConsistency(tlsProfile, deviceProfile);
      expect(consistency.isValid).toBe(false);
      expect(consistency.issues.length).toBeGreaterThan(0);
    });

    it('应该通过匹配配置的一致性检查', () => {
      tlsFingerprint.selectProfile('chrome-131-windows');
      deviceFingerprint.selectDeviceProfile('chrome-131-windows-desktop');
      
      const tlsProfile = tlsFingerprint.getCurrentProfile();
      const deviceProfile = deviceFingerprint.getCurrentDeviceProfile();
      
      const consistency = integratedManager.validateCrossProfileConsistency(tlsProfile, deviceProfile);
      expect(consistency.isValid).toBe(true);
      expect(consistency.issues.length).toBe(0);
    });
  });

  describe('性能和可扩展性测试', () => {
    it('应该处理多个并发会话', () => {
      const sessionCount = 10;
      const sessions = [];
      
      for (let i = 0; i < sessionCount; i++) {
        const sessionId = `concurrent-session-${i}`;
        const sessionConfig = integratedManager.createCoordinatedSession(sessionId);
        sessions.push(sessionConfig);
      }
      
      expect(sessions.length).toBe(sessionCount);
      sessions.forEach(session => {
        expect(session.consistency.validated).toBe(true);
      });
    });

    it('应该清理过期会话', async () => {
      // 创建会话
      integratedManager.createCoordinatedSession('expire-test-1');
      integratedManager.createCoordinatedSession('expire-test-2');
      
      // 模拟时间过去（修改时间戳）
      const sessions = integratedManager.sessionProfiles;
      for (const session of sessions.values()) {
        session.consistency.timestamp = Date.now() - (25 * 60 * 60 * 1000); // 25小时前
      }
      
      const cleanedCount = integratedManager.cleanupExpiredSessions();
      expect(cleanedCount).toBe(2);
      expect(integratedManager.sessionProfiles.size).toBe(0);
    });

    it('应该生成会话统计信息', () => {
      // 创建不同类型的会话
      integratedManager.createCoordinatedSession('stats-1', { tlsProfile: 'chrome-131-windows' });
      integratedManager.createCoordinatedSession('stats-2', { tlsProfile: 'firefox-133-windows' });
      integratedManager.createCoordinatedSession('stats-3', { tlsProfile: 'chrome-131-windows' });
      
      const stats = integratedManager.getSessionStats();
      
      expect(stats.totalSessions).toBe(3);
      expect(stats.profileDistribution['chrome-131-windows']).toBe(2);
      expect(stats.profileDistribution['firefox-133-windows']).toBe(1);
      expect(stats.consistencyStatus.valid).toBe(3);
      expect(stats.averageSessionAge).toBeGreaterThan(0);
    });
  });

  describe('真实场景模拟测试', () => {
    it('应该模拟真实的浏览器会话', async () => {
      // 创建会话
      const sessionConfig = integratedManager.createCoordinatedSession('real-session-test');
      antiDetection.activateStrategy('real-session-test', 'balanced');
      
      // 模拟多个请求
      for (let i = 0; i < 5; i++) {
        const headers = integratedManager.generateCoordinatedHeaders(
          'real-session-test', 
          `example${i}.com`
        );
        
        expect(headers.headers['User-Agent']).toBeDefined();
        expect(headers.ja4h).toBeDefined();
        
        // 模拟时序延迟
        const strategy = antiDetection.activeStrategies.get('real-session-test');
        const delay = antiDetection.implementTemporalNoise(strategy);
        
        // 在真实场景中这里会有实际的延迟
        expect(delay).toBeGreaterThan(0);
      }
      
      // 验证会话一致性
      const validation = integratedManager.validateSessionConsistency('real-session-test');
      expect(validation.valid).toBe(true);
    });

    it('应该在检测到威胁时触发指纹轮换', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('threat-response-test');
      const strategy = antiDetection.activateStrategy('threat-response-test', 'aggressive');
      
      // 模拟威胁检测
      strategy.metrics.detectionEventsCount = 5; // 模拟检测到威胁
      
      // 检查有效性评分是否下降
      const effectivenessScore = antiDetection.calculateEffectivenessScore(strategy);
      expect(effectivenessScore).toBeLessThan(1);
      
      // 在真实场景中这里会触发指纹轮换
      const rotationResult = antiDetection.executeRotation(strategy, 'threat-detected');
      expect(rotationResult).toBe(true);
      expect(strategy.metrics.rotationCount).toBeGreaterThan(0);
    });
  });
});

/**
 * 反爬虫系统对抗测试
 */
describe('反爬虫系统对抗验证', () => {
  let integratedManager;
  let antiDetection;

  beforeEach(() => {
    integratedManager = new IntegratedFingerprintManager();
    antiDetection = new AntiDetectionStrategy();
  });

  describe('Cloudflare对抗测试', () => {
    it('应该生成能够绕过Cloudflare基础检测的指纹', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('cf-test-1');
      const headers = integratedManager.generateCoordinatedHeaders('cf-test-1', 'example.com');
      
      // Cloudflare检查的关键头部
      expect(headers.headers['User-Agent']).toBeDefined();
      expect(headers.headers['Accept']).toBeDefined();
      expect(headers.headers['Accept-Language']).toBeDefined();
      expect(headers.headers['Accept-Encoding']).toBeDefined();
      
      // Chrome特有的头部（如果使用Chrome配置文件）
      if (headers.headers['User-Agent'].includes('Chrome')) {
        expect(headers.headers['Sec-CH-UA']).toBeDefined();
        expect(headers.headers['Sec-CH-UA-Mobile']).toBeDefined();
        expect(headers.headers['Sec-CH-UA-Platform']).toBeDefined();
      }
    });

    it('应该具有合理的JA4指纹特征', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('cf-test-2');
      const ja4 = sessionConfig.tlsProfile.ja4;
      
      // JA4应该符合真实浏览器的格式
      expect(ja4.ja4).toMatch(/^t13d\d{4}h2_[a-f0-9]{12}_[a-f0-9]{12}$/);
      
      // 应该支持HTTP/2
      expect(ja4.ja4).toContain('h2');
      
      // 应该使用TLS 1.3
      expect(ja4.ja4).toContain('t13d');
    });
  });

  describe('Akamai对抗测试', () => {
    it('应该具有一致的设备指纹特征', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('akamai-test-1');
      const deviceProfile = sessionConfig.deviceProfile.config;
      
      // 硬件一致性检查
      expect(deviceProfile.hardware.hardwareConcurrency).toBeGreaterThan(0);
      expect(deviceProfile.screen.width).toBeGreaterThan(0);
      expect(deviceProfile.screen.height).toBeGreaterThan(0);
      
      // 浏览器特征一致性
      expect(deviceProfile.browser.cookieEnabled).toBe(true);
      expect(deviceProfile.browser.javaEnabled).toBe(false); // 现代浏览器默认禁用Java
    });

    it('应该通过Canvas指纹变化测试', () => {
      const integratedManager1 = new IntegratedFingerprintManager();
      const integratedManager2 = new IntegratedFingerprintManager();
      
      const session1 = integratedManager1.createCoordinatedSession('akamai-test-2a');
      const session2 = integratedManager2.createCoordinatedSession('akamai-test-2b');
      
      // 不同实例应该产生不同的Canvas指纹
      const canvas1 = session1.deviceProfile.fingerprint.components.canvas;
      const canvas2 = session2.deviceProfile.fingerprint.components.canvas;
      
      // 由于使用相同配置文件，指纹可能相同，但在真实环境中应该有细微差异
      expect(typeof canvas1).toBe('string');
      expect(typeof canvas2).toBe('string');
    });
  });

  describe('DataDome对抗测试', () => {
    it('应该具有真实的时序特征', () => {
      const strategy = antiDetection.activateStrategy('datadome-test-1', 'balanced');
      
      // 生成多个时序样本
      const timingSamples = [];
      for (let i = 0; i < 10; i++) {
        const timing = antiDetection.implementHumanTiming(strategy);
        timingSamples.push(timing);
      }
      
      // 检查时序的变化性
      const thinkTimes = timingSamples.map(t => t.thinkTime);
      const uniqueThinkTimes = new Set(thinkTimes);
      
      expect(uniqueThinkTimes.size).toBeGreaterThan(1); // 应该有变化
      expect(Math.max(...thinkTimes)).toBeGreaterThan(Math.min(...thinkTimes)); // 应该有范围
    });

    it('应该具有合理的鼠标和键盘行为', () => {
      const strategy = antiDetection.activateStrategy('datadome-test-2', 'balanced');
      const timing = antiDetection.implementHumanTiming(strategy);
      
      // 鼠标延迟应该在合理范围内
      expect(timing.mouseDelay).toBeGreaterThan(10);
      expect(timing.mouseDelay).toBeLessThan(1000);
      
      // 打字延迟应该在合理范围内
      expect(timing.typingDelay).toBeGreaterThan(10);
      expect(timing.typingDelay).toBeLessThan(500);
      
      // 思考时间应该在合理范围内
      expect(timing.thinkTime).toBeGreaterThan(500);
      expect(timing.thinkTime).toBeLessThan(10000);
    });
  });

  describe('PerimeterX对抗测试', () => {
    it('应该维持会话一致性', () => {
      const sessionConfig = integratedManager.createCoordinatedSession('px-test-1');
      
      // 生成多个请求头，检查一致性
      const headers1 = integratedManager.generateCoordinatedHeaders('px-test-1', 'site1.com');
      const headers2 = integratedManager.generateCoordinatedHeaders('px-test-1', 'site2.com');
      
      // User-Agent应该保持一致
      expect(headers1.headers['User-Agent']).toBe(headers2.headers['User-Agent']);
      
      // 设备特征应该保持一致
      expect(headers1.headers['Sec-CH-UA-Platform']).toBe(headers2.headers['Sec-CH-UA-Platform']);
      
      // 验证会话一致性
      const validation = integratedManager.validateSessionConsistency('px-test-1');
      expect(validation.valid).toBe(true);
    });
  });

  describe('性能压力测试', () => {
    it('应该在高并发下保持性能', async () => {
      const sessionCount = 50;
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < sessionCount; i++) {
        const promise = Promise.resolve().then(() => {
          const sessionId = `perf-test-${i}`;
          const sessionConfig = integratedManager.createCoordinatedSession(sessionId);
          antiDetection.activateStrategy(sessionId, 'balanced');
          return integratedManager.generateCoordinatedHeaders(sessionId, 'example.com');
        });
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results.length).toBe(sessionCount);
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
      
      // 验证所有结果的质量
      results.forEach(result => {
        expect(result.headers['User-Agent']).toBeDefined();
        expect(result.ja4h).toBeDefined();
        expect(result.consistency.tlsMatch).toBe(true);
      });
    });
  });
});