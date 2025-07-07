# Claude Residential Proxy Service

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux-blue)](https://github.com)

## 📋 概述

Claude Residential Proxy Service 是一个专为 Claude Code 和其他自动化工具设计的高级反检测代理服务。它通过模拟真实用户的浏览行为、维持一致的浏览器指纹、以及智能的流量管理，有效绕过各类反机器人检测系统。

### 核心特性

- 🏠 **固定住宅IP会话** - 24小时 Sticky Session，避免频繁IP变更
- 🛡️ **高级反检测能力** - TLS指纹伪装、浏览器指纹一致性、人类行为模拟
- 🌍 **地理位置智能匹配** - 自动匹配IP位置的语言、时区等特征
- 🔄 **智能重试机制** - 自动故障转移和会话保持
- 📊 **背景噪音流量** - 生成真实的浏览模式，避免流量特征过于单一
- 🚀 **零配置启动** - 开箱即用，支持测试模式

## 🚀 快速开始

### 系统要求

- Node.js >= 18.0.0
- macOS 或 Linux 操作系统
- 至少 1GB 可用内存

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/claude-residential-proxy.git
cd claude-residential-proxy

# 安装依赖
npm install
```

### 启动服务

#### 方式一：交互式启动（推荐首次使用）

```bash
npm start
```

启动后会提示是否配置代理提供商，选择 `n` 进入测试模式。

#### 方式二：直接启动

```bash
NODE_ENV=production PORT=7070 node src/index.js
```

#### 方式三：后台启动

```bash
NODE_ENV=production PORT=7070 node src/index.js > logs/proxy.log 2>&1 &
```

### 验证服务

```bash
# 健康检查
curl http://localhost:7070/health

# 查看统计信息
curl http://localhost:7070/stats
```

## 📖 使用指南

### 配置代理客户端

将你的 HTTP 客户端配置为使用代理：

```javascript
// Node.js 示例
const axios = require('axios');

const client = axios.create({
  proxy: {
    host: 'localhost',
    port: 7070
  }
});
```

```python
# Python 示例
import requests

proxies = {
  'http': 'http://localhost:7070',
  'https': 'http://localhost:7070'
}

response = requests.get('https://example.com', proxies=proxies)
```

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 服务健康状态检查 |
| `/stats` | GET | 获取详细统计信息 |
| `/v1/*` | ALL | 代理转发路径 |

### 环境变量

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `PORT` | 7070 | 服务监听端口 |
| `NODE_ENV` | development | 运行环境 |
| `LOG_LEVEL` | info | 日志级别 |
| `DEBUG_PROXY` | 0 | 调试模式开关 |

## 🔧 配置文件

### 代理提供商配置 (`config/proxy.json`)

```json
{
  "providers": [
    {
      "name": "residential-proxy",
      "type": "residential",
      "enabled": true,
      "config": {
        "host": "your-proxy-host",
        "port": 8080,
        "username": "your-username",
        "password": "your-password"
      }
    }
  ]
}
```

### 浏览器指纹配置 (`config/fingerprints.json`)

包含了最新的浏览器 User-Agent、TLS 配置、时区、语言等信息，用于生成一致的浏览器指纹。

## 📊 监控与调试

### 日志文件

日志文件位于 `logs/` 目录：

- `proxy-YYYY-MM-DD.log` - 主要服务日志
- `proxy-error-YYYY-MM-DD.log` - 错误日志

### 实时监控

```bash
# 实时查看日志
tail -f logs/proxy-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/proxy-error-$(date +%Y-%m-%d).log
```

### 性能指标

通过 `/stats` 端点可以获取：

- 请求统计（总数、成功率、平均响应时间）
- 代理健康状态
- 会话信息
- 行为模拟状态
- 资源使用情况

## 🛡️ 安全特性

1. **TLS 指纹伪装** - 模拟真实浏览器的 TLS 握手特征
2. **请求头一致性** - 确保所有请求头符合真实浏览器行为
3. **时序控制** - 模拟人类的请求间隔和模式
4. **DNS 防泄露** - 所有 DNS 查询通过代理进行
5. **日志脱敏** - 自动隐藏敏感信息

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request。在提交 PR 之前，请确保：

1. 代码通过所有测试
2. 更新相关文档
3. 遵循项目代码规范

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../LICENSE) 文件。

## 🙏 致谢

- 感谢 Claude AI 团队提供的优秀工具
- 感谢所有贡献者的支持

## 📞 联系方式

- Issue: [GitHub Issues](https://github.com/your-username/claude-residential-proxy/issues)
- Email: your-email@example.com