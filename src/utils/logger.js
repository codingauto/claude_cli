/**
 * 日志系统 - 支持多级别、结构化输出、文件轮转
 * 基于 winston 实现企业级日志管理
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(dirname(__dirname));

class Logger {
  constructor(options = {}) {
    this.options = {
      level: process.env.LOG_LEVEL || 'info',
      logFile: process.env.LOG_FILE || './logs/proxy.log',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableFile: process.env.ENABLE_FILE_LOGGING !== 'false',
      enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
      maxFiles: '14d',
      maxSize: '20m',
      ...options
    };

    this.setupLogDirectory();
    this.createLogger();
  }

  /**
   * 创建日志目录
   */
  setupLogDirectory() {
    const logDir = dirname(join(projectRoot, this.options.logFile));
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 创建 Winston Logger 实例
   */
  createLogger() {
    const transports = [];

    // 控制台输出 (开发环境)
    if (this.options.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? 
                ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
          )
        })
      );
    }

    // 文件输出 (生产环境)
    if (this.options.enableFile) {
      // 普通日志文件
      transports.push(
        new DailyRotateFile({
          filename: join(projectRoot, this.options.logFile.replace('.log', '-%DATE%.log')),
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.options.maxFiles,
          maxSize: this.options.maxSize,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      // 错误日志文件
      transports.push(
        new DailyRotateFile({
          filename: join(projectRoot, this.options.logFile.replace('.log', '-error-%DATE%.log')),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: this.options.maxFiles,
          maxSize: this.options.maxSize,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }

    this.logger = winston.createLogger({
      level: this.options.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exitOnError: false
    });

    // 处理未捕获的异常
    this.logger.exceptions.handle(
      new winston.transports.File({ 
        filename: join(projectRoot, 'logs/exceptions.log') 
      })
    );

    // 处理未处理的 Promise 拒绝
    this.logger.rejections.handle(
      new winston.transports.File({ 
        filename: join(projectRoot, 'logs/rejections.log') 
      })
    );
  }

  /**
   * 记录信息级别日志
   */
  info(message, meta = {}) {
    this.logger.info(message, this.sanitizeMeta(meta));
  }

  /**
   * 记录警告级别日志
   */
  warn(message, meta = {}) {
    this.logger.warn(message, this.sanitizeMeta(meta));
  }

  /**
   * 记录错误级别日志
   */
  error(message, meta = {}) {
    this.logger.error(message, this.sanitizeMeta(meta));
  }

  /**
   * 记录调试级别日志
   */
  debug(message, meta = {}) {
    this.logger.debug(message, this.sanitizeMeta(meta));
  }

  /**
   * 记录详细级别日志
   */
  verbose(message, meta = {}) {
    this.logger.verbose(message, this.sanitizeMeta(meta));
  }

  /**
   * 记录请求日志
   */
  request(requestId, method, url, status, duration, meta = {}) {
    if (!this.options.enableRequestLogging) return;

    this.info('HTTP Request', {
      type: 'request',
      requestId,
      method,
      url,
      status,
      duration,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * 记录代理日志
   */
  proxy(sessionId, provider, action, meta = {}) {
    this.info('Proxy Action', {
      type: 'proxy',
      sessionId,
      provider,
      action,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * 记录安全日志
   */
  security(action, result, meta = {}) {
    this.info('Security Action', {
      type: 'security',
      action,
      result,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * 记录性能日志
   */
  performance(metric, value, unit = 'ms', meta = {}) {
    this.info('Performance Metric', {
      type: 'performance',
      metric,
      value,
      unit,
      ...this.sanitizeMeta(meta)
    });
  }

  /**
   * 清理敏感信息
   */
  sanitizeMeta(meta) {
    if (!meta || typeof meta !== 'object') return meta;

    const sanitized = { ...meta };
    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'authorization',
      'cookie', 'session', 'credential', 'apikey'
    ];

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (sensitiveKeys.some(sensitive => 
          key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]';
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * 创建子日志器
   */
  child(defaultMeta = {}) {
    return {
      info: (message, meta = {}) => this.info(message, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...defaultMeta, ...meta }),
      error: (message, meta = {}) => this.error(message, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...defaultMeta, ...meta }),
      verbose: (message, meta = {}) => this.verbose(message, { ...defaultMeta, ...meta }),
      request: (requestId, method, url, status, duration, meta = {}) => 
        this.request(requestId, method, url, status, duration, { ...defaultMeta, ...meta }),
      proxy: (sessionId, provider, action, meta = {}) => 
        this.proxy(sessionId, provider, action, { ...defaultMeta, ...meta }),
      security: (action, result, meta = {}) => 
        this.security(action, result, { ...defaultMeta, ...meta }),
      performance: (metric, value, unit, meta = {}) => 
        this.performance(metric, value, unit, { ...defaultMeta, ...meta })
    };
  }

  /**
   * 获取日志级别
   */
  getLevel() {
    return this.logger.level;
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    this.logger.level = level;
  }

  /**
   * 关闭日志器
   */
  close() {
    this.logger.close();
  }
}

export default Logger; 