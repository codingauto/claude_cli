/**
 * Claude Residential Proxy SDK
 * 借鉴官方Claude Code SDK的设计模式
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

export class ProxyError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'ProxyError';
        this.code = code;
    }
}

export class AbortError extends Error {
    constructor(message = 'Operation aborted') {
        super(message);
        this.name = 'AbortError';
    }
}

/**
 * 代理服务配置选项
 */
export const ProxyOptions = {
    /**
     * 启动代理服务
     * @param {Object} options 配置选项
     * @param {AbortController} options.abortController 中止控制器
     * @param {number} options.port 服务端口
     * @param {string} options.provider 代理提供商
     * @param {boolean} options.enableLogging 启用日志
     * @param {string} options.logLevel 日志级别
     * @returns {AsyncGenerator} 服务状态流
     */
    async* start({
        abortController = new AbortController(),
        port = 8080,
        provider = 'lumiproxy',
        enableLogging = true,
        logLevel = 'info'
    } = {}) {
        if (!process.env.CLAUDE_PROXY_ENTRYPOINT) {
            process.env.CLAUDE_PROXY_ENTRYPOINT = 'sdk';
        }

        const args = [
            '--port', port.toString(),
            '--provider', provider
        ];

        if (enableLogging) {
            args.push('--enable-logging');
        }

        if (logLevel !== 'info') {
            args.push('--log-level', logLevel);
        }

        const servicePath = join(__dirname, 'index.js');
        
        if (!existsSync(servicePath)) {
            throw new ProxyError(`Service executable not found at ${servicePath}`, 'SERVICE_NOT_FOUND');
        }

        logDebug(`Starting proxy service: node ${args.join(' ')}`);

        const child = spawn('node', [servicePath, ...args], {
            stdio: ['pipe', 'pipe', 'pipe'],
            signal: abortController.signal,
            env: {
                ...process.env,
                NODE_ENV: 'production'
            }
        });

        child.stdin.end();

        if (process.env.DEBUG) {
            child.stderr.on('data', (data) => {
                console.error('Proxy service stderr:', data.toString());
            });
        }

        const cleanup = () => {
            if (!child.killed) {
                child.kill('SIGTERM');
            }
        };

        abortController.signal.addEventListener('abort', cleanup);
        process.on('exit', cleanup);

        try {
            let processError = null;
            child.on('error', (error) => {
                processError = new ProxyError(`Failed to spawn proxy service: ${error.message}`, 'SPAWN_ERROR');
            });

            const processExitPromise = new Promise((resolve, reject) => {
                child.on('close', (code) => {
                    if (abortController.signal.aborted) {
                        reject(new AbortError('Proxy service aborted by user'));
                    }
                    if (code !== 0) {
                        reject(new ProxyError(`Proxy service exited with code ${code}`, 'EXIT_ERROR'));
                    } else {
                        resolve();
                    }
                });
            });

            const rl = createInterface({ input: child.stdout });

            try {
                for await (const line of rl) {
                    if (processError) {
                        throw processError;
                    }
                    if (line.trim()) {
                        // 尝试解析JSON，如果失败则作为普通状态消息处理
                        try {
                            const data = JSON.parse(line);
                            yield {
                                type: 'status',
                                timestamp: new Date().toISOString(),
                                ...data
                            };
                        } catch (jsonError) {
                            // 非JSON输出，作为日志消息处理
                            yield {
                                type: 'log',
                                timestamp: new Date().toISOString(),
                                message: line.trim(),
                                level: 'info'
                            };
                        }
                    }
                }
            } finally {
                rl.close();
            }

            await processExitPromise;
        } finally {
            cleanup();
            abortController.signal.removeEventListener('abort', cleanup);
        }
    },

    /**
     * 检查代理服务健康状态
     * @param {string} baseUrl 服务基础URL
     * @returns {Promise<Object>} 健康状态
     */
    async checkHealth(baseUrl = 'http://127.0.0.1:8080') {
        try {
            // 验证URL格式
            new URL(baseUrl);
        } catch (error) {
            throw new ProxyError(`Invalid URL: ${baseUrl}`, 'INVALID_URL');
        }

        try {
            const response = await fetch(`${baseUrl}/health`);
            if (!response.ok) {
                throw new ProxyError(`Health check failed: ${response.status}`, 'HEALTH_CHECK_FAILED');
            }
            return await response.json();
        } catch (error) {
            if (error instanceof ProxyError) {
                throw error;
            }
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new ProxyError(`Connection failed: ${error.message}`, 'CONNECTION_FAILED');
            }
            throw new ProxyError(`Health check error: ${error.message}`, 'HEALTH_CHECK_ERROR');
        }
    },

    /**
     * 获取代理服务统计信息
     * @param {string} baseUrl 服务基础URL
     * @returns {Promise<Object>} 统计信息
     */
    async getStats(baseUrl = 'http://127.0.0.1:8080') {
        try {
            // 验证URL格式
            new URL(baseUrl);
        } catch (error) {
            throw new ProxyError(`Invalid URL: ${baseUrl}`, 'INVALID_URL');
        }

        try {
            const response = await fetch(`${baseUrl}/stats`);
            if (!response.ok) {
                throw new ProxyError(`Stats request failed: ${response.status}`, 'STATS_REQUEST_FAILED');
            }
            return await response.json();
        } catch (error) {
            if (error instanceof ProxyError) {
                throw error;
            }
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new ProxyError(`Connection failed: ${error.message}`, 'CONNECTION_FAILED');
            }
            throw new ProxyError(`Stats request error: ${error.message}`, 'STATS_REQUEST_ERROR');
        }
    },

    /**
     * 停止代理服务
     * @param {string} baseUrl 服务基础URL
     * @returns {Promise<boolean>} 是否成功停止
     */
    async stop(baseUrl = 'http://127.0.0.1:8080') {
        try {
            const response = await fetch(`${baseUrl}/shutdown`, {
                method: 'POST'
            });
            return response.ok;
        } catch (error) {
            logDebug(`Stop service error: ${error.message}`);
            return false;
        }
    }
};

/**
 * 简化的代理服务启动函数
 * @param {Object} options 配置选项
 * @returns {AsyncGenerator} 服务状态流
 */
export async function* startProxy(options = {}) {
    yield* ProxyOptions.start(options);
}

/**
 * 调试日志函数
 * @param {string} message 日志消息
 */
function logDebug(message) {
    if (process.env.DEBUG) {
        console.debug(`[ProxySDK] ${message}`);
    }
}

// 默认导出
export default ProxyOptions; 