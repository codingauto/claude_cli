#!/usr/bin/env node

/**
 * Claude Residential Proxy Starter
 * 借鉴官方Claude Code start.js的设计模式
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检测操作系统
const OS_TYPE = os.type();
const IS_LINUX = OS_TYPE === 'Linux';
const IS_MACOS = OS_TYPE === 'Darwin';
const IS_WINDOWS = OS_TYPE === 'Windows_NT';

// 配置路径
const PROJECT_ROOT = path.join(__dirname, '..');
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config');
const PROXY_CONFIG_PATH = path.join(CONFIG_DIR, 'proxy.json');
const SECURITY_CONFIG_PATH = path.join(CONFIG_DIR, 'security.json');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');

// 平台支持检查 (借鉴官方逻辑)
if (!IS_LINUX && !IS_MACOS) {
    console.error(`❌ 不支持的操作系统: ${OS_TYPE}`);
    console.error('💡 Claude Residential Proxy 需要 macOS 或 Linux 环境');
    if (IS_WINDOWS) {
        console.error('🔧 Windows 用户请使用 WSL (Windows Subsystem for Linux)');
    }
    process.exit(1);
}

// 调试模式开关
const DEBUG_MODE = process.env.DEBUG_PROXY === '1' || process.argv.includes('--debug');

// 创建 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promise 包装 readline.question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// 调试日志函数
const debugLog = (message, data = null) => {
    if (DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`);
        if (data) {
            console.log(data);
        }
    }
};

// 显示启动横幅 (借鉴官方设计)
function displayStartupBanner() {
    console.log('\n');
    
    const colorReset = '\x1b[0m';
    const colorBright = '\x1b[1m';
    const colorCyan = '\x1b[36m';
    const colorYellow = '\x1b[33m';
    const colorMagenta = '\x1b[35m';
    const colorRed = '\x1b[31m';
    const colorBlue = '\x1b[34m';
    
    const bannerLines = [
        `${colorBright}${colorRed}   ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗${colorReset}`,
        `${colorBright}${colorRed}  ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝${colorReset}`,
        `${colorBright}${colorBlue}  ██║     ██║     ███████║██║   ██║██║  ██║█████╗  ${colorReset}`,
        `${colorBright}${colorBlue}  ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  ${colorReset}`,
        `${colorBright}${colorMagenta}  ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗${colorReset}`,
        `${colorBright}${colorMagenta}   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝${colorReset}`,
        '',
        `${colorBright}${colorYellow}🏠 Residential Proxy Service${colorReset}`,
        `${colorCyan}   固定IP • 防检测 • 24小时会话${colorReset}`
    ];
    
    bannerLines.forEach(line => {
        console.log(line);
    });
    
    console.log('\n');
}

// 检查系统依赖
function checkDependencies() {
    debugLog('🔍 检查系统依赖...');
    
    // 检查 Node.js 版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
        console.error(`❌ Node.js 版本过低: ${nodeVersion}`);
        console.error('💡 需要 Node.js 18.0.0 或更高版本');
        process.exit(1);
    }
    
    debugLog(`✅ Node.js ${nodeVersion}`);
    
    // 检查必要目录
    const requiredDirs = [CONFIG_DIR, LOGS_DIR];
    for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
                debugLog(`✅ 创建目录: ${dir}`);
            } catch (error) {
                console.error(`❌ 无法创建目录 ${dir}: ${error.message}`);
                process.exit(1);
            }
        }
    }
}

// 检查配置文件
function checkConfiguration() {
    debugLog('🔍 检查配置文件...');
    
    const configFiles = [
        { path: PROXY_CONFIG_PATH, name: '代理配置' },
        { path: SECURITY_CONFIG_PATH, name: '安全配置' }
    ];
    
    for (const { path: configPath, name } of configFiles) {
        if (!fs.existsSync(configPath)) {
            console.error(`❌ ${name}文件不存在: ${configPath}`);
            console.error('💡 请运行 npm run setup 初始化配置');
            process.exit(1);
        }
        
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            JSON.parse(content);
            debugLog(`✅ ${name}文件格式正确`);
        } catch (error) {
            console.error(`❌ ${name}文件格式错误: ${error.message}`);
            process.exit(1);
        }
    }
}

// 验证代理配置
async function validateProxyConfiguration() {
    debugLog('🔍 验证代理配置...');
    
    try {
        const proxyConfig = JSON.parse(fs.readFileSync(PROXY_CONFIG_PATH, 'utf8'));
        
        // 检查是否配置了代理提供商
        const providers = proxyConfig.providers || {};
        const activeProviders = Object.values(providers).filter(p => p.enabled);
        
        if (activeProviders.length === 0) {
            console.log('⚠️  未检测到已启用的代理提供商');
            console.log('💡 将使用测试模式启动服务');
            
            const shouldConfigure = await question('是否现在配置代理提供商? (y/n): ');
            if (shouldConfigure.toLowerCase() === 'y') {
                console.log('📝 请编辑 config/proxy.json 文件配置代理提供商');
                console.log('🔧 支持的提供商: LumiProxy, Oxylabs, Bright Data');
                process.exit(0);
            }
        } else {
            debugLog(`✅ 发现 ${activeProviders.length} 个已启用的代理提供商`);
        }
        
    } catch (error) {
        console.error('❌ 代理配置验证失败:', error.message);
        process.exit(1);
    }
}

// 全局错误处理器 (借鉴官方逻辑)
function setupGlobalErrorHandlers() {
    process.on('uncaughtException', (error) => {
        console.error('\n❌ 未捕获的异常:', error.message);
        debugLog('完整堆栈:', error.stack);
        console.error('⚠️  服务将在3秒后退出...');
        setTimeout(() => process.exit(1), 3000);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('\n❌ 未处理的Promise拒绝:', reason);
        debugLog('Promise:', promise);
        console.error('⚠️  服务将在3秒后退出...');
        setTimeout(() => process.exit(1), 3000);
    });

    debugLog('🛡️  全局错误监听器已启动');
}

// 启动代理服务
function startProxyService() {
    console.log('🚀 启动 Claude Residential Proxy 服务...\n');
    
    const servicePath = path.join(PROJECT_ROOT, 'src', 'index.js');
    
    // 检查服务文件是否存在
    if (!fs.existsSync(servicePath)) {
        console.error('❌ 找不到服务文件:', servicePath);
        process.exit(1);
    }
    
    // 准备启动参数
    const args = [servicePath];
    
    // 添加命令行参数
    const cliArgs = process.argv.slice(2);
    args.push(...cliArgs);
    
    debugLog(`启动命令: node ${args.join(' ')}`);
    
    // 启动服务
    const service = spawn('node', args, {
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_ENV: process.env.NODE_ENV || 'production',
            DEBUG_PROXY: DEBUG_MODE ? '1' : '0',
            FORCE_COLOR: '1'
        },
        detached: false
    });
    
    service.on('error', (error) => {
        console.error('❌ 服务启动失败:', error.message);
        process.exit(1);
    });
    
    service.on('exit', (code, signal) => {
        if (signal) {
            console.log(`\n📋 服务被信号终止: ${signal}`);
        } else if (code !== 0) {
            console.error(`\n❌ 服务异常退出，代码: ${code}`);
        } else {
            console.log('\n✅ 服务正常退出');
        }
        process.exit(code);
    });
    
    // 优雅关闭处理
    const gracefulShutdown = () => {
        console.log('\n📋 正在优雅关闭服务...');
        service.kill('SIGTERM');
        setTimeout(() => {
            service.kill('SIGKILL');
        }, 5000);
    };
    
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
}

// 主函数
async function main() {
    try {
        // 设置全局错误处理
        setupGlobalErrorHandlers();
        
        // 显示启动横幅
        displayStartupBanner();
        
        console.log(`🔐 Claude Residential Proxy (${OS_TYPE})\n`);
        
        // 检查系统依赖
        checkDependencies();
        
        // 检查配置文件
        checkConfiguration();
        
        // 验证代理配置
        await validateProxyConfiguration();
        
        // 关闭 readline 接口
        rl.close();
        
        // 启动服务
        startProxyService();
        
    } catch (error) {
        console.error('❌ 启动失败:', error.message);
        rl.close();
        process.exit(1);
    }
}

// 启动
main(); 