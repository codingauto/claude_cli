/**
 * 高级指纹系统使用示例
 * 展示如何使用改进后的TLS和设备指纹系统
 */

import IntegratedFingerprintManager from '../src/managers/IntegratedFingerprintManager.js';
import AntiDetectionStrategy from '../src/utils/AntiDetectionStrategy.js';
import https from 'https';
import http from 'http';

class AdvancedFingerprintExample {
  constructor() {
    this.fingerprintManager = new IntegratedFingerprintManager();
    this.antiDetection = new AntiDetectionStrategy();
    this.activeSessions = new Map();
  }

  /**
   * 示例1: 创建基础会话
   */
  async example1_BasicSession() {
    console.log('\n=== 示例1: 创建基础会话 ===');
    
    // 创建协调的指纹会话
    const sessionId = 'basic-session-example';
    const sessionConfig = this.fingerprintManager.createCoordinatedSession(sessionId);
    
    console.log('会话配置创建成功:');
    console.log(`- 会话ID: ${sessionConfig.sessionId}`);
    console.log(`- TLS配置文件: ${sessionConfig.tlsProfile.key}`);
    console.log(`- 设备配置文件: ${sessionConfig.deviceProfile.key}`);
    console.log(`- JA4指纹: ${sessionConfig.tlsProfile.ja4?.ja4}`);
    console.log(`- 设备ID: ${sessionConfig.deviceProfile.fingerprint.deviceId}`);
    
    // 生成HTTP请求头
    const headers = this.fingerprintManager.generateCoordinatedHeaders(sessionId, 'example.com');
    console.log('\n生成的HTTP头部:');
    Object.entries(headers.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    return sessionConfig;
  }

  /**
   * 示例2: 使用特定浏览器配置文件
   */
  async example2_SpecificBrowserProfile() {
    console.log('\n=== 示例2: 使用特定浏览器配置文件 ===');
    
    // 创建Chrome Windows会话
    const chromeSession = this.fingerprintManager.createCoordinatedSession(
      'chrome-session',
      { tlsProfile: 'chrome-131-windows' }
    );
    
    console.log('Chrome会话创建:');
    console.log(`- JA4: ${chromeSession.tlsProfile.ja4?.ja4}`);
    console.log(`- User-Agent: ${chromeSession.deviceProfile.config.userAgent}`);
    
    // 创建Firefox会话
    const firefoxSession = this.fingerprintManager.createCoordinatedSession(
      'firefox-session',
      { tlsProfile: 'firefox-133-windows' }
    );
    
    console.log('\nFirefox会话创建:');
    console.log(`- JA4: ${firefoxSession.tlsProfile.ja4?.ja4}`);
    console.log(`- User-Agent: ${firefoxSession.deviceProfile.config.userAgent}`);
    
    // 比较不同配置文件的差异
    console.log('\n配置文件差异对比:');
    console.log(`- Chrome密码套件数量: ${chromeSession.tlsProfile.config.cipherSuites.length}`);
    console.log(`- Firefox密码套件数量: ${firefoxSession.tlsProfile.config.cipherSuites.length}`);
    
    return { chromeSession, firefoxSession };
  }

  /**
   * 示例3: 启用反检测策略
   */
  async example3_AntiDetectionStrategy() {
    console.log('\n=== 示例3: 启用反检测策略 ===');
    
    // 创建会话
    const sessionId = 'stealth-session';
    const sessionConfig = this.fingerprintManager.createCoordinatedSession(sessionId);
    
    // 启用隐身模式反检测策略
    const strategy = this.antiDetection.activateStrategy(sessionId, 'stealth');
    
    console.log('隐身模式策略激活:');
    console.log(`- 配置文件: ${strategy.profile}`);
    console.log(`- 激活技术数量: ${strategy.activeTechniques.length}`);
    console.log('- 激活的技术:');
    strategy.activeTechniques.forEach(tech => {
      console.log(`  * ${tech.type} (${tech.method || tech.level || tech.complexity})`);
    });
    
    // 模拟多次请求，展示时序变化
    console.log('\n时序噪声示例:');
    for (let i = 0; i < 5; i++) {
      const delay = this.antiDetection.implementTemporalNoise(strategy);
      console.log(`  请求 ${i + 1}: ${Math.round(delay)}ms 延迟`);
    }
    
    // 展示人类时序模拟
    const humanTiming = this.antiDetection.implementHumanTiming(strategy);
    console.log('\n人类时序模拟:');
    console.log(`- 思考时间: ${Math.round(humanTiming.thinkTime)}ms`);
    console.log(`- 打字延迟: ${Math.round(humanTiming.typingDelay)}ms/字符`);
    console.log(`- 鼠标延迟: ${Math.round(humanTiming.mouseDelay)}ms`);
    console.log(`- 阅读时间: ${Math.round(humanTiming.readingTime)}ms`);
    
    return { sessionConfig, strategy };
  }

  /**
   * 示例4: 实际HTTP请求
   */
  async example4_RealHttpRequest() {
    console.log('\n=== 示例4: 实际HTTP请求 ===');
    
    const sessionId = 'real-request-session';
    const sessionConfig = this.fingerprintManager.createCoordinatedSession(sessionId);
    const strategy = this.antiDetection.activateStrategy(sessionId, 'balanced');
    
    // 生成TLS配置
    const tlsConfig = this.fingerprintManager.generateNodeTLSConfig(sessionId);
    
    // 生成请求头
    const headers = this.fingerprintManager.generateCoordinatedHeaders(sessionId, 'httpbin.org');
    
    console.log('准备发送请求:');
    console.log(`- 目标: httpbin.org`);
    console.log(`- TLS密码套件: ${tlsConfig.ciphers.substring(0, 100)}...`);
    console.log(`- JA4指纹: ${sessionConfig.tlsProfile.ja4?.ja4}`);
    
    return new Promise((resolve, reject) => {
      // 添加时序延迟
      const delay = this.antiDetection.implementTemporalNoise(strategy);
      
      setTimeout(() => {
        const options = {
          hostname: 'httpbin.org',
          port: 443,
          path: '/headers',
          method: 'GET',
          headers: headers.headers,
          // 应用TLS配置
          ...tlsConfig
        };

        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              console.log('\n请求成功完成:');
              console.log(`- 状态码: ${res.statusCode}`);
              console.log(`- 服务器看到的User-Agent: ${response.headers['User-Agent']}`);
              console.log(`- TLS版本: ${res.socket.getProtocol?.() || 'N/A'}`);
              console.log(`- 使用的密码套件: ${res.socket.getCipher?.()?.name || 'N/A'}`);
              
              resolve({
                statusCode: res.statusCode,
                headers: response.headers,
                tlsInfo: {
                  protocol: res.socket.getProtocol?.(),
                  cipher: res.socket.getCipher?.()
                }
              });
            } catch (error) {
              console.log('\n请求完成，但响应解析失败:', error.message);
              resolve({ statusCode: res.statusCode, rawData: data });
            }
          });
        });

        req.on('error', (error) => {
          console.error('请求失败:', error.message);
          reject(error);
        });

        req.end();
      }, delay);
    });
  }

  /**
   * 示例5: 会话管理和轮换
   */
  async example5_SessionManagement() {
    console.log('\n=== 示例5: 会话管理和轮换 ===');
    
    // 创建多个会话
    const sessions = [];
    for (let i = 0; i < 3; i++) {
      const sessionId = `managed-session-${i}`;
      const sessionConfig = this.fingerprintManager.createCoordinatedSession(sessionId);
      this.antiDetection.activateStrategy(sessionId, 'balanced');
      sessions.push(sessionConfig);
    }
    
    console.log(`创建了 ${sessions.length} 个会话`);
    
    // 显示会话统计
    const stats = this.fingerprintManager.getSessionStats();
    console.log('\n会话统计:');
    console.log(`- 总会话数: ${stats.totalSessions}`);
    console.log(`- 配置文件分布:`, stats.profileDistribution);
    console.log(`- 一致性状态: ${stats.consistencyStatus.valid} 有效, ${stats.consistencyStatus.invalid} 无效`);
    
    // 显示反检测策略统计
    const globalStats = this.antiDetection.getGlobalStats();
    console.log('\n反检测策略统计:');
    console.log(`- 活跃会话: ${globalStats.activeSessions}`);
    console.log(`- 配置文件分布:`, globalStats.profileDistribution);
    console.log(`- 平均有效性: ${(globalStats.averageEffectiveness * 100).toFixed(1)}%`);
    
    // 模拟指纹轮换
    console.log('\n模拟指纹轮换:');
    for (const session of sessions) {
      const strategy = this.antiDetection.activeStrategies.get(session.sessionId);
      if (strategy) {
        const rotationResult = this.antiDetection.executeRotation(strategy, 'manual-test');
        console.log(`- 会话 ${session.sessionId}: 轮换${rotationResult ? '成功' : '失败'}`);
      }
    }
    
    return { sessions, stats, globalStats };
  }

  /**
   * 示例6: 错误处理和恢复
   */
  async example6_ErrorHandling() {
    console.log('\n=== 示例6: 错误处理和恢复 ===');
    
    try {
      // 尝试使用不存在的配置文件
      console.log('测试无效配置文件处理...');
      const sessionConfig = this.fingerprintManager.createCoordinatedSession(
        'error-test-session',
        { tlsProfile: 'non-existent-profile' }
      );
      console.log('意外：应该抛出错误但没有');
    } catch (error) {
      console.log('✓ 正确处理了无效配置文件错误');
    }
    
    try {
      // 尝试访问不存在的会话
      console.log('测试无效会话ID处理...');
      const headers = this.fingerprintManager.generateCoordinatedHeaders('non-existent-session', 'example.com');
      console.log('意外：应该抛出错误但没有');
    } catch (error) {
      console.log('✓ 正确处理了无效会话ID错误');
    }
    
    // 测试会话一致性验证
    console.log('测试会话一致性验证...');
    const sessionConfig = this.fingerprintManager.createCoordinatedSession('consistency-test');
    const validation = this.fingerprintManager.validateSessionConsistency('consistency-test');
    
    if (validation.valid) {
      console.log('✓ 会话一致性验证通过');
      console.log(`  - TLS一致性: ${validation.details.tls}`);
      console.log(`  - 设备一致性: ${validation.details.device}`);
      console.log(`  - 时序一致性: ${validation.details.timing}`);
    } else {
      console.log('✗ 会话一致性验证失败');
    }
    
    // 测试清理过期会话
    console.log('测试清理过期会话...');
    const cleanedCount = this.fingerprintManager.cleanupExpiredSessions();
    console.log(`✓ 清理了 ${cleanedCount} 个过期会话`);
  }

  /**
   * 示例7: 性能测试
   */
  async example7_PerformanceTest() {
    console.log('\n=== 示例7: 性能测试 ===');
    
    const sessionCount = 20;
    const startTime = Date.now();
    
    console.log(`创建 ${sessionCount} 个并发会话...`);
    
    const promises = [];
    for (let i = 0; i < sessionCount; i++) {
      const promise = Promise.resolve().then(() => {
        const sessionId = `perf-test-${i}`;
        const sessionConfig = this.fingerprintManager.createCoordinatedSession(sessionId);
        this.antiDetection.activateStrategy(sessionId, 'balanced');
        return this.fingerprintManager.generateCoordinatedHeaders(sessionId, 'example.com');
      });
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✓ 性能测试完成:`);
    console.log(`  - 会话数量: ${results.length}`);
    console.log(`  - 总耗时: ${duration}ms`);
    console.log(`  - 平均每会话: ${(duration / sessionCount).toFixed(2)}ms`);
    console.log(`  - 吞吐量: ${(sessionCount / duration * 1000).toFixed(2)} 会话/秒`);
    
    // 验证所有结果的质量
    let validResults = 0;
    results.forEach(result => {
      if (result.headers['User-Agent'] && result.ja4h && result.consistency.tlsMatch) {
        validResults++;
      }
    });
    
    console.log(`  - 有效结果: ${validResults}/${results.length} (${(validResults/results.length*100).toFixed(1)}%)`);
    
    return { sessionCount, duration, validResults };
  }

  /**
   * 运行所有示例
   */
  async runAllExamples() {
    console.log('🚀 启动高级指纹系统示例...\n');
    
    try {
      await this.example1_BasicSession();
      await this.example2_SpecificBrowserProfile();
      await this.example3_AntiDetectionStrategy();
      
      // 注意：示例4需要网络连接
      try {
        await this.example4_RealHttpRequest();
      } catch (error) {
        console.log('\n⚠️  示例4跳过（网络连接问题）:', error.message);
      }
      
      await this.example5_SessionManagement();
      await this.example6_ErrorHandling();
      await this.example7_PerformanceTest();
      
      console.log('\n✅ 所有示例运行完成！');
      
      // 显示最终统计
      const finalStats = this.fingerprintManager.getSessionStats();
      const finalAntiStats = this.antiDetection.getGlobalStats();
      
      console.log('\n📊 最终统计:');
      console.log(`- 总会话数: ${finalStats.totalSessions}`);
      console.log(`- 活跃反检测策略: ${finalAntiStats.activeSessions}`);
      console.log(`- 平均策略有效性: ${(finalAntiStats.averageEffectiveness * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ 示例运行失败:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    console.log('\n🧹 清理资源...');
    this.fingerprintManager.sessionProfiles.clear();
    this.antiDetection.activeStrategies.clear();
    console.log('✓ 清理完成');
  }
}

// 主执行函数
async function main() {
  const example = new AdvancedFingerprintExample();
  
  try {
    await example.runAllExamples();
  } catch (error) {
    console.error('程序执行失败:', error);
    process.exit(1);
  } finally {
    example.cleanup();
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AdvancedFingerprintExample;