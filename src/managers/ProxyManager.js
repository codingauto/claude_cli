/**
 * 代理管理器 - 住宅代理连接、会话管理、故障转移
 * 支持多供应商：LumiProxy, Oxylabs, Bright Data
 */

import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import IPReputationChecker from '../utils/IPReputationChecker.js';
import EnhancedSecurity from '../utils/EnhancedSecurity.js';
import GeoMatcher from '../utils/GeoMatcher.js';

class ProxyManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger.child({ component: 'ProxyManager' });
    
    // 会话状态管理
    this.sessions = new Map();
    this.currentSession = null;
    this.sessionStartTime = null;
    // sessionDuration 已移除 - 现在使用随机化的会话时长（18-30小时）
    
    // 代理提供商配置
    this.providers = this.config.providers || [];
    this.currentProviderIndex = 0;
    
    // 连接状态
    this.isHealthy = false;
    this.lastHealthCheck = null;
    this.consecutiveFailures = 0;
    this.maxFailures = 3;
    
    // 统计信息
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      sessionRenewals: 0,
      providerSwitches: 0,
      averageResponseTime: 0
    };

    // IP 纯净度检查器 - 稍后在有代理配置后初始化
    this.ipChecker = null;
    this.lastIPReport = null;

    // 增强安全模块
    this.enhancedSecurity = new EnhancedSecurity();
    this.lastRequestTime = Date.now();
    
    // 地理位置匹配器
    this.geoMatcher = new GeoMatcher(this.logger);
    this.currentCountry = null;
    
    // IP 信息缓存
    this.ipCache = null;

    // Note: Initialization moved to static factory method
  }

  /**
   * 静态工厂方法 - 创建并初始化 ProxyManager 实例
   */
  static async create(config, logger) {
    const manager = new ProxyManager(config, logger);
    await manager._initialize();
    return manager;
  }

  /**
   * 私有初始化方法
   */
  async _initialize() {
    try {
      this.logger.info('Initializing ProxyManager');
      
      // 验证配置
      this.validateConfig();
      
      // 创建初始会话
      await this.createSession();
      
      // 启动健康检查
      this.startHealthCheck();
      
      this.logger.info('ProxyManager initialized successfully', {
        providersCount: this.providers.length,
        sessionId: this.currentSession?.id
      });
    } catch (error) {
      this.logger.error('Failed to initialize ProxyManager', { error: error.message });
      throw error;
    }
  }

  /**
   * 验证配置
   */
  validateConfig() {
    if (!this.providers || this.providers.length === 0) {
      throw new Error('No proxy providers configured');
    }

    for (const provider of this.providers) {
      if (!provider.name || !provider.host || !provider.port) {
        throw new Error(`Invalid provider configuration: ${JSON.stringify(provider)}`);
      }
    }
  }

  /**
   * 创建新会话
   */
  async createSession() {
    const sessionId = uuidv4();
    const provider = this.getCurrentProvider();
    
    try {
      this.logger.proxy(sessionId, provider.name, 'creating_session');
      
      // 为新会话选择新的浏览器配置文件，确保一致性
      this.enhancedSecurity.selectBrowserProfile();
      
      // 构建代理配置
      const proxyConfig = this.buildProxyConfig(provider);
      
      // 测试代理连接
      await this.testProxyConnection(proxyConfig);
      
      // 创建会话对象 - 使用随机化的会话时长（18-30小时）
      const randomHours = 18 + Math.random() * 12; // 18-30小时随机
      const randomDuration = randomHours * 60 * 60 * 1000; // 转换为毫秒
      
      const session = {
        id: sessionId,
        provider: provider.name,
        proxyConfig,
        createdAt: Date.now(),
        expiresAt: Date.now() + randomDuration,
        requestCount: 0,
        isActive: true,
        plannedDuration: randomDuration, // 记录计划的会话时长
        plannedHours: randomHours.toFixed(2) // 记录具体小时数用于日志
      };

      // 保存会话
      this.sessions.set(sessionId, session);
      this.currentSession = session;
      this.sessionStartTime = Date.now();
      
      // 初始化或更新 IP 检查器，传入代理配置以防止DNS泄露
      if (!this.ipChecker) {
        this.ipChecker = new IPReputationChecker(this.logger, proxyConfig.agent);
      } else {
        // 更新代理配置
        this.ipChecker.proxyAgent = proxyConfig.agent;
      }
      
      this.logger.proxy(sessionId, provider.name, 'session_created', {
        expiresAt: new Date(session.expiresAt).toISOString(),
        durationHours: session.plannedHours,
        sessionType: 'randomized_duration'
      });

      this.stats.sessionRenewals++;
      return session;
    } catch (error) {
      this.logger.error('Failed to create session', { 
        sessionId, 
        provider: provider.name, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 构建代理配置
   */
  buildProxyConfig(provider) {
    const auth = provider.username && provider.password 
      ? `${provider.username}:${provider.password}@` 
      : '';
    
    const proxyUrl = `http://${auth}${provider.host}:${provider.port}`;
    const tlsConfig = this.enhancedSecurity.getTLSConfig();
    
    return {
      url: proxyUrl,
      agent: {
        http: new HttpProxyAgent(proxyUrl),
        https: new HttpsProxyAgent(proxyUrl, {
          // 增强TLS指纹
          ciphers: tlsConfig.ciphers,
          ALPNProtocols: tlsConfig.ALPNProtocols,
          rejectUnauthorized: false
        })
      },
      timeout: provider.timeout || 30000
    };
  }

  /**
   * 测试代理连接
   */
  async testProxyConnection(proxyConfig) {
    const startTime = Date.now();
    
    try {
      // 步骤1: 获取代理IP
      const proxyIP = await this._fetchProxyIP(proxyConfig);
      const responseTime = Date.now() - startTime;
      
      // 步骤2: 验证IP类型
      const ipValidation = await this._validateIPType(proxyIP);
      
      // 步骤3: 检查IP质量
      const ipReport = await this._checkIPQuality(proxyIP);
      
      this.logger.info('Proxy connection test successful', {
        proxyIP,
        responseTime,
        testUrl: 'https://httpbin.org/ip',
        ipScore: ipReport.summary.score,
        ipRating: ipReport.summary.rating
      });

      return { success: true, ip: proxyIP, responseTime, ipReport };
    } catch (error) {
      this.logger.error('Proxy connection test failed', { 
        error: error.message
      });
      throw new Error(`Proxy connection test failed: ${error.message}`);
    }
  }

  /**
   * 获取代理IP地址
   * @private
   */
  async _fetchProxyIP(proxyConfig) {
    const testUrl = 'https://httpbin.org/ip';
    
    try {
      // 根据IP位置生成对应的请求头
      const country = this.currentCountry || 'US'; // 使用保存的国家代码
      const headers = this.enhancedSecurity.generateHeaders(country);
      
      const response = await axios.get(testUrl, {
        httpsAgent: proxyConfig.agent.https,
        httpAgent: proxyConfig.agent.http,
        timeout: proxyConfig.timeout,
        headers
      });

      return response.data.origin;
    } catch (error) {
      throw new Error(`Failed to fetch proxy IP: ${error.message}`);
    }
  }

  /**
   * 验证IP是否为住宅类型
   * @private
   */
  async _validateIPType(ip) {
    try {
      const validation = await this.validateResidentialIP(ip);
      if (!validation.isResidential) {
        this.logger.warn('IP may not be residential', { ip, validation });
      }
      return validation;
    } catch (error) {
      throw new Error(`IP type validation failed: ${error.message}`);
    }
  }

  /**
   * 检查IP纯净度和质量
   * @private
   */
  async _checkIPQuality(ip) {
    try {
      // 如果ipChecker还未初始化，暂时跳过质量检查
      if (!this.ipChecker) {
        this.logger.warn('IP checker not initialized yet, skipping quality check');
        return {
          summary: {
            score: 50,
            rating: 'Unknown',
            recommendation: 'IP quality check skipped - checker not initialized'
          }
        };
      }
      
      const ipReport = await this.ipChecker.getDetailedReport(ip);
      this.lastIPReport = ipReport;
      
      if (ipReport.summary.score < 50) {
        this.logger.warn('Low IP quality score', { 
          ip, 
          score: ipReport.summary.score,
          rating: ipReport.summary.rating
        });
      }
      
      return ipReport;
    } catch (error) {
      throw new Error(`IP quality check failed: ${error.message}`);
    }
  }

  /**
   * 验证住宅IP
   */
  async validateResidentialIP(ip) {
    // 检查缓存
    if (this.ipCache && this.ipCache.ip === ip) {
      const cacheAge = Date.now() - this.ipCache.timestamp;
      if (cacheAge < 3600000) { // 1小时缓存
        this.logger.debug('Using cached IP info', { ip, cacheAge });
        return this.ipCache.data;
      }
    }
    
    try {
      // 使用 IPinfo 或类似服务验证IP类型 - 必须通过代理请求
      const config = {
        timeout: 5000
      };
      
      // 使用当前会话的代理配置防止DNS泄露
      if (this.currentSession?.proxyConfig?.agent) {
        config.httpsAgent = this.currentSession.proxyConfig.agent.https;
        config.httpAgent = this.currentSession.proxyConfig.agent.http;
      }
      
      const response = await axios.get(`https://ipinfo.io/${ip}/json`, config);

      const { org, country, region } = response.data;
      
      // 检查是否为云服务商IP
      const cloudProviders = ['amazon', 'google', 'microsoft', 'digitalocean', 'linode'];
      const isCloudIP = cloudProviders.some(provider => 
        org?.toLowerCase().includes(provider)
      );

      if (isCloudIP) {
        throw new Error(`Detected cloud provider IP: ${org}`);
      }

      this.logger.security('ip_validation', 'success', {
        ip,
        org,
        country,
        region,
        type: 'residential'
      });

      const result = { isResidential: true, org, country, region };
      
      // 缓存结果
      this.ipCache = {
        ip,
        data: result,
        timestamp: Date.now()
      };
      
      // 保存当前国家代码
      this.currentCountry = country;

      return result;
    } catch (error) {
      this.logger.warn('IP validation failed', { ip, error: error.message });
      // 不抛出错误，只记录警告
      return { isResidential: false, error: error.message };
    }
  }

  /**
   * 获取当前代理配置
   */
  getProxyConfig() {
    if (!this.currentSession || !this.isSessionValid()) {
      throw new Error('No valid proxy session available');
    }

    return this.currentSession.proxyConfig;
  }

  /**
   * 应用请求限流和延迟（副作用函数）
   */
  async applyRequestThrottling() {
    // 计算请求间隔
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const requiredInterval = this.enhancedSecurity.getRequestInterval();
    
    if (timeSinceLastRequest < requiredInterval) {
      const waitTime = requiredInterval - timeSinceLastRequest;
      this.logger.debug('Applying request interval delay', { waitTime });
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // 添加人类行为延迟
    await this.enhancedSecurity.addHumanDelay();
    
    // 更新最后请求时间
    this.lastRequestTime = Date.now();
  }

  /**
   * 构建增强的代理配置（纯函数）
   */
  buildEnhancedProxyConfig() {
    const baseConfig = this.getProxyConfig();
    
    // 生成会话行为模式
    const sessionBehavior = this.enhancedSecurity.simulateSession();
    
    // 获取对应国家的请求头
    const country = this.currentCountry || 'US'; // 使用保存的国家代码
    const headers = this.enhancedSecurity.generateHeaders(country);
    
    return {
      ...baseConfig,
      headers,
      sessionBehavior
    };
  }

  /**
   * 获取增强的代理配置（保留以兼容现有代码）
   * @deprecated 使用 applyRequestThrottling() 和 buildEnhancedProxyConfig() 替代
   */
  async getEnhancedProxyConfig() {
    await this.applyRequestThrottling();
    return this.buildEnhancedProxyConfig();
  }

  /**
   * 检查会话是否有效
   */
  isSessionValid() {
    if (!this.currentSession) return false;
    
    const now = Date.now();
    const isExpired = now >= this.currentSession.expiresAt;
    const isActive = this.currentSession.isActive;
    
    return !isExpired && isActive;
  }

  /**
   * 续期或创建新会话
   */
  async renewSession() {
    try {
      this.logger.info('Renewing proxy session', {
        currentSessionId: this.currentSession?.id,
        reason: 'session_expired'
      });

      // 标记当前会话为非活跃
      if (this.currentSession) {
        this.currentSession.isActive = false;
      }

      // 创建新会话
      await this.createSession();
      
      this.logger.info('Session renewed successfully', {
        newSessionId: this.currentSession.id
      });

      return this.currentSession;
    } catch (error) {
      this.logger.error('Failed to renew session', { error: error.message });
      
      // 尝试切换到下一个提供商
      await this.switchProvider();
      throw error;
    }
  }

  /**
   * 切换代理提供商
   */
  async switchProvider() {
    const oldProviderIndex = this.currentProviderIndex;
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    
    const oldProvider = this.providers[oldProviderIndex];
    const newProvider = this.providers[this.currentProviderIndex];
    
    this.logger.warn('Switching proxy provider', {
      from: oldProvider.name,
      to: newProvider.name,
      reason: 'connection_failure'
    });

    try {
      await this.createSession();
      this.stats.providerSwitches++;
      
      this.logger.info('Provider switch successful', {
        newProvider: newProvider.name,
        sessionId: this.currentSession.id
      });
    } catch (error) {
      this.logger.error('Provider switch failed', { 
        provider: newProvider.name, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider() {
    return this.providers[this.currentProviderIndex];
  }

  /**
   * 记录请求
   */
  recordRequest(success = true, responseTime = 0) {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      this.consecutiveFailures = 0;
    } else {
      this.stats.failedRequests++;
      this.consecutiveFailures++;
    }

    // 更新平均响应时间
    if (success && responseTime > 0) {
      const totalSuccessful = this.stats.successfulRequests;
      if (totalSuccessful === 1) {
        this.stats.averageResponseTime = responseTime;
      } else {
        this.stats.averageResponseTime = 
          ((this.stats.averageResponseTime * (totalSuccessful - 1)) + responseTime) / totalSuccessful;
      }
    }

    // 更新会话请求计数
    if (this.currentSession) {
      this.currentSession.requestCount++;
    }

    // 检查是否需要故障转移
    if (this.consecutiveFailures >= this.maxFailures) {
      this.handleConsecutiveFailures();
    }
  }

  /**
   * 处理连续失败
   */
  async handleConsecutiveFailures() {
    this.logger.warn('Handling consecutive failures', {
      consecutiveFailures: this.consecutiveFailures,
      maxFailures: this.maxFailures
    });

    try {
      await this.switchProvider();
      this.consecutiveFailures = 0;
    } catch (error) {
      this.logger.error('Failed to handle consecutive failures', { 
        error: error.message 
      });
    }
  }

  /**
   * 启动健康检查
   */
  startHealthCheck() {
    // 增加到 5-10 分钟的随机间隔
    const baseInterval = 300000; // 5分钟
    const variance = Math.random() * 300000; // 0-5分钟随机
    
    const scheduleNextCheck = () => {
      const interval = baseInterval + variance;
      setTimeout(async () => {
        await this.performHealthCheck();
        scheduleNextCheck(); // 递归调度，每次间隔都不同
      }, interval);
    };

    // 延迟首次检查
    setTimeout(() => {
      this.performHealthCheck();
      scheduleNextCheck();
    }, 30000); // 30秒后首次检查
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    try {
      if (!this.currentSession || !this.isSessionValid()) {
        this.isHealthy = false;
        return;
      }

      const proxyConfig = this.currentSession.proxyConfig;
      const result = await this.testProxyConnection(proxyConfig);
      
      this.isHealthy = result.success;
      this.lastHealthCheck = Date.now();
      
      this.logger.debug('Health check completed', {
        isHealthy: this.isHealthy,
        sessionId: this.currentSession.id,
        responseTime: result.responseTime
      });
    } catch (error) {
      this.isHealthy = false;
      this.logger.warn('Health check failed', { error: error.message });
    }
  }

  /**
   * 获取状态信息
   */
  getStatus() {
    return {
      isHealthy: this.isHealthy,
      currentSession: this.currentSession ? {
        id: this.currentSession.id,
        provider: this.currentSession.provider,
        createdAt: this.currentSession.createdAt,
        expiresAt: this.currentSession.expiresAt,
        requestCount: this.currentSession.requestCount,
        isActive: this.currentSession.isActive,
        plannedHours: this.currentSession.plannedHours || '24.00', // 兼容旧会话
        remainingHours: ((this.currentSession.expiresAt - Date.now()) / (60 * 60 * 1000)).toFixed(2)
      } : null,
      stats: { ...this.stats },
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      sessionCount: this.sessions.size
    };
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now >= session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info('Cleaned up expired sessions', { cleanedCount });
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      averageResponseTime: this.stats.averageResponseTime,
      providers: this.providers.map(provider => ({
        name: provider.name,
        host: provider.host,
        port: provider.port
      })),
      currentProvider: this.getCurrentProvider()?.name || null,
      isHealthy: this.isHealthy,
      consecutiveFailures: this.consecutiveFailures,
      activeSessions: this.sessions.size,
      currentSession: this.currentSession ? {
        id: this.currentSession.id,
        provider: this.currentSession.provider,
        requestCount: this.currentSession.requestCount
      } : null,
      ipReport: this.lastIPReport
    };
  }

  /**
   * 获取最新的IP纯净度报告
   */
  getIPReport() {
    return this.lastIPReport;
  }

  /**
   * 检查健康状态
   */
  async checkHealth() {
    await this.performHealthCheck();
    return this.isHealthy;
  }

  /**
   * 获取增强的代理配置（包含代理和安全头部）
   */
  async getEnhancedProxyConfig() {
    if (!this.currentSession || !this.isSessionValid()) {
      throw new Error('No valid proxy session available');
    }

    // 获取基础代理配置
    const proxyConfig = this.currentSession.proxyConfig;
    
    // 获取增强的安全头部
    const headers = this.enhancedSecurity.getHeaders();
    
    // 如果有地理位置信息，应用地理匹配头部
    if (this.currentCountry) {
      const geoHeaders = this.geoMatcher.generateGeoHeaders(this.currentCountry, headers);
      Object.assign(headers, geoHeaders);
      
      // 也调整User-Agent以匹配地理位置
      if (headers['User-Agent']) {
        headers['User-Agent'] = this.geoMatcher.adjustUserAgentForGeo(
          this.currentCountry,
          headers['User-Agent']
        );
      }
    }
    
    // 返回增强配置
    return {
      agent: proxyConfig.agent,
      headers: headers,
      sessionBehavior: {
        profileName: this.enhancedSecurity.currentProfile?.name || 'Unknown',
        country: this.currentCountry || 'Unknown',
        requestCount: this.currentSession.requestCount
      }
    };
  }

  /**
   * 关闭代理管理器
   */
  close() {
    this.logger.info('Shutting down ProxyManager');
    
    // 标记所有会话为非活跃
    for (const session of this.sessions.values()) {
      session.isActive = false;
    }
    
    this.currentSession = null;
    this.isHealthy = false;
  }

  /**
   * 关闭代理管理器（别名）
   */
  async shutdown() {
    this.close();
  }
}

export default ProxyManager; 