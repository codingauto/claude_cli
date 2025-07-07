/**
 * EnhancedSecurity 单元测试
 * 测试浏览器指纹一致性和地理位置匹配
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import EnhancedSecurity from '../../src/utils/EnhancedSecurity.js';

describe('EnhancedSecurity 单元测试', () => {
  let enhancedSecurity;

  beforeEach(() => {
    enhancedSecurity = new EnhancedSecurity();
  });

  test('应该正确初始化', () => {
    assert.ok(enhancedSecurity);
    assert.ok(enhancedSecurity.browserProfiles);
    assert.ok(enhancedSecurity.browserProfiles.length > 0);
    assert.ok(enhancedSecurity.tlsProfiles);
  });

  test('selectBrowserProfile 应该选择并保持浏览器配置', () => {
    // 选择配置文件
    const profile1 = enhancedSecurity.selectBrowserProfile();
    assert.ok(profile1);
    assert.ok(profile1.userAgent);
    assert.ok(profile1.platform);
    assert.ok(profile1.vendor);
    
    // 获取当前配置应该返回相同的配置
    const currentProfile = enhancedSecurity.getCurrentBrowserProfile();
    assert.strictEqual(currentProfile, profile1);
    
    // 多次调用 getCurrentBrowserProfile 应该返回相同配置
    for (let i = 0; i < 5; i++) {
      const sameProfile = enhancedSecurity.getCurrentBrowserProfile();
      assert.strictEqual(sameProfile.userAgent, profile1.userAgent);
      assert.strictEqual(sameProfile.platform, profile1.platform);
    }
  });

  test('generateHeaders 应该生成一致的请求头', () => {
    // 先选择一个浏览器配置
    enhancedSecurity.selectBrowserProfile();
    
    // 生成美国地区的请求头
    const headers1 = enhancedSecurity.generateHeaders('US');
    assert.ok(headers1);
    assert.ok(headers1['User-Agent']);
    assert.ok(headers1['Accept-Language']);
    assert.ok(headers1['Sec-CH-UA']);
    assert.ok(headers1['Sec-CH-UA-Platform']);
    
    // 验证语言设置符合美国
    assert.ok(headers1['Accept-Language'].includes('en-US'));
    
    // 多次生成应该保持一致的 User-Agent
    const headers2 = enhancedSecurity.generateHeaders('US');
    assert.strictEqual(headers2['User-Agent'], headers1['User-Agent']);
    assert.strictEqual(headers2['Sec-CH-UA'], headers1['Sec-CH-UA']);
    assert.strictEqual(headers2['Sec-CH-UA-Platform'], headers1['Sec-CH-UA-Platform']);
  });

  test('generateHeaders 应该根据不同国家生成对应的语言头', () => {
    enhancedSecurity.selectBrowserProfile();
    
    // 测试不同国家的语言设置
    const usHeaders = enhancedSecurity.generateHeaders('US');
    assert.ok(usHeaders['Accept-Language'].includes('en-US'));
    
    const jpHeaders = enhancedSecurity.generateHeaders('JP');
    assert.ok(jpHeaders['Accept-Language'].includes('ja-JP'));
    
    const deHeaders = enhancedSecurity.generateHeaders('DE');
    assert.ok(deHeaders['Accept-Language'].includes('de'));
    
    // 但 User-Agent 应该保持一致
    assert.strictEqual(jpHeaders['User-Agent'], usHeaders['User-Agent']);
    assert.strictEqual(deHeaders['User-Agent'], usHeaders['User-Agent']);
  });

  test('平台信息应该与 User-Agent 保持一致', () => {
    // 测试多个浏览器配置
    for (let i = 0; i < 5; i++) {
      enhancedSecurity.selectBrowserProfile();
      const headers = enhancedSecurity.generateHeaders('US');
      
      const userAgent = headers['User-Agent'];
      const platform = headers['Sec-CH-UA-Platform'];
      
      // 检查平台一致性
      if (userAgent.includes('Windows NT')) {
        assert.strictEqual(platform, '"Windows"', 'Windows UA 应该有 Windows 平台');
      } else if (userAgent.includes('Macintosh')) {
        assert.strictEqual(platform, '"macOS"', 'Mac UA 应该有 macOS 平台');
      } else if (userAgent.includes('X11; Linux')) {
        assert.strictEqual(platform, '"Linux"', 'Linux UA 应该有 Linux 平台');
      }
    }
  });

  test('getTimezone 应该返回对应国家的时区', () => {
    const usTimezone = enhancedSecurity.getTimezone('US');
    assert.ok(['America/New_York', 'America/Chicago', 'America/Los_Angeles'].includes(usTimezone));
    
    const jpTimezone = enhancedSecurity.getTimezone('JP');
    assert.strictEqual(jpTimezone, 'Asia/Tokyo');
    
    const ukTimezone = enhancedSecurity.getTimezone('GB');
    assert.strictEqual(ukTimezone, 'Europe/London');
    
    // 未知国家应该返回默认时区
    const unknownTimezone = enhancedSecurity.getTimezone('XX');
    assert.strictEqual(unknownTimezone, 'America/New_York');
  });

  test('getLanguage 应该返回对应国家的语言设置', () => {
    const usLang = enhancedSecurity.getLanguage('US');
    assert.strictEqual(usLang, 'en-US,en;q=0.9');
    
    const jpLang = enhancedSecurity.getLanguage('JP');
    assert.strictEqual(jpLang, 'ja-JP,ja;q=0.9,en;q=0.8');
    
    const frLang = enhancedSecurity.getLanguage('FR');
    assert.strictEqual(frLang, 'fr-FR,fr;q=0.9,en;q=0.8');
    
    // 未知国家应该返回默认语言
    const unknownLang = enhancedSecurity.getLanguage('XX');
    assert.strictEqual(unknownLang, 'en-US,en;q=0.9');
  });

  test('getTLSConfig 应该返回有效的 TLS 配置', () => {
    const tlsConfig = enhancedSecurity.getTLSConfig();
    assert.ok(tlsConfig);
    assert.ok(tlsConfig.ciphers);
    assert.ok(tlsConfig.ALPNProtocols);
    assert.ok(Array.isArray(tlsConfig.ALPNProtocols));
    assert.ok(tlsConfig.ALPNProtocols.includes('h2'));
  });

  test('getRequestInterval 应该返回合理的请求间隔', () => {
    // 测试多次调用，确保返回合理范围
    for (let i = 0; i < 10; i++) {
      const interval = enhancedSecurity.getRequestInterval();
      assert.ok(interval >= 1000, '间隔应该至少 1 秒');
      assert.ok(interval <= 5000, '间隔不应超过 5 秒');
    }
  });

  test('addHumanDelay 应该添加人类行为延迟', async () => {
    const start = Date.now();
    await enhancedSecurity.addHumanDelay();
    const duration = Date.now() - start;
    
    // 延迟应该在 50-300ms 之间
    assert.ok(duration >= 50, '延迟应该至少 50ms');
    assert.ok(duration <= 350, '延迟不应超过 350ms（包含执行时间）');
  });

  test('simulateSession 应该生成会话行为信息', () => {
    enhancedSecurity.selectBrowserProfile();
    const sessionBehavior = enhancedSecurity.simulateSession();
    
    assert.ok(sessionBehavior);
    assert.ok(sessionBehavior.startTime);
    assert.ok(sessionBehavior.profileName);
    assert.ok(sessionBehavior.consistency);
    assert.strictEqual(sessionBehavior.consistency.platformMatch, true);
  });

  test('generateAcceptHeader 应该生成合适的 Accept 头', () => {
    const accept = enhancedSecurity.generateAcceptHeader();
    assert.ok(accept);
    assert.ok(accept.includes('text/html'));
    assert.ok(accept.includes('application/xhtml+xml'));
  });

  test('generateCacheHeaders 应该生成缓存控制头', () => {
    const cacheHeaders = enhancedSecurity.generateCacheHeaders();
    assert.ok(cacheHeaders);
    assert.ok(cacheHeaders['Cache-Control']);
    assert.ok(cacheHeaders['Pragma']);
    
    // 应该包含合理的缓存策略
    const cacheControl = cacheHeaders['Cache-Control'];
    assert.ok(
      cacheControl === 'no-cache' || 
      cacheControl === 'max-age=0' || 
      cacheControl === 'no-store',
      '应该是有效的缓存策略'
    );
  });

  test('generateSecurityHeaders 应该生成安全相关头部', () => {
    const secHeaders = enhancedSecurity.generateSecurityHeaders();
    assert.ok(secHeaders);
    assert.ok(secHeaders['DNT']);
    assert.ok(secHeaders['Sec-Fetch-Site']);
    assert.ok(secHeaders['Sec-Fetch-Mode']);
    assert.ok(secHeaders['Sec-Fetch-Dest']);
    
    // 验证值的合理性
    assert.strictEqual(secHeaders['DNT'], '1');
    assert.ok(['none', 'same-origin', 'cross-site'].includes(secHeaders['Sec-Fetch-Site']));
  });

  test('浏览器配置应该包含所有必要字段', () => {
    const profiles = enhancedSecurity.browserProfiles;
    
    for (const profile of profiles) {
      assert.ok(profile.name, '配置应该有名称');
      assert.ok(profile.userAgent, '配置应该有 User-Agent');
      assert.ok(profile.platform, '配置应该有平台信息');
      assert.ok(profile.vendor, '配置应该有供应商信息');
      assert.ok(profile.secChUa, '配置应该有 Sec-CH-UA');
      assert.ok(profile.secChUaPlatform, '配置应该有 Sec-CH-UA-Platform');
      
      // 验证版本号格式
      if (profile.name.includes('Chrome')) {
        assert.ok(profile.version.match(/^\d+$/), 'Chrome 版本应该是数字');
      }
    }
  });

  test('不同会话应该可以有不同的浏览器配置', () => {
    // 创建两个实例模拟不同会话
    const session1 = new EnhancedSecurity();
    const session2 = new EnhancedSecurity();
    
    // 多次尝试，确保能获得不同的配置
    let foundDifferent = false;
    for (let i = 0; i < 10; i++) {
      session1.selectBrowserProfile();
      session2.selectBrowserProfile();
      
      if (session1.getCurrentBrowserProfile().userAgent !== 
          session2.getCurrentBrowserProfile().userAgent) {
        foundDifferent = true;
        break;
      }
    }
    
    assert.ok(foundDifferent, '应该能够选择不同的浏览器配置');
  });
});

describe('EnhancedSecurity 边界情况测试', () => {
  let enhancedSecurity;

  beforeEach(() => {
    enhancedSecurity = new EnhancedSecurity();
  });

  test('应该处理无效的国家代码', () => {
    enhancedSecurity.selectBrowserProfile();
    
    // 无效国家代码应该使用默认值
    const headers = enhancedSecurity.generateHeaders('INVALID');
    assert.ok(headers);
    assert.ok(headers['Accept-Language'].includes('en-US')); // 默认语言
  });

  test('应该处理空的国家代码', () => {
    enhancedSecurity.selectBrowserProfile();
    
    const headers1 = enhancedSecurity.generateHeaders('');
    assert.ok(headers1);
    assert.ok(headers1['Accept-Language'].includes('en-US'));
    
    const headers2 = enhancedSecurity.generateHeaders(null);
    assert.ok(headers2);
    assert.ok(headers2['Accept-Language'].includes('en-US'));
  });

  test('getCurrentBrowserProfile 在未选择配置时应该自动选择', () => {
    // 不调用 selectBrowserProfile，直接获取
    const profile = enhancedSecurity.getCurrentBrowserProfile();
    assert.ok(profile);
    assert.ok(profile.userAgent);
    
    // 再次调用应该返回相同配置
    const profile2 = enhancedSecurity.getCurrentBrowserProfile();
    assert.strictEqual(profile2.userAgent, profile.userAgent);
  });
});