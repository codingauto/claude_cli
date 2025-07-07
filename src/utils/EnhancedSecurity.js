/**
 * 增强的安全伪装模块
 * 提高代理的隐蔽性
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class EnhancedSecurity {
  constructor() {
    this.loadFingerprints();
    this.currentBrowserProfile = null; // 存储当前会话的浏览器配置文件
  }

  /**
   * 从配置文件加载指纹数据
   */
  loadFingerprints() {
    const configPath = join(dirname(dirname(__dirname)), 'config', 'fingerprints.json');
    
    try {
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        
        // 将所有用户代理字符串合并到一个数组
        this.userAgents = Object.values(config.userAgents).flat();
        this.timezones = config.timezones;
        this.languages = config.languages;
        this.workingHours = config.workingHours;
        
        // 创建TLS配置池，而不是单一配置
        this.tlsProfiles = this.createTLSProfiles(config.tlsConfig);
        
        // 创建浏览器配置文件池
        this.browserProfiles = this.createBrowserProfiles();
        
        console.log(`Loaded ${this.userAgents.length} user agents, ${this.tlsProfiles.length} TLS profiles, and ${this.browserProfiles.length} browser profiles from fingerprints.json`);
      } else {
        // 如果配置文件不存在，使用默认值
        this.useDefaultFingerprints();
      }
    } catch (error) {
      console.error('Failed to load fingerprints config:', error.message);
      this.useDefaultFingerprints();
    }
  }

  /**
   * 使用默认指纹（后备方案）
   */
  useDefaultFingerprints() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ];
    
    this.timezones = {
      'US': ['America/New_York'],
      'UK': ['Europe/London'],
      'JP': ['Asia/Tokyo']
    };

    this.languages = {
      'US': 'en-US,en;q=0.9',
      'UK': 'en-GB,en;q=0.9',
      'JP': 'ja-JP,ja;q=0.9,en;q=0.8'
    };

    this.workingHours = {
      'US': { start: 9, end: 18 },
      'UK': { start: 9, end: 17 },
      'JP': { start: 9, end: 19 }
    };
    
    // 初始化默认TLS配置池
    this.tlsProfiles = this.getDefaultTLSProfiles();
    
    // 初始化默认浏览器配置文件池
    this.browserProfiles = this.createBrowserProfiles();
  }

  /**
   * 创建浏览器配置文件池
   */
  createBrowserProfiles() {
    return [
      {
        name: 'Chrome131-Win10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        secChUa: '"Not_A Brand";v="8", "Chromium";v="131", "Google Chrome";v="131"',
        secChUaMobile: '?0',
        secChUaPlatform: '"Windows"',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        acceptEncoding: 'gzip, deflate, br, zstd',
        secFetchSite: 'none',
        secFetchMode: 'navigate',
        secFetchUser: '?1',
        secFetchDest: 'document',
        tlsProfileName: 'Chrome131-Win'
      },
      {
        name: 'Chrome131-macOS',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        secChUa: '"Not_A Brand";v="8", "Chromium";v="131", "Google Chrome";v="131"',
        secChUaMobile: '?0',
        secChUaPlatform: '"macOS"',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        acceptEncoding: 'gzip, deflate, br, zstd',
        secFetchSite: 'none',
        secFetchMode: 'navigate',
        secFetchUser: '?1',
        secFetchDest: 'document',
        tlsProfileName: 'Chrome131-macOS'
      },
      {
        name: 'Firefox133-Win10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
        acceptEncoding: 'gzip, deflate, br, zstd',
        secFetchSite: 'none',
        secFetchMode: 'navigate', 
        secFetchUser: '?1',
        secFetchDest: 'document',
        tlsProfileName: 'Firefox133-Win'
      },
      {
        name: 'Safari17-macOS',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        acceptEncoding: 'gzip, deflate, br',
        tlsProfileName: 'Safari17-macOS'
      },
      {
        name: 'Edge131-Win10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
        secChUa: '"Not_A Brand";v="8", "Chromium";v="131", "Microsoft Edge";v="131"',
        secChUaMobile: '?0',
        secChUaPlatform: '"Windows"',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        acceptEncoding: 'gzip, deflate, br, zstd',
        secFetchSite: 'none',
        secFetchMode: 'navigate',
        secFetchUser: '?1',
        secFetchDest: 'document',
        tlsProfileName: 'Edge131-Win'
      }
    ];
  }
  
  /**
   * 选择并设置当前会话的浏览器配置文件
   */
  selectBrowserProfile() {
    this.currentBrowserProfile = this.browserProfiles[Math.floor(Math.random() * this.browserProfiles.length)];
    return this.currentBrowserProfile;
  }
  
  /**
   * 获取当前浏览器配置文件，如果没有则选择一个
   */
  getCurrentBrowserProfile() {
    if (!this.currentBrowserProfile) {
      this.selectBrowserProfile();
    }
    return this.currentBrowserProfile;
  }

  /**
   * 生成更真实的请求头
   */
  generateHeaders(country = 'US') {
    const profile = this.getCurrentBrowserProfile();
    const timezone = this.getRandomTimezone(country);
    const language = this.getLanguage(country);
    
    // 根据时区调整时间相关的头部
    const date = new Date();
    const localTime = this.getLocalTimeForTimezone(date, timezone);
    
    // 使用配置文件中的一致性头部
    const headers = {
      'User-Agent': profile.userAgent,
      'Accept': profile.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': language,
      'Accept-Encoding': profile.acceptEncoding || 'gzip, deflate, br',
      'DNT': Math.random() > 0.5 ? '1' : undefined,
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };
    
    // 添加Chrome/Edge特有的头部
    if (profile.secChUa) {
      headers['Sec-CH-UA'] = profile.secChUa;
      headers['Sec-CH-UA-Mobile'] = profile.secChUaMobile;
      headers['Sec-CH-UA-Platform'] = profile.secChUaPlatform;
    }
    
    // 添加Sec-Fetch头部（Chrome, Firefox, Edge支持）
    if (profile.secFetchSite) {
      headers['Sec-Fetch-Dest'] = profile.secFetchDest;
      headers['Sec-Fetch-Mode'] = profile.secFetchMode;
      headers['Sec-Fetch-Site'] = profile.secFetchSite;
      headers['Sec-Fetch-User'] = profile.secFetchUser;
    }
    
    // 通过 Date 头部间接反映时区（标准方式）
    if (Math.random() > 0.7) {
      headers['Date'] = localTime.toUTCString();
    }
    
    // 通过 Cookie 传递时区信息（许多网站这样做）
    if (Math.random() > 0.5) {
      headers['Cookie'] = `tz=${timezone.replace('/', '_')}; locale=${language.split(',')[0]}`;
    }
    
    return headers;
  }

  /**
   * 添加随机延迟
   */
  async addHumanDelay() {
    // 模拟人类的思考和输入时间
    const baseDelay = 500; // 基础延迟
    const variance = Math.random() * 2000; // 0-2秒的随机变化
    const typingDelay = Math.random() * 1000; // 模拟打字时间
    
    const totalDelay = baseDelay + variance + typingDelay;
    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  /**
   * 生成请求间隔
   */
  getRequestInterval() {
    // 避免固定间隔，使用泊松分布
    const lambda = 1 / 30000; // 平均30秒
    const u = Math.random();
    const interval = -Math.log(1 - u) / lambda;
    
    // 限制在合理范围内
    return Math.max(15000, Math.min(120000, interval));
  }


  /**
   * 模拟会话行为
   */
  simulateSession(country = 'US') {
    // 根据地区调整活跃时间
    const hour = new Date().getHours();
    const isWorkingHours = this.isWorkingHours(hour, country);
    
    return {
      // 模拟标签页切换
      tabActive: Math.random() > 0.3,
      // 模拟窗口焦点
      windowFocused: Math.random() > 0.2,
      // 工作时间更活跃
      activityLevel: isWorkingHours ? 'high' : 'low',
      // 模拟鼠标移动
      mouseMovement: this.generateMousePattern(),
      // 模拟键盘活动
      keyboardActivity: this.generateKeyboardPattern(),
      // 时区相关的活动模式
      localBehavior: {
        timezone: this.getRandomTimezone(country),
        workingHours: isWorkingHours,
        deviceType: this.getDeviceType()
      }
    };
  }
  
  /**
   * 判断是否为工作时间
   */
  isWorkingHours(hour, country) {
    const hours = this.workingHours[country] || this.workingHours['US'];
    return hour >= hours.start && hour < hours.end;
  }
  
  /**
   * 获取设备类型
   */
  getDeviceType() {
    const types = ['desktop', 'laptop'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * 生成鼠标移动模式
   */
  generateMousePattern() {
    const movements = [];
    const count = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < count; i++) {
      movements.push({
        x: Math.floor(Math.random() * 1920),
        y: Math.floor(Math.random() * 1080),
        timestamp: Date.now() + (i * 1000)
      });
    }
    
    return movements;
  }

  /**
   * 生成键盘输入模式
   */
  generateKeyboardPattern() {
    // 模拟真实的打字速度变化
    const typingSpeeds = [];
    const count = Math.floor(Math.random() * 20) + 10;
    
    for (let i = 0; i < count; i++) {
      typingSpeeds.push({
        wpm: 40 + Math.floor(Math.random() * 60), // 40-100 WPM
        timestamp: Date.now() + (i * 2000)
      });
    }
    
    return typingSpeeds;
  }

  /**
   * 获取随机 User-Agent
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * 获取随机时区
   */
  getRandomTimezone(country) {
    const timezones = this.timezones[country] || this.timezones['US'];
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  /**
   * 获取语言设置
   */
  getLanguage(country) {
    return this.languages[country] || this.languages['US'];
  }


  /**
   * 获取时区对应的本地时间
   */
  getLocalTimeForTimezone(date, timezone) {
    try {
      return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    } catch (e) {
      return date; // 如果时区无效，返回原始时间
    }
  }

  /**
   * 创建TLS配置池
   */
  createTLSProfiles(baseConfig) {
    if (!baseConfig) {
      return this.getDefaultTLSProfiles();
    }
    
    // 创建多个TLS配置变体，模拟不同浏览器的指纹
    const profiles = [
      {
        // Chrome 131 on Windows
        name: 'Chrome131-Win',
        ciphers: [
          'TLS_AES_128_GCM_SHA256',
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'ECDHE-ECDSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES128-GCM-SHA256'
        ].join(':'),
        ALPNProtocols: ['h2', 'http/1.1'],
        sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256',
        supportedGroups: ['X25519', 'P-256', 'P-384']
      },
      {
        // Chrome 131 on macOS
        name: 'Chrome131-macOS',
        ciphers: [
          'TLS_AES_128_GCM_SHA256',
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256'
        ].join(':'),
        ALPNProtocols: ['h2', 'http/1.1'],
        sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256',
        supportedGroups: ['X25519', 'P-256']
      },
      {
        // Firefox 133 on Windows
        name: 'Firefox133-Win',
        ciphers: [
          'TLS_AES_128_GCM_SHA256',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_256_GCM_SHA384'
        ].join(':'),
        ALPNProtocols: ['h2', 'http/1.1'],
        sigalgs: 'ecdsa_secp256r1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha256',
        supportedGroups: ['X25519', 'P-256', 'P-384', 'P-521']
      },
      {
        // Safari 17 on macOS
        name: 'Safari17-macOS',
        ciphers: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_AES_128_GCM_SHA256',
          'TLS_CHACHA20_POLY1305_SHA256'
        ].join(':'),
        ALPNProtocols: ['h2', 'http/1.1'],
        sigalgs: 'ecdsa_secp256r1_sha256:ecdsa_secp384r1_sha384',
        supportedGroups: ['X25519', 'P-256', 'P-384']
      },
      {
        // Edge 131 on Windows
        name: 'Edge131-Win',
        ciphers: baseConfig.ciphers.join(':'),
        ALPNProtocols: baseConfig.protocols,
        sigalgs: baseConfig.signatureAlgorithms.join(':'),
        supportedGroups: baseConfig.supportedGroups
      }
    ];
    
    return profiles;
  }
  
  /**
   * 获取默认TLS配置池
   */
  getDefaultTLSProfiles() {
    return [
      {
        name: 'Default-Chrome',
        ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384',
        ALPNProtocols: ['h2', 'http/1.1'],
        sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256',
        supportedGroups: ['X25519', 'P-256']
      }
    ];
  }

  /**
   * 获取与当前浏览器配置文件匹配的TLS配置
   */
  getTLSConfig() {
    const browserProfile = this.getCurrentBrowserProfile();
    
    // 查找匹配的TLS配置
    let tlsProfile = this.tlsProfiles.find(p => p.name === browserProfile.tlsProfileName);
    
    // 如果没有找到匹配的，使用随机的
    if (!tlsProfile) {
      tlsProfile = this.tlsProfiles[Math.floor(Math.random() * this.tlsProfiles.length)];
    }
    
    return {
      ciphers: tlsProfile.ciphers,
      ALPNProtocols: tlsProfile.ALPNProtocols,
      sigalgs: tlsProfile.sigalgs,
      supportedGroups: tlsProfile.supportedGroups,
      profileName: tlsProfile.name // 用于调试
    };
  }
  /**
   * 获取时区（getTimezone 别名）
   */
  getTimezone(country) {
    return this.getRandomTimezone(country);
  }

  /**
   * 生成 Accept 头部
   */
  generateAcceptHeader() {
    const acceptTypes = [
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    ];
    return acceptTypes[Math.floor(Math.random() * acceptTypes.length)];
  }

  /**
   * 生成缓存控制头部
   */
  generateCacheHeaders() {
    const cacheOptions = [
      { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      { 'Cache-Control': 'max-age=0', 'Pragma': 'no-cache' },
      { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' }
    ];
    return cacheOptions[Math.floor(Math.random() * cacheOptions.length)];
  }

  /**
   * 生成安全相关头部
   */
  generateSecurityHeaders() {
    const sites = ['none', 'same-origin', 'same-site', 'cross-site'];
    const modes = ['navigate', 'no-cors', 'cors', 'same-origin'];
    const dests = ['document', 'empty', 'script', 'style'];
    
    return {
      'DNT': '1',
      'Sec-Fetch-Site': sites[Math.floor(Math.random() * sites.length)],
      'Sec-Fetch-Mode': modes[Math.floor(Math.random() * modes.length)],
      'Sec-Fetch-Dest': dests[Math.floor(Math.random() * dests.length)],
      'Sec-Fetch-User': Math.random() > 0.5 ? '?1' : undefined
    };
  }

  /**
   * 获取本地时间
   */
  getLocalTimeForTimezone(date, timezone) {
    // 简化实现，返回当前时间
    return date;
  }

  /**
   * 模拟会话行为并返回指纹一致性信息
   */
  simulateSession() {
    const profile = this.getCurrentBrowserProfile();
    return {
      startTime: Date.now(),
      profileName: profile.name,
      consistency: {
        platformMatch: true,
        tlsMatch: true,
        headerMatch: true
      }
    };
  }
}

export default EnhancedSecurity;