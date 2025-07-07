/**
 * 噪音流量管理器 - 生成背景流量混淆代理模式
 * 模拟真实用户浏览行为，避免流量模式过于单一
 */

import axios from 'axios';

class NoiseManager {
  constructor(logger, proxyManager) {
    this.logger = logger.child({ component: 'NoiseManager' });
    this.proxyManager = proxyManager;
    this.isRunning = false;
    this.noiseInterval = null;
    
    // 常见的良性目标站点
    this.targetSites = [
      'https://www.google.com',
      'https://www.wikipedia.org',
      'https://www.weather.com',
      'https://www.bbc.com/news',
      'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
      'https://www.cloudflare.com/cdn-cgi/trace',
      'https://api.github.com/meta',
      'https://www.gstatic.com/generate_204',
      'https://www.google-analytics.com/analytics.js',
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
      'https://unpkg.com/react@18/umd/react.production.min.js'
    ];
    
    // 请求类型分布
    this.requestTypes = [
      { method: 'GET', weight: 0.85 },
      { method: 'HEAD', weight: 0.15 }
    ];
    
    // 统计信息
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastRequestTime: null
    };
  }

  /**
   * 启动噪音生成器
   */
  start() {
    if (this.isRunning) {
      this.logger.warn('NoiseManager already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting noise traffic generator');
    
    // 立即发送第一个请求
    this.generateNoiseRequest();
    
    // 调度下一个请求
    this.scheduleNextRequest();
  }

  /**
   * 停止噪音生成器
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.noiseInterval) {
      clearTimeout(this.noiseInterval);
      this.noiseInterval = null;
    }
    
    this.logger.info('Stopped noise traffic generator', { stats: this.stats });
  }

  /**
   * 调度下一个噪音请求
   */
  scheduleNextRequest() {
    if (!this.isRunning) {
      return;
    }

    // 5-15分钟的随机间隔
    const minInterval = 5 * 60 * 1000; // 5分钟
    const maxInterval = 15 * 60 * 1000; // 15分钟
    const interval = minInterval + Math.random() * (maxInterval - minInterval);
    
    this.noiseInterval = setTimeout(() => {
      this.generateNoiseRequest();
      this.scheduleNextRequest(); // 递归调度
    }, interval);
    
    this.logger.debug('Next noise request scheduled', { 
      intervalMinutes: (interval / 60000).toFixed(1) 
    });
  }

  /**
   * 生成单个噪音请求
   */
  async generateNoiseRequest() {
    if (!this.isRunning) {
      return;
    }

    // 检查代理是否健康
    if (!this.proxyManager.isHealthy || !this.proxyManager.currentSession) {
      this.logger.debug('Skipping noise request - proxy not ready');
      return;
    }

    const targetUrl = this.selectRandomTarget();
    const method = this.selectRequestMethod();
    const startTime = Date.now();

    try {
      // 获取当前代理配置
      const proxyConfig = this.proxyManager.currentSession.proxyConfig;
      
      // 使用增强安全模块生成真实的请求头，使用与主流量相同的国家代码
      const country = this.proxyManager.currentCountry || 'US';
      const headers = this.proxyManager.enhancedSecurity.generateHeaders(country);
      
      // 构建请求配置
      const config = {
        method,
        url: targetUrl,
        headers,
        httpsAgent: proxyConfig.agent.https,
        httpAgent: proxyConfig.agent.http,
        timeout: 10000,
        maxRedirects: 3,
        validateStatus: (status) => status < 500 // 接受所有非5xx响应
      };

      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      
      this.stats.totalRequests++;
      this.stats.successfulRequests++;
      this.stats.lastRequestTime = new Date();
      
      this.logger.info('Noise request completed', {
        method,
        url: targetUrl,
        status: response.status,
        responseTime
      });
    } catch (error) {
      this.stats.totalRequests++;
      this.stats.failedRequests++;
      
      this.logger.warn('Noise request failed', {
        method,
        url: targetUrl,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * 选择随机目标URL
   */
  selectRandomTarget() {
    return this.targetSites[Math.floor(Math.random() * this.targetSites.length)];
  }

  /**
   * 选择请求方法
   */
  selectRequestMethod() {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const type of this.requestTypes) {
      cumulativeWeight += type.weight;
      if (random < cumulativeWeight) {
        return type.method;
      }
    }
    
    return 'GET'; // 默认
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests).toFixed(2)
        : 0
    };
  }

  /**
   * 关闭管理器
   */
  shutdown() {
    this.stop();
  }
}

export default NoiseManager;