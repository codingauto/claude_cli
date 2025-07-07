/**
 * 安全管理器 - TLS指纹伪装、HTTP/2支持、反检测策略
 * 负责浏览器特征模拟、请求时序控制、安全头设置
 */

import crypto from 'crypto';

class SecurityManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger.child({ component: 'SecurityManager' });
    
    // 安全配置
    this.enableTLSFingerprinting = config.enableTLSFingerprinting !== false;
    this.enableHTTP2 = config.enableHTTP2 !== false;
    this.userAgent = config.userAgent || this.getDefaultUserAgent();
    this.headers = config.headers || this.getDefaultHeaders();
    this.timing = config.timing || this.getDefaultTiming();
    
    // 请求计数器（用于时序控制）
    this.requestCount = 0;
    this.lastRequestTime = 0;
    
    // TLS指纹库
    this.tlsProfiles = this.initializeTLSProfiles();
    this.currentProfile = this.selectTLSProfile();
    
    this.logger.info('安全管理器初始化完成', {
      tlsFingerprinting: this.enableTLSFingerprinting,
      http2: this.enableHTTP2,
      userAgent: this.userAgent.substring(0, 50) + '...'
    });
  }

  /**
   * 获取请求安全配置
   */
  getRequestConfig(options = {}) {
    const config = {
      headers: this.buildHeaders(options.headers),
      timeout: options.timeout || 30000,
      maxRedirects: 3,
      validateStatus: () => true, // 允许所有状态码
    };

    // HTTP/2 支持
    if (this.enableHTTP2) {
      config.httpVersion = '2.0';
      config.http2 = true;
    }

    // TLS 配置
    if (this.enableTLSFingerprinting) {
      config.httpsAgent = this.createTLSAgent();
    }

    // 应用时序控制
    this.applyTimingControl();

    return config;
  }

  /**
   * 构建请求头
   */
  buildHeaders(customHeaders = {}) {
    const baseHeaders = {
      'User-Agent': this.userAgent,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...this.headers,
      ...customHeaders
    };

    // 添加随机化的安全头
    if (Math.random() > 0.5) {
      baseHeaders['X-Requested-With'] = 'XMLHttpRequest';
    }

    // 移除可能暴露代理的头
    delete baseHeaders['X-Forwarded-For'];
    delete baseHeaders['X-Real-IP'];
    delete baseHeaders['Via'];
    delete baseHeaders['Proxy-Connection'];

    this.logger.debug('构建请求头', {
      headersCount: Object.keys(baseHeaders).length,
      userAgent: baseHeaders['User-Agent'].substring(0, 30) + '...'
    });

    return baseHeaders;
  }

  /**
   * 创建TLS Agent
   */
  createTLSAgent() {
    const profile = this.currentProfile;
    
    const agent = {
      secureProtocol: profile.secureProtocol,
      ciphers: profile.ciphers.join(':'),
      honorCipherOrder: true,
      secureOptions: profile.secureOptions,
      minVersion: profile.minVersion,
      maxVersion: profile.maxVersion,
    };

    this.logger.debug('创建TLS Agent', {
      profile: profile.name,
      ciphersCount: profile.ciphers.length,
      protocol: profile.secureProtocol
    });

    return agent;
  }

  /**
   * 应用时序控制
   */
  applyTimingControl() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = this.timing.requestInterval || 1000;

    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest + this.getRandomDelay();
      
      this.logger.debug('应用时序控制', {
        delay,
        timeSinceLastRequest,
        minInterval,
        requestCount: this.requestCount
      });

      return new Promise(resolve => setTimeout(resolve, delay));
    }

    this.requestCount++;
    this.lastRequestTime = now;
    
    return Promise.resolve();
  }

  /**
   * 获取随机延迟
   */
  getRandomDelay() {
    const min = this.timing.minDelay || 100;
    const max = this.timing.maxDelay || 500;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 验证IP地址安全性
   */
  validateIPSecurity(ip, metadata = {}) {
    const issues = [];

    // 检查是否为云服务商IP
    const cloudProviders = [
      'amazon', 'aws', 'google', 'microsoft', 'azure', 
      'digitalocean', 'linode', 'vultr', 'ovh'
    ];

    if (metadata.org) {
      const org = metadata.org.toLowerCase();
      const isCloudProvider = cloudProviders.some(provider => 
        org.includes(provider)
      );
      
      if (isCloudProvider) {
        issues.push('云服务商IP');
      }
    }

    // 检查ASN
    if (metadata.asn) {
      const knownDataCenterASNs = [
        'AS16509', 'AS15169', 'AS8075', 'AS14061', 'AS16276'
      ];
      
      if (knownDataCenterASNs.includes(metadata.asn)) {
        issues.push('数据中心ASN');
      }
    }

    // 检查地理位置
    if (metadata.country && metadata.region) {
      // 可以添加地理位置验证逻辑
    }

    const isSecure = issues.length === 0;
    
    this.logger.info('IP安全性验证', {
      ip,
      isSecure,
      issues,
      org: metadata.org,
      asn: metadata.asn,
      country: metadata.country
    });

    return {
      isSecure,
      issues,
      score: isSecure ? 100 : Math.max(0, 100 - (issues.length * 25))
    };
  }

  /**
   * 生成安全的请求ID
   */
  generateRequestId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 清理敏感信息
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveKeys = [
      'authorization', 'password', 'token', 'key', 'secret',
      'x-api-key', 'api-key', 'auth-token', 'bearer'
    ];

    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      requests: {
        total: this.requestCount,
        lastRequestTime: this.lastRequestTime
      },
      security: {
        tlsFingerprinting: this.enableTLSFingerprinting,
        http2: this.enableHTTP2,
        currentProfile: this.currentProfile.name,
        userAgent: this.userAgent.substring(0, 50) + '...'
      },
      timing: {
        ...this.timing,
        averageDelay: (this.timing.minDelay + this.timing.maxDelay) / 2
      }
    };
  }

  /**
   * 初始化TLS配置文件
   */
  initializeTLSProfiles() {
    return {
      chrome120: {
        name: 'Chrome 120',
        secureProtocol: 'TLSv1_2_method',
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: [
          'TLS_AES_128_GCM_SHA256',
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'ECDHE-ECDSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-ECDSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-ECDSA-CHACHA20-POLY1305',
          'ECDHE-RSA-CHACHA20-POLY1305'
        ],
        secureOptions: 0
      },
      firefox119: {
        name: 'Firefox 119',
        secureProtocol: 'TLSv1_2_method',
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: [
          'TLS_AES_128_GCM_SHA256',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_256_GCM_SHA384',
          'ECDHE-ECDSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-ECDSA-CHACHA20-POLY1305',
          'ECDHE-RSA-CHACHA20-POLY1305',
          'ECDHE-ECDSA-AES256-GCM-SHA384'
        ],
        secureOptions: 0
      }
    };
  }

  /**
   * 选择TLS配置文件
   */
  selectTLSProfile() {
    const profiles = Object.values(this.tlsProfiles);
    return profiles[Math.floor(Math.random() * profiles.length)];
  }

  /**
   * 获取默认User-Agent
   */
  getDefaultUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * 获取默认请求头
   */
  getDefaultHeaders() {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * 获取默认时序配置
   */
  getDefaultTiming() {
    return {
      minDelay: 100,
      maxDelay: 500,
      requestInterval: 1000
    };
  }
}

export default SecurityManager; 