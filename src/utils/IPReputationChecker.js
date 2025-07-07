/**
 * IP 纯净度检查器
 * 提供多维度的 IP 质量评估
 */

import axios from 'axios';

class IPReputationChecker {
  constructor(logger, proxyAgent = null) {
    this.logger = logger;
    this.proxyAgent = proxyAgent; // 添加代理agent以防止DNS泄露
    
    // IP 质量评分权重
    this.scoreWeights = {
      isResidential: 40,    // 是否为住宅IP
      notInBlacklist: 30,   // 不在黑名单中
      lowRiskScore: 20,     // 风险评分低
      goodReputation: 10    // 良好声誉
    };
  }

  /**
   * 综合检查 IP 纯净度
   * @param {string} ip - 要检查的IP地址
   * @returns {Object} 纯净度报告
   */
  async checkIPQuality(ip) {
    const report = {
      ip,
      score: 0,
      details: {},
      risks: [],
      recommendation: '',
      timestamp: new Date().toISOString()
    };

    try {
      // 1. 基础信息检查
      const basicInfo = await this.getBasicIPInfo(ip);
      report.details.basic = basicInfo;
      
      // 2. 检查是否为住宅IP
      if (await this.isResidentialIP(basicInfo)) {
        report.score += this.scoreWeights.isResidential;
        report.details.ipType = 'residential';
      } else {
        report.risks.push('Non-residential IP detected');
        report.details.ipType = 'datacenter';
      }

      // 3. 检查黑名单数据库
      const blacklistCheck = await this.checkBlacklists(ip);
      report.details.blacklist = blacklistCheck;
      if (!blacklistCheck.isListed) {
        report.score += this.scoreWeights.notInBlacklist;
      } else {
        report.risks.push(`IP listed in ${blacklistCheck.lists.length} blacklists`);
      }

      // 4. 检查IP风险评分
      const riskScore = await this.checkIPRiskScore(ip);
      report.details.riskScore = riskScore;
      if (riskScore.score < 25) {
        report.score += this.scoreWeights.lowRiskScore;
      } else if (riskScore.score > 75) {
        report.risks.push(`High risk score: ${riskScore.score}`);
      }

      // 5. 检查代理/VPN特征
      const proxyCheck = await this.checkProxyVPNStatus(ip);
      report.details.proxyStatus = proxyCheck;
      if (proxyCheck.isProxy || proxyCheck.isVPN) {
        report.risks.push('Proxy/VPN characteristics detected');
      }

      // 生成建议
      report.recommendation = this.generateRecommendation(report);
      
      this.logger.info('IP quality check completed', {
        ip,
        score: report.score,
        risks: report.risks.length
      });

      return report;

    } catch (error) {
      this.logger.error('IP quality check failed', { ip, error: error.message });
      report.error = error.message;
      return report;
    }
  }

  /**
   * 获取IP基础信息
   */
  async getBasicIPInfo(ip) {
    try {
      // 构建请求配置，确保通过代理发送请求以防止DNS泄露
      const config = {
        timeout: 5000
      };
      
      // 如果有代理配置，添加到请求中
      if (this.proxyAgent) {
        config.httpsAgent = this.proxyAgent.https || this.proxyAgent;
        config.httpAgent = this.proxyAgent.http || this.proxyAgent;
      }
      
      const response = await axios.get(`https://ipinfo.io/${ip}/json`, config);
      
      return {
        ip: response.data.ip,
        hostname: response.data.hostname,
        org: response.data.org,
        country: response.data.country,
        region: response.data.region,
        city: response.data.city,
        loc: response.data.loc,
        timezone: response.data.timezone
      };
    } catch (error) {
      throw new Error(`Failed to get IP info: ${error.message}`);
    }
  }

  /**
   * 判断是否为住宅IP
   */
  async isResidentialIP(ipInfo) {
    const { org = '', hostname = '' } = ipInfo;
    
    // 数据中心关键词
    const datacenterKeywords = [
      'amazon', 'aws', 'google', 'cloud', 'azure', 'digital',
      'linode', 'vultr', 'ovh', 'hetzner', 'server', 'hosting',
      'datacenter', 'vps', 'dedicated'
    ];
    
    // ISP关键词（住宅网络提供商）
    const ispKeywords = [
      'comcast', 'verizon', 'at&t', 'spectrum', 'cox',
      'telecom', 'broadband', 'cable', 'dsl', 'fiber'
    ];
    
    const orgLower = org.toLowerCase();
    const hostLower = hostname.toLowerCase();
    
    // 检查是否包含数据中心关键词
    const isDatacenter = datacenterKeywords.some(keyword => 
      orgLower.includes(keyword) || hostLower.includes(keyword)
    );
    
    // 检查是否包含ISP关键词
    const isISP = ispKeywords.some(keyword => 
      orgLower.includes(keyword)
    );
    
    // 检查主机名模式
    const hasResidentialPattern = /^(cpe|dyn|pool|res|home|customer)/.test(hostLower);
    const hasDatacenterPattern = /^(vps|server|dedicated|cloud)/.test(hostLower);
    
    return !isDatacenter && (isISP || hasResidentialPattern) && !hasDatacenterPattern;
  }

  /**
   * 检查IP黑名单
   * TODO: 实现真实的黑名单检查API集成
   */
  async checkBlacklists(ip) {
    // TODO: 集成以下服务
    // - AbuseIPDB API: https://www.abuseipdb.com/api
    // - Spamhaus: https://www.spamhaus.org/
    // - Project Honey Pot: https://www.projecthoneypot.org/
    
    this.logger.warn('Blacklist check not implemented, returning mock data', { ip });
    
    return {
      isListed: false,
      lists: [],
      totalChecked: 0,
      status: 'NOT_IMPLEMENTED'
    };
  }

  /**
   * 检查IP风险评分
   * TODO: 集成专业的IP声誉服务
   */
  async checkIPRiskScore(ip) {
    // TODO: 集成以下服务之一
    // - IPQualityScore: https://www.ipqualityscore.com/
    // - MaxMind minFraud: https://www.maxmind.com/en/minfraud-services
    // - Cloudflare Radar: https://radar.cloudflare.com/
    
    this.logger.warn('IP risk score check not implemented', { ip });
    
    // 返回中性分数，避免误导
    return {
      score: 50,
      factors: {
        geoRisk: 'unknown',
        trafficPatterns: 'unknown',
        historicalAbuse: 'unknown',
        networkReputation: 'unknown'
      },
      rating: 'unknown',
      status: 'NOT_IMPLEMENTED'
    };
  }

  /**
   * 检查代理/VPN状态
   */
  async checkProxyVPNStatus(ip) {
    // 简化的代理检测逻辑
    // 实际应该使用专业的代理检测API
    
    return {
      isProxy: false,
      isVPN: false,
      isTor: false,
      isHosting: false,
      confidence: 0.85
    };
  }

  /**
   * 计算地理位置风险
   */
  calculateGeoRisk(ip) {
    // 高风险国家/地区列表（示例）
    const highRiskCountries = ['CN', 'RU', 'NG', 'VN'];
    // 这里应该根据实际IP的国家进行判断
    return Math.random() * 25;
  }

  /**
   * 获取风险等级
   */
  getRiskRating(score) {
    if (score < 25) return 'Very Low';
    if (score < 50) return 'Low';
    if (score < 75) return 'Medium';
    if (score < 90) return 'High';
    return 'Very High';
  }

  /**
   * 生成使用建议
   */
  generateRecommendation(report) {
    const { score, risks } = report;
    
    if (score >= 80) {
      return '✅ 优质IP，可以安全使用';
    } else if (score >= 60) {
      return '🟡 IP质量一般，建议谨慎使用并监控';
    } else if (score >= 40) {
      return '🟠 IP存在风险，建议更换更纯净的IP';
    } else {
      return '🔴 高风险IP，强烈建议立即更换';
    }
  }

  /**
   * 获取详细的IP报告
   */
  async getDetailedReport(ip) {
    const quality = await this.checkIPQuality(ip);
    
    return {
      summary: {
        ip,
        score: quality.score,
        maxScore: 100,
        rating: this.getRiskRating(100 - quality.score),
        recommendation: quality.recommendation
      },
      details: quality.details,
      risks: quality.risks,
      checks: {
        residential: quality.details.ipType === 'residential',
        blacklist: !quality.details.blacklist?.isListed,
        riskScore: quality.details.riskScore?.score < 25,
        proxy: !quality.details.proxyStatus?.isProxy,
        vpn: !quality.details.proxyStatus?.isVPN
      },
      metadata: {
        checkedAt: quality.timestamp,
        ttl: 3600 // 缓存1小时
      }
    };
  }
}

export default IPReputationChecker;