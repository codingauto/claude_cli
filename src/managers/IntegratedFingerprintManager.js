/**
 * 集成指纹管理器
 * 统一管理TLS指纹和设备指纹，确保一致性和协调性
 */

import AdvancedTLSFingerprint from '../utils/AdvancedTLSFingerprint.js';
import DeviceFingerprint from '../utils/DeviceFingerprint.js';
import crypto from 'crypto';

class IntegratedFingerprintManager {
  constructor() {
    this.tlsFingerprint = new AdvancedTLSFingerprint();
    this.deviceFingerprint = new DeviceFingerprint();
    this.sessionProfiles = new Map();
    this.consistencyRules = this.initializeConsistencyRules();
    this.logger = this.setupLogger();
  }

  /**
   * 初始化一致性规则
   */
  initializeConsistencyRules() {
    return {
      // TLS配置文件与设备配置文件的映射关系
      profileMapping: {
        'chrome-131-windows': 'chrome-131-windows-desktop',
        'chrome-131-macos': 'chrome-131-macos-desktop',
        'firefox-133-windows': 'firefox-133-windows-desktop',
        'safari-17-macos': 'safari-17-macos-desktop'
      },
      
      // 关键特征必须匹配的规则
      criticalMatches: {
        // 平台一致性
        platform: {
          'chrome-131-windows': ['Win32', 'Windows'],
          'chrome-131-macos': ['MacIntel', 'Mac'],
          'firefox-133-windows': ['Win32', 'Windows'],
          'safari-17-macos': ['MacIntel', 'Mac']
        },
        
        // HTTP/2支持一致性
        http2Support: {
          'chrome-131-windows': true,
          'chrome-131-macos': true,
          'firefox-133-windows': true,
          'safari-17-macos': true
        },
        
        // 加密套件与硬件能力匹配
        hardwareCapability: {
          'chrome-131-windows': ['AES-NI', 'RDRAND'],
          'chrome-131-macos': ['AES-NI', 'Apple Silicon'],
          'firefox-133-windows': ['AES-NI', 'RDRAND'],
          'safari-17-macos': ['Apple Silicon', 'Secure Enclave']
        }
      },
      
      // 时序一致性规则
      timingConsistency: {
        // TLS握手时间应该与设备性能相符
        handshakeDelay: {
          'high-end': { min: 50, max: 150 },
          'mid-range': { min: 100, max: 250 },
          'low-end': { min: 200, max: 400 }
        }
      }
    };
  }

  /**
   * 创建协调的会话配置文件
   */
  createCoordinatedSession(sessionId, options = {}) {
    // 如果指定了特定配置文件，使用它
    let tlsProfileKey = options.tlsProfile;
    let deviceProfileKey = options.deviceProfile;
    
    // 如果只指定了一个，自动匹配另一个
    if (tlsProfileKey && !deviceProfileKey) {
      deviceProfileKey = this.consistencyRules.profileMapping[tlsProfileKey];
    } else if (deviceProfileKey && !tlsProfileKey) {
      // 反向查找TLS配置文件
      tlsProfileKey = Object.keys(this.consistencyRules.profileMapping)
        .find(key => this.consistencyRules.profileMapping[key] === deviceProfileKey);
    }
    
    // 如果都没指定，随机选择但确保一致性
    if (!tlsProfileKey && !deviceProfileKey) {
      const profilePairs = Object.entries(this.consistencyRules.profileMapping);
      const randomPair = profilePairs[Math.floor(Math.random() * profilePairs.length)];
      tlsProfileKey = randomPair[0];
      deviceProfileKey = randomPair[1];
    }

    // 设置TLS配置文件
    const tlsProfile = this.tlsFingerprint.selectProfile(tlsProfileKey);
    
    // 设置设备配置文件
    const deviceProfile = this.deviceFingerprint.selectDeviceProfile(deviceProfileKey);

    // 验证一致性
    const consistencyCheck = this.validateCrossProfileConsistency(tlsProfile, deviceProfile);
    if (!consistencyCheck.isValid) {
      this.logger.warn('Profile consistency validation failed:', consistencyCheck.issues);
      // 尝试自动修复或重新选择
      return this.createCoordinatedSession(sessionId, { forceRandom: true });
    }

    // 创建会话配置
    const sessionConfig = {
      sessionId,
      tlsProfile: {
        key: tlsProfileKey,
        config: tlsProfile,
        ja4: this.tlsFingerprint.getCurrentJA4(),
        ja3: this.tlsFingerprint.getCurrentJA3() // 向后兼容
      },
      deviceProfile: {
        key: deviceProfileKey,
        config: deviceProfile,
        fingerprint: this.deviceFingerprint.generateDeviceFingerprint()
      },
      consistency: {
        validated: true,
        timestamp: Date.now(),
        rules: consistencyCheck
      },
      timing: this.generateTimingProfile(deviceProfile),
      antiDetection: this.generateAntiDetectionStrategy(tlsProfile, deviceProfile)
    };

    // 存储会话配置
    this.sessionProfiles.set(sessionId, sessionConfig);
    this.logger.info(`Created coordinated session ${sessionId} with profiles ${tlsProfileKey} + ${deviceProfileKey}`);

    return sessionConfig;
  }

  /**
   * 验证跨配置文件一致性
   */
  validateCrossProfileConsistency(tlsProfile, deviceProfile) {
    const issues = [];
    let isValid = true;

    // 1. 检查平台一致性
    const tlsProfileKey = Object.keys(this.tlsFingerprint.tlsProfiles)
      .find(key => this.tlsFingerprint.tlsProfiles[key] === tlsProfile);
    
    const expectedPlatforms = this.consistencyRules.criticalMatches.platform[tlsProfileKey];
    if (expectedPlatforms && !expectedPlatforms.some(p => deviceProfile.platform.includes(p))) {
      issues.push(`Platform mismatch: TLS expects ${expectedPlatforms}, device has ${deviceProfile.platform}`);
      isValid = false;
    }

    // 2. 检查User-Agent与TLS配置的一致性
    const userAgentBrowser = this.extractBrowserFromUserAgent(deviceProfile.userAgent);
    const tlsBrowser = this.extractBrowserFromTLSProfile(tlsProfile);
    if (userAgentBrowser !== tlsBrowser) {
      issues.push(`Browser mismatch: TLS is ${tlsBrowser}, User-Agent is ${userAgentBrowser}`);
      isValid = false;
    }

    // 3. 检查ALPN协议支持
    const supportsH2 = tlsProfile.alpnProtocols.includes('h2');
    const deviceSupportsH2 = deviceProfile.userAgent.includes('Chrome') || 
                            deviceProfile.userAgent.includes('Firefox') ||
                            deviceProfile.userAgent.includes('Safari');
    if (supportsH2 !== deviceSupportsH2) {
      issues.push(`HTTP/2 support mismatch`);
      isValid = false;
    }

    // 4. 检查加密能力与硬件匹配
    const hardwareConcurrency = deviceProfile.hardware.hardwareConcurrency;
    const expectedCipherCount = tlsProfile.cipherSuites.length;
    if (hardwareConcurrency < 4 && expectedCipherCount > 10) {
      issues.push(`Hardware may not support extensive cipher suite`);
      // 这不是致命错误，但需要注意
    }

    return { isValid, issues };
  }

  /**
   * 从User-Agent提取浏览器类型
   */
  extractBrowserFromUserAgent(userAgent) {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'unknown';
  }

  /**
   * 从TLS配置文件提取浏览器类型
   */
  extractBrowserFromTLSProfile(tlsProfile) {
    const name = tlsProfile.name.toLowerCase();
    if (name.includes('chrome')) return 'chrome';
    if (name.includes('firefox')) return 'firefox';
    if (name.includes('safari')) return 'safari';
    if (name.includes('edge')) return 'edge';
    return 'unknown';
  }

  /**
   * 生成时序配置文件
   */
  generateTimingProfile(deviceProfile) {
    // 根据硬件性能确定时序特征
    const hardwareConcurrency = deviceProfile.hardware.hardwareConcurrency;
    let performanceClass;
    
    if (hardwareConcurrency >= 8) {
      performanceClass = 'high-end';
    } else if (hardwareConcurrency >= 4) {
      performanceClass = 'mid-range';
    } else {
      performanceClass = 'low-end';
    }

    const timingRules = this.consistencyRules.timingConsistency.handshakeDelay[performanceClass];
    
    return {
      performanceClass,
      tlsHandshakeDelay: Math.floor(Math.random() * (timingRules.max - timingRules.min)) + timingRules.min,
      dnsLookupDelay: Math.floor(Math.random() * 50) + 10,
      tcpConnectDelay: Math.floor(Math.random() * 30) + 5,
      // 模拟人类操作时序
      humanizedDelays: {
        mouseMove: Math.floor(Math.random() * 100) + 50,
        keyPress: Math.floor(Math.random() * 50) + 25,
        click: Math.floor(Math.random() * 20) + 10
      }
    };
  }

  /**
   * 生成反检测策略
   */
  generateAntiDetectionStrategy(tlsProfile, deviceProfile) {
    return {
      // GREASE随机化
      greaseValues: this.generateGreaseValues(),
      
      // 扩展顺序随机化
      extensionOrderRandomization: {
        enabled: true,
        preserveImportant: ['server_name', 'application_layer_protocol_negotiation']
      },
      
      // 密码套件顺序微调
      cipherSuiteVariation: {
        enabled: true,
        maxSwaps: 2
      },
      
      // 请求头顺序随机化
      headerOrderRandomization: {
        enabled: true,
        preserveFirst: ['Host', 'User-Agent']
      },
      
      // 时序混淆
      timingObfuscation: {
        enabled: true,
        jitterRange: 0.1, // 10% 时序抖动
        patterns: ['gaussian', 'uniform', 'exponential']
      },
      
      // Canvas噪声注入
      canvasNoiseInjection: {
        enabled: true,
        intensity: 0.01, // 1% 噪声
        type: 'pixel'
      },
      
      // WebGL参数微调
      webglParameterVariation: {
        enabled: true,
        varyFloatPrecision: true,
        varyVertexAttributes: false
      }
    };
  }

  /**
   * 生成GREASE值
   */
  generateGreaseValues() {
    const greaseValues = [
      0x0a0a, 0x1a1a, 0x2a2a, 0x3a3a, 0x4a4a, 0x5a5a,
      0x6a6a, 0x7a7a, 0x8a8a, 0x9a9a, 0xaaaa, 0xbaba,
      0xcaca, 0xdada, 0xeaea, 0xfafa
    ];
    
    return {
      version: greaseValues[Math.floor(Math.random() * greaseValues.length)],
      cipherSuite: greaseValues[Math.floor(Math.random() * greaseValues.length)],
      extension: greaseValues[Math.floor(Math.random() * greaseValues.length)],
      namedGroup: greaseValues[Math.floor(Math.random() * greaseValues.length)],
      signatureAlgorithm: greaseValues[Math.floor(Math.random() * greaseValues.length)]
    };
  }

  /**
   * 获取会话配置
   */
  getSessionConfig(sessionId) {
    return this.sessionProfiles.get(sessionId);
  }

  /**
   * 生成协调的HTTP请求头
   */
  generateCoordinatedHeaders(sessionId, hostname, additionalHeaders = {}) {
    const session = this.sessionProfiles.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 获取设备特征头部
    const deviceHeaders = this.deviceFingerprint.generateDeviceHeaders();
    
    // 获取TLS配置文件
    const tlsConfig = session.tlsProfile.config;
    
    // 生成JA4H指纹
    const combinedHeaders = { ...deviceHeaders, ...additionalHeaders };
    const ja4h = this.tlsFingerprint.calculateJA4H(combinedHeaders);

    // 应用反检测策略
    const antiDetection = session.antiDetection;
    if (antiDetection.headerOrderRandomization.enabled) {
      // 随机化头部顺序（保留重要头部在前）
      const orderedHeaders = this.randomizeHeaderOrder(combinedHeaders, antiDetection.headerOrderRandomization);
      Object.assign(combinedHeaders, orderedHeaders);
    }

    // 添加TLS相关头部
    combinedHeaders['Sec-Fetch-Site'] = hostname ? 'same-origin' : 'none';
    combinedHeaders['Sec-Fetch-Mode'] = 'navigate';
    combinedHeaders['Sec-Fetch-User'] = '?1';
    combinedHeaders['Sec-Fetch-Dest'] = 'document';

    return {
      headers: combinedHeaders,
      ja4h: ja4h,
      consistency: {
        tlsMatch: true,
        deviceMatch: true,
        timingValid: true
      }
    };
  }

  /**
   * 随机化头部顺序
   */
  randomizeHeaderOrder(headers, rules) {
    const headerEntries = Object.entries(headers);
    const preserveFirst = rules.preserveFirst || [];
    
    // 分离需要保持在前面的头部
    const priorityHeaders = headerEntries.filter(([key]) => 
      preserveFirst.some(p => key.toLowerCase().includes(p.toLowerCase()))
    );
    
    const otherHeaders = headerEntries.filter(([key]) => 
      !preserveFirst.some(p => key.toLowerCase().includes(p.toLowerCase()))
    );
    
    // 随机化其他头部
    for (let i = otherHeaders.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherHeaders[i], otherHeaders[j]] = [otherHeaders[j], otherHeaders[i]];
    }
    
    // 重新组合
    const reorderedEntries = [...priorityHeaders, ...otherHeaders];
    return Object.fromEntries(reorderedEntries);
  }

  /**
   * 生成用于Node.js的TLS配置
   */
  generateNodeTLSConfig(sessionId) {
    const session = this.sessionProfiles.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const baseTLSConfig = this.tlsFingerprint.getNodeTLSConfig();
    const timing = session.timing;
    const antiDetection = session.antiDetection;

    // 应用反检测策略
    if (antiDetection.cipherSuiteVariation.enabled) {
      // 轻微调整密码套件顺序
      baseTLSConfig.ciphers = this.varyOpenSSLCipherOrder(baseTLSConfig.ciphers, antiDetection.cipherSuiteVariation.maxSwaps);
    }

    return {
      ...baseTLSConfig,
      // 添加时序配置
      timeout: timing.tlsHandshakeDelay + timing.dnsLookupDelay + timing.tcpConnectDelay,
      // 添加自定义属性用于调试
      fingerprintMeta: {
        sessionId,
        ja4: session.tlsProfile.ja4?.ja4,
        deviceId: session.deviceProfile.fingerprint.deviceId,
        consistency: session.consistency
      }
    };
  }

  /**
   * 微调OpenSSL密码套件顺序
   */
  varyOpenSSLCipherOrder(cipherString, maxSwaps) {
    const ciphers = cipherString.split(':');
    const swapCount = Math.floor(Math.random() * maxSwaps) + 1;
    
    for (let i = 0; i < swapCount; i++) {
      if (ciphers.length < 2) break;
      
      const idx1 = Math.floor(Math.random() * ciphers.length);
      const idx2 = Math.floor(Math.random() * ciphers.length);
      
      if (idx1 !== idx2) {
        [ciphers[idx1], ciphers[idx2]] = [ciphers[idx2], ciphers[idx1]];
      }
    }
    
    return ciphers.join(':');
  }

  /**
   * 验证会话指纹一致性
   */
  validateSessionConsistency(sessionId) {
    const session = this.sessionProfiles.get(sessionId);
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    // 检查TLS指纹
    const tlsConsistency = this.tlsFingerprint.validateJA4Fingerprint(
      session.tlsProfile.config,
      '',
      session.tlsProfile.ja4
    );

    // 检查设备指纹
    const deviceConsistency = this.deviceFingerprint.validateDeviceConsistency(
      session.deviceProfile.fingerprint,
      sessionId
    );

    // 检查时间一致性
    const now = Date.now();
    const sessionAge = now - session.consistency.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    const timeConsistency = sessionAge < maxAge;

    return {
      valid: tlsConsistency && deviceConsistency && timeConsistency,
      details: {
        tls: tlsConsistency,
        device: deviceConsistency,
        timing: timeConsistency,
        sessionAge: sessionAge
      }
    };
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessionProfiles.entries()) {
      if (now - session.consistency.timestamp > maxAge) {
        this.sessionProfiles.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  /**
   * 导出会话统计信息
   */
  getSessionStats() {
    const sessions = Array.from(this.sessionProfiles.values());
    
    const stats = {
      totalSessions: sessions.length,
      profileDistribution: {},
      consistencyStatus: {
        valid: 0,
        invalid: 0
      },
      averageSessionAge: 0
    };

    const now = Date.now();
    let totalAge = 0;

    sessions.forEach(session => {
      // 统计配置文件分布
      const profileKey = session.tlsProfile.key;
      stats.profileDistribution[profileKey] = (stats.profileDistribution[profileKey] || 0) + 1;

      // 统计一致性状态
      if (session.consistency.validated) {
        stats.consistencyStatus.valid++;
      } else {
        stats.consistencyStatus.invalid++;
      }

      // 计算平均年龄
      totalAge += now - session.consistency.timestamp;
    });

    if (sessions.length > 0) {
      stats.averageSessionAge = totalAge / sessions.length;
    }

    return stats;
  }

  /**
   * 设置日志记录器
   */
  setupLogger() {
    return {
      info: (msg, ...args) => console.log(`[Integrated-Fingerprint] INFO: ${msg}`, ...args),
      debug: (msg, ...args) => console.log(`[Integrated-Fingerprint] DEBUG: ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[Integrated-Fingerprint] WARN: ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[Integrated-Fingerprint] ERROR: ${msg}`, ...args)
    };
  }
}

export default IntegratedFingerprintManager;