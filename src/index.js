#!/usr/bin/env node

/**
 * Claude 固定住宅 IP 代理服务
 * 基于 tech_local.md 方案实现
 * 
 * 核心功能：
 * - 固定住宅 IP 策略（24小时 Sticky Session）
 * - TLS 指纹伪装 + HTTP/2 支持
 * - 智能重试 + 断流自愈
 * - 零改动接入第三方 Claude Code 工具
 */

import express from 'express';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createInterface } from 'readline';

import ProxyManager from './managers/ProxyManager.js';
import SessionManager from './managers/SessionManager.js';
import SecurityManager from './managers/SecurityManager.js';
import NoiseManager from './managers/NoiseManager.js';
import BehaviorManager from './managers/BehaviorManager.js';
import Logger from './utils/logger.js';

// ES模块路径处理
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

// 加载环境变量
dotenv.config({ path: join(projectRoot, '.env') });

// 初始化组件
const logger = new Logger();
const app = express();
const server = createServer(app);

// 配置中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// 静态文件服务
app.use(express.static(join(projectRoot, 'public')));

// 全局变量
let proxyManager;
let sessionManager; 
let securityManager;
let noiseManager;
let behaviorManager;

/**
 * 启动横幅显示
 */
function displayStartupBanner() {
  const banner = `
╭─────────────────────────────────────────────────────────────╮
│  🏠 Claude 固定住宅 IP 代理服务                              │
│  基于 tech_local.md 方案 • 防风控优先                       │
│                                                             │
│  ✅ 固定 IP 策略 (24h Sticky Session)                      │
│  ✅ TLS 指纹伪装 + HTTP/2 支持                             │
│  ✅ 智能重试 + 断流自愈机制                                 │
│  ✅ 零改动接入 Claude Code 工具                             │
╰─────────────────────────────────────────────────────────────╯
`;
  
  console.log(banner);
}

/**
 * 加载配置文件
 */
function loadConfigurations() {
  try {
    const proxyConfigPath = join(projectRoot, 'config/proxy.json');
    const securityConfigPath = join(projectRoot, 'config/security.json');
    
    // 加载代理配置
    const proxyConfig = existsSync(proxyConfigPath)
      ? JSON.parse(readFileSync(proxyConfigPath, 'utf8'))
      : getDefaultProxyConfig();
    
    if (!existsSync(proxyConfigPath)) {
      logger.warn('代理配置文件不存在，使用默认配置');
    }
    
    // 加载安全配置
    const securityConfig = existsSync(securityConfigPath)
      ? JSON.parse(readFileSync(securityConfigPath, 'utf8'))
      : getDefaultSecurityConfig();
    
    if (!existsSync(securityConfigPath)) {
      logger.warn('安全配置文件不存在，使用默认配置');
    }
    
    // 验证配置格式
    validateProxyConfig(proxyConfig);
    
    return { proxyConfig, securityConfig };
  } catch (error) {
    logger.error('配置文件加载失败:', error.message);
    return { 
      proxyConfig: getDefaultProxyConfig(), 
      securityConfig: getDefaultSecurityConfig() 
    };
  }
}

/**
 * 验证代理配置格式
 */
function validateProxyConfig(config) {
  if (!config.providers || !Array.isArray(config.providers)) {
    throw new Error('配置格式错误: providers 必须是数组');
  }
  
  config.providers.forEach((provider, index) => {
    if (!provider.name || !provider.host || !provider.port) {
      throw new Error(`配置格式错误: provider[${index}] 缺少必要字段`);
    }
  });
}

/**
 * 获取默认代理配置
 */
function getDefaultProxyConfig() {
  return {
    providers: [],
    healthCheckInterval: 60000,
    sessionDuration: 86400000,
    maxRetries: 3,
    retryDelay: 1000
  };
}

/**
 * 获取默认安全配置
 */
function getDefaultSecurityConfig() {
  return {
    enableTLSFingerprinting: true,
    enableHTTP2: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive'
    },
    timing: {
      minDelay: 100,
      maxDelay: 500,
      requestInterval: 1000
    }
  };
}

/**
 * 初始化核心组件
 */
async function initializeComponents() {
  const { proxyConfig, securityConfig } = loadConfigurations();
  
  logger.info('🔧 初始化核心组件...');
  
  // 初始化管理器
  proxyManager = await ProxyManager.create(proxyConfig, logger);
  sessionManager = new SessionManager(proxyConfig, logger);
  securityManager = new SecurityManager(securityConfig, logger);
  behaviorManager = new BehaviorManager(logger);
  
  // 初始化噪音管理器并启动
  noiseManager = new NoiseManager(logger, proxyManager);
  noiseManager.start();
  
  logger.info('✅ 核心组件初始化完成');
}

/**
 * 授权验证中间件
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  req.authToken = authHeader.substring(7); // Remove 'Bearer ' prefix
  next();
};

/**
 * 会话管理中间件
 */
const sessionMiddleware = async (req, res, next) => {
  try {
    let session = sessionManager.getCurrentSession();
    if (!session) {
      session = await sessionManager.createSession();
      logger.info('创建新会话用于请求', { sessionId: session.id });
    }
    
    sessionManager.updateSessionActivity();
    req.session = session;
    next();
  } catch (error) {
    logger.error('会话管理失败', { error: error.message });
    res.status(500).json({ error: 'Session management failed' });
  }
};

/**
 * 设置路由
 */
function setupRoutes() {
  // 健康检查端点
  app.get('/health', async (req, res) => {
    const currentSession = sessionManager.getCurrentSession();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      session: currentSession ? {
        id: currentSession.id,
        timeRemaining: currentSession.endTime - Date.now(),
        ip: currentSession.ip
      } : null,
      proxy: {
        healthy: proxyManager.isHealthy,
        provider: proxyManager.getCurrentProvider()?.name
      }
    });
  });
  
  // 统计信息端点
  app.get('/stats', (req, res) => {
    res.json({
      proxy: proxyManager.getStats(),
      session: sessionManager.getStats(),
      security: securityManager.getStats(),
      behavior: behaviorManager.getStats(),
      uptime: process.uptime()
    });
  });
  
  // IP纯净度报告端点
  app.get('/ip-report', (req, res) => {
    const report = proxyManager.getIPReport();
    if (report) {
      res.json(report);
    } else {
      res.status(404).json({ error: 'No IP report available yet' });
    }
  });
  
  // 代理配置中间件 - 动态设置代理配置
  const proxyConfigMiddleware = async (req, res, next) => {
    try {
      const enhancedConfig = await proxyManager.getEnhancedProxyConfig();
      const agent = req.protocol === 'https:' ? enhancedConfig.agent.https : enhancedConfig.agent.http;
      
      // 存储配置供代理使用
      req.proxyConfig = {
        agent: agent,
        headers: enhancedConfig.headers,
        sessionBehavior: enhancedConfig.sessionBehavior
      };
      
      next();
    } catch (error) {
      logger.error('Failed to get proxy configuration', { error: error.message });
      res.status(500).json({ error: 'Proxy configuration failed' });
    }
  };

  // Claude API 代理
  const createClaudeProxy = () => {
    return async (req, res, next) => {
      const proxy = createProxyMiddleware({
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        secure: true,
        agent: req.proxyConfig?.agent || false,
        
        onProxyReq: async (proxyReq, req, res) => {
          try {
            // 记录请求到行为管理器
            behaviorManager.recordRequest();
            
            // 获取并应用行为延迟
            const delay = behaviorManager.getNextDelay();
            if (delay > 0) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            // 应用增强的安全头部
            if (req.proxyConfig?.headers) {
              Object.entries(req.proxyConfig.headers).forEach(([key, value]) => {
                if (value !== undefined) {
                  proxyReq.setHeader(key, value);
                }
              });
            }

            logger.info('代理请求到Claude API', {
              sessionId: req.session.id,
              method: proxyReq.method,
              path: proxyReq.path,
              sessionBehavior: req.proxyConfig?.sessionBehavior,
              behaviorState: behaviorManager.currentState,
              appliedDelay: delay,
              geoHeaders: {
                'Accept-Language': req.proxyConfig?.headers?.['Accept-Language'],
                'X-Timezone': req.proxyConfig?.headers?.['X-Timezone']
              }
            });

            // 记录请求（用于统计）
            proxyManager.recordRequest(true);

          } catch (error) {
            logger.error('代理请求处理失败', { error: error.message });
            proxyManager.recordRequest(false);
            res.status(500).json({ error: 'Proxy request failed' });
          }
        },

        onProxyRes: (proxyRes, req, res) => {
          const rl = createInterface({ input: proxyRes, crlfDelay: Infinity });

          proxyRes.on('data', (chunk) => {
            res.write(chunk);
          });

          proxyRes.on('end', () => {
            res.end();
          });

          rl.on('line', (line) => {
            // We are processing line by line, which is what we want.
            // The original implementation was processing chunk by chunk.
          });

          rl.on('error', (err) => {
            logger.error('代理响应流 readline 错误', { error: err.message });
            res.end();
          });
        },

        onError: (err, req, res) => {
          logger.error('代理错误', { error: err.message, code: err.code });
          
          if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            res.status(502).json({ error: 'Proxy connection failed' });
          } else if (err.code === 'ETIMEDOUT') {
            res.status(408).json({ error: 'Request timeout' });
          } else {
            res.status(500).json({ error: 'Internal proxy error' });
          }
        }
      });
      
      proxy(req, res, next);
    };
  };

  // 应用中间件链到 Claude API 路径
  app.use('/v1', authMiddleware, sessionMiddleware, proxyConfigMiddleware, createClaudeProxy());
  
  // 404处理
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`
    });
  });
}

/**
 * 设置优雅关闭
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    logger.info(`收到${signal}信号，开始优雅关闭...`);
    
    if (server) {
      server.close(() => {
        logger.info('HTTP服务器已关闭');
      });
    }
    
    // 关闭管理器
    if (sessionManager) {
      sessionManager.close();
    }
    
    if (proxyManager) {
      proxyManager.close();
    }
    
    if (noiseManager) {
      noiseManager.shutdown();
    }
    
    // 关闭日志系统
    if (logger) {
      logger.close();
    }
    
    setTimeout(() => {
      console.log('强制退出');
      process.exit(0);
    }, 5000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', { error: error.message, stack: error.stack });
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝，将关闭服务', { reason });
    shutdown('unhandledRejection');
  });
}

/**
 * 主函数
 */
async function main() {
  try {
    displayStartupBanner();
    
    // 初始化组件
    await initializeComponents();
    
    // 设置路由
    setupRoutes();
    
    // 设置优雅关闭
    setupGracefulShutdown();
    
    // 启动服务器
    const { proxyConfig } = loadConfigurations();
    const port = process.env.PORT || proxyConfig.server?.port || 8080;
    server.listen(port, () => {
      logger.info(`🎉 Claude 住宅代理服务器启动成功`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        endpoints: [
          `http://localhost:${port}/health`,
          `http://localhost:${port}/stats`,
          `http://localhost:${port}/v1/*`
        ]
      });
    });
    
    server.on('error', (error) => {
      logger.error('服务器错误', { error: error.message });
      if (error.code === 'EADDRINUSE') {
        logger.error(`端口 ${port} 已被占用`);
        process.exit(1);
      }
    });
    
  } catch (error) {
    logger.error('服务器启动失败', { error: error.message });
    process.exit(1);
  }
}

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default app; 