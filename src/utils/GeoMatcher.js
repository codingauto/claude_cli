/**
 * 地理位置匹配器 - 根据代理IP位置匹配相应的请求头
 */

export default class GeoMatcher {
  constructor(logger) {
    this.logger = logger;
    
    // 国家/地区配置映射
    this.geoConfigs = {
      // 日本
      'JP': {
        languages: ['ja-JP', 'ja', 'en-US', 'en'],
        timezones: ['Asia/Tokyo'],
        dateFormats: ['ja-JP', 'en-US'],
        currency: 'JPY',
        commonBrowsers: ['Chrome', 'Safari', 'Edge'],
        mobileCarriers: ['NTT DOCOMO', 'KDDI', 'SoftBank']
      },
      
      // 美国
      'US': {
        languages: ['en-US', 'en'],
        timezones: [
          'America/New_York',
          'America/Chicago',
          'America/Denver',
          'America/Los_Angeles',
          'America/Phoenix'
        ],
        dateFormats: ['en-US'],
        currency: 'USD',
        commonBrowsers: ['Chrome', 'Safari', 'Edge', 'Firefox'],
        mobileCarriers: ['Verizon', 'AT&T', 'T-Mobile', 'Sprint']
      },
      
      // 英国
      'GB': {
        languages: ['en-GB', 'en'],
        timezones: ['Europe/London'],
        dateFormats: ['en-GB'],
        currency: 'GBP',
        commonBrowsers: ['Chrome', 'Safari', 'Edge', 'Firefox'],
        mobileCarriers: ['EE', 'O2', 'Vodafone', 'Three']
      },
      
      // 德国
      'DE': {
        languages: ['de-DE', 'de', 'en'],
        timezones: ['Europe/Berlin'],
        dateFormats: ['de-DE', 'en-US'],
        currency: 'EUR',
        commonBrowsers: ['Chrome', 'Firefox', 'Edge'],
        mobileCarriers: ['Telekom', 'Vodafone', 'O2']
      },
      
      // 法国
      'FR': {
        languages: ['fr-FR', 'fr', 'en'],
        timezones: ['Europe/Paris'],
        dateFormats: ['fr-FR', 'en-US'],
        currency: 'EUR',
        commonBrowsers: ['Chrome', 'Firefox', 'Safari'],
        mobileCarriers: ['Orange', 'SFR', 'Bouygues', 'Free']
      },
      
      // 加拿大
      'CA': {
        languages: ['en-CA', 'fr-CA', 'en'],
        timezones: [
          'America/Toronto',
          'America/Vancouver',
          'America/Edmonton',
          'America/Winnipeg',
          'America/Halifax'
        ],
        dateFormats: ['en-CA', 'fr-CA'],
        currency: 'CAD',
        commonBrowsers: ['Chrome', 'Safari', 'Edge', 'Firefox'],
        mobileCarriers: ['Rogers', 'Bell', 'Telus']
      },
      
      // 澳大利亚
      'AU': {
        languages: ['en-AU', 'en'],
        timezones: [
          'Australia/Sydney',
          'Australia/Melbourne',
          'Australia/Brisbane',
          'Australia/Perth',
          'Australia/Adelaide'
        ],
        dateFormats: ['en-AU'],
        currency: 'AUD',
        commonBrowsers: ['Chrome', 'Safari', 'Edge'],
        mobileCarriers: ['Telstra', 'Optus', 'Vodafone']
      },
      
      // 默认配置（其他国家）
      'DEFAULT': {
        languages: ['en-US', 'en'],
        timezones: ['UTC'],
        dateFormats: ['en-US'],
        currency: 'USD',
        commonBrowsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
        mobileCarriers: []
      }
    };
    
    // 缓存当前配置
    this.currentConfig = null;
    this.currentCountry = null;
  }
  
  /**
   * 根据国家代码获取地理配置
   * @param {string} countryCode - ISO 国家代码
   * @returns {object} 地理配置
   */
  getGeoConfig(countryCode) {
    const upperCode = (countryCode || '').toUpperCase();
    const config = this.geoConfigs[upperCode] || this.geoConfigs.DEFAULT;
    
    // 如果国家改变了，记录日志
    if (upperCode !== this.currentCountry) {
      this.logger.info('地理位置配置已更新', {
        from: this.currentCountry,
        to: upperCode,
        hasCustomConfig: !!this.geoConfigs[upperCode]
      });
      this.currentCountry = upperCode;
      this.currentConfig = config;
    }
    
    return config;
  }
  
  /**
   * 生成匹配地理位置的请求头
   * @param {string} countryCode - ISO 国家代码
   * @param {object} existingHeaders - 现有的请求头
   * @returns {object} 更新后的请求头
   */
  generateGeoHeaders(countryCode, existingHeaders = {}) {
    const config = this.getGeoConfig(countryCode);
    const headers = { ...existingHeaders };
    
    // 生成 Accept-Language
    headers['Accept-Language'] = this.generateAcceptLanguage(config.languages);
    
    // 设置时区相关的头部（某些API可能会检查）
    const timezone = this.selectRandomItem(config.timezones);
    headers['X-Timezone'] = timezone;
    
    // 设置日期格式偏好（某些网站使用）
    headers['X-Date-Format'] = this.selectRandomItem(config.dateFormats);
    
    // 添加一些地理相关的自定义头部（模拟某些浏览器扩展）
    if (Math.random() < 0.3) { // 30%概率添加
      headers['X-Forwarded-For-Country'] = countryCode;
    }
    
    this.logger.debug('生成地理匹配头部', {
      country: countryCode,
      language: headers['Accept-Language'],
      timezone: timezone
    });
    
    return headers;
  }
  
  /**
   * 生成 Accept-Language 头部
   * @param {Array<string>} languages - 语言列表
   * @returns {string} Accept-Language 值
   */
  generateAcceptLanguage(languages) {
    if (!languages || languages.length === 0) {
      return 'en-US,en;q=0.9';
    }
    
    // 构建带权重的语言列表
    const weightedLangs = languages.map((lang, index) => {
      if (index === 0) {
        return lang; // 首选语言无权重
      }
      // 其他语言递减权重
      const weight = 1 - (index * 0.1);
      return `${lang};q=${weight.toFixed(1)}`;
    });
    
    return weightedLangs.join(',');
  }
  
  /**
   * 根据国家获取合适的User-Agent中的语言部分
   * @param {string} countryCode - ISO 国家代码
   * @param {string} currentUA - 当前User-Agent
   * @returns {string} 更新后的User-Agent
   */
  adjustUserAgentForGeo(countryCode, currentUA) {
    const config = this.getGeoConfig(countryCode);
    
    // 某些国家的特定浏览器版本调整
    if (countryCode === 'JP' && currentUA.includes('Chrome')) {
      // 日本市场 Chrome 通常有特定的版本分布
      return currentUA;
    } else if (countryCode === 'CN' && currentUA.includes('Chrome')) {
      // 中国可能使用定制版Chrome
      return currentUA.replace('Chrome/', 'Chrome/').replace('Safari/', 'Safari/');
    }
    
    return currentUA;
  }
  
  /**
   * 获取地理位置的时间信息
   * @param {string} countryCode - ISO 国家代码
   * @returns {object} 时间信息
   */
  getGeoTimeInfo(countryCode) {
    const config = this.getGeoConfig(countryCode);
    const timezone = this.selectRandomItem(config.timezones);
    
    // 获取该时区的当前时间
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: countryCode === 'US', // 美国使用12小时制
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    return {
      timezone,
      localTime: formatter.format(now),
      offset: this.getTimezoneOffset(timezone),
      isDST: this.isDaylightSavingTime(timezone)
    };
  }
  
  /**
   * 获取时区偏移
   * @param {string} timezone - 时区
   * @returns {string} 偏移字符串
   */
  getTimezoneOffset(timezone) {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset'
      });
      const parts = formatter.formatToParts(now);
      const offset = parts.find(part => part.type === 'timeZoneName');
      return offset ? offset.value : '+00:00';
    } catch (e) {
      return '+00:00';
    }
  }
  
  /**
   * 检查是否是夏令时
   * @param {string} timezone - 时区
   * @returns {boolean}
   */
  isDaylightSavingTime(timezone) {
    const now = new Date();
    const january = new Date(now.getFullYear(), 0, 1);
    const july = new Date(now.getFullYear(), 6, 1);
    
    const getOffset = (date) => {
      return new Date(
        date.toLocaleString('en-US', { timeZone: timezone })
      ).getTimezoneOffset();
    };
    
    return getOffset(january) !== getOffset(july);
  }
  
  /**
   * 随机选择数组中的一个元素
   * @param {Array} array - 数组
   * @returns {*} 随机元素
   */
  selectRandomItem(array) {
    if (!array || array.length === 0) {
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }
  
  /**
   * 获取完整的地理匹配配置
   * @param {string} countryCode - ISO 国家代码
   * @returns {object} 完整配置
   */
  getFullGeoProfile(countryCode) {
    const config = this.getGeoConfig(countryCode);
    const timeInfo = this.getGeoTimeInfo(countryCode);
    
    return {
      country: countryCode,
      languages: config.languages,
      timezone: timeInfo.timezone,
      localTime: timeInfo.localTime,
      offset: timeInfo.offset,
      currency: config.currency,
      dateFormat: this.selectRandomItem(config.dateFormats),
      commonBrowser: this.selectRandomItem(config.commonBrowsers)
    };
  }
}