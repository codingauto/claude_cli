# Claude Code 住宅代理服务

> 为 Claude Code 提供稳定的住宅IP代理 • 24小时粘性会话 • 自动防检测 • 开箱即用
>
> [![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) ![node](https://img.shields.io/badge/node-%3E=18.0-blue) ![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**语言**: **中文** | [English](README_EN.md)

---

<div align="center">
  <pre>
   ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
  ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
  ██║     ██║     ███████║██║   ██║██║  ██║█████╗  
  ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  
  ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
  </pre>
</div>

**Claude Code 住宅代理服务** 是一个专业的本地代理工具，专为解决 Claude Code 的风控问题而设计。

## 🎯 为什么需要这个项目？

### 核心问题：Anthropic 的严格风控

很多人会问：为什么不直接用 VPN？为什么不在服务器上装 Claude Code？为什么不用软路由方案？

**实话实说：很多方案都能用，但适用场景不同**

| 常见方案 | 存在问题 | 本项目解决方案 |
|----------|----------|----------------|
| **普通VPN** | IP被标记为VPN，容易触发风控 | 使用纯净住宅IP，模拟真实用户 |
| **服务器Claude Code** | 数据中心IP，容易被识别封禁 | 24小时固定住宅IP，避免检测 |
| **软路由方案** | 配置复杂，IP质量无保证 | 开箱即用，IP纯净度验证 |
| **公共代理** | 多人共用易被污染，不稳定 | 独立代理通道，稳定可靠 |

### 🔥 本项目的差异化价值

#### 1. **团队协作优化**
- 👥 **一账号多人共享** - 这是最大亮点，不用每人单独购买
- 🌐 **统一 IP 管理** - 所有团队成员使用相同 IP，保持一致性
- 📋 **集中化管理** - 一个地方配置，所有人受益

#### 2. **专业级配置**
- 🛡️ **深度伪装** - 不只是换IP，还模拟真实浏览器行为
- 🔍 **IP质量保证** - 内置检测工具，确保使用高质量IP
- 📊 **监控和日志** - 详细的使用数据和问题诊断

> 💡 **高端选择**：如果预算允许，IEPL专线 + 本项目的组合是最强方案。专线提供最高安全性（不走公网），本项目提供团队协作和精细化管理。

#### 3. **便民特性**
- 🚀 **开箱即用** - 无需复杂配置，适合非技术人员
- 💰 **成本透明** - 明确的定价和成本分担机制
- 🛠️ **技术支持** - 有问题可以找到人解决

### 💡 与其他方案的客观对比

> **实话实说**：很多方案都能用，关键是适合不同的使用场景。以下是中肯的对比：

| 特性 | 优质VPN | IEPL专线 | 服务器部署 | 软路由 | 本项目 |
|------|---------|----------|------------|--------|--------|
| **可行性** | ✅ **完全可行** | ✅ **完全可行** | ✅ **完全可行** | ✅ **完全可行** | ✅ **完全可行** |
| **安全性** | ✅ 高 | ✅ **最高** | ⚠️ 一般 | 🎲 看配置 | ✅ 高 |
| **IP质量** | ✅ 好（住宅） | ✅ **极佳**（不走公网） | ⚠️ 一般（机房IP） | 🎲 看运气 | ✅ 高（专业住宅） |
| **个人使用** | ✅ **最佳选择** | 💰 成本高 | ✅ 适合 | ⚠️ 过于复杂 | ⚠️ 成本高 |
| **团队共享** | ⚠️ 需多账号 | ✅ **可合租分摊** | ⚠️ 需多部署 | ⚠️ 复杂管理 | ✅ **原生支持** |
| **成本** | 中等（个人） | 高（可分摊） | 低（个人） | 高（硬件） | 低（共享） |
| **管理复杂度** | 低 | 低 | 中 | 高 | 低 |
| **风控抗性** | 中等 | ✅ **最强** | 低 | 中等 | 高 |

### 💬 实际情况分析

**你说得对：**
- Claude 可能确实没在封号上花太多心思
- 简单粗暴的 IP 判断可能是主要手段
- **优质住宅 VPN 确实能解决问题**
- **IEPL专线是最安全的选择**（不走公网，风控风险最低）

#### 💸 IEPL专线详解

**什么是IEPL？**
- **International Ethernet Private Line**（国际以太网专线）
- 直接连接国内外，不走公共互联网
- 风控风险极低，但价格较高

**IEPL的优势：**
- ✅ **最高安全性** - 不经过公网，几乎不可能被检测
- ✅ **稳定速度** - 专用线路，不受公网拥堵影响
- ✅ **可合租分摊** - 多人共享成本，降低使用门槛
- ⚠️ **IP会变化** - 隔一段时间会IP变化，但安全性依然很高

**那为什么还要用这个项目？**

#### 个人使用者：
- ✅ **直接用好的住宅VPN就行** （如 NordVPN、ExpressVPN 的住宅线路）
- ⚠️ 本项目对个人可能有点过度设计

#### 团队/公司使用者：
- ✅ **多人共享一个账号** —— 这是最大价值
- ✅ **统一的 IP 管理** —— 所有人通过同一代理
- ✅ **成本控制** —— 不用给每个人买 VPN
- ✅ **定制化配置** —— 根据团队需求调整

#### 高级用户：
- ✅ **精确控制** —— User-Agent、指纹、时序等
- ✅ **多代理轮换** —— 风险分散和负载均衡
- ✅ **监控和日志** —— 详细的使用数据和问题诊断

### 🎯 选择建议

| 您的情况 | 推荐方案 | 原因 |
|------------|----------|------|
| **个人开发者** | 优质住宅VPN | 简单直接，性价比高 |
| **预算充足个人** | IEPL专线 | 最高安全性，不走公网 |
| **小团队 (2-5人)** | 本项目 或 IEPL合租 | 共享成本，管理简单 |
| **中大团队 (5+人)** | 本项目 | 统一管理，成本优势明显 |
| **技术达人** | 软路由方案 | 完全控制，最高性价比 |
| **企业用户** | IEPL专线 或 本项目 | 稳定性、安全性、合规性 |
| **极度谨慎用户** | IEPL专线 | 专线连接，风控风险最低 |

### 🎯 目标用户场景

#### 场景1：开发团队协作
```bash
# 团队5个人，只需要1个Claude账号 + 1个代理服务
# 每个人设置相同的代理，共享账号使用
export ANTHROPIC_BASE_URL=http://your-proxy:8080
claude "帮我写这个功能"
```

#### 场景2：多项目并行开发
```bash
# 同一时间在多个项目中使用Claude Code
# 通过代理保持IP一致性，避免账号风控
cd project-a && claude "优化这个模块"
cd project-b && claude "修复这个bug"
```

#### 场景3：长期稳定使用
```bash
# 24小时固定IP，建立良好的使用历史
# 避免因IP变化触发Anthropic风控系统
claude "今天继续昨天的开发任务"
```

## 🌟 Claude Code 的重要性

**Claude Code 已成为编程界的新星**。这个由 Anthropic 推出的 CLI 工具正在彻底改变程序员的编程方式：

- 🎯 **Vibe Coder 的首选** —— 通过命令行进行 AI 辅助编程成为新潮流
- ⚡ **全新编程体验** —— 不只是 Claude 模型的强大，CLI 方式让编程变得更直观、更高效
- 🔥 **开发者热捧** —— 从代码生成到问题解决，Claude Code 正在重塑开发工作流

**然而，Anthropic 的严格风控成为最大障碍**：

众所周知，Anthropic 对中国用户实施了严格的访问限制，这让许多开发者无法体验到这一革命性工具。在现代化风控机制下，想要稳定使用 Claude Code 面临核心挑战：

1. **IP 检测** —— 使用"脏"IP、VPN IP 或数据中心 IP 容易被识别和封禁
2. **行为特征** —— 频繁IP变化、机器化请求模式容易触发风控
3. **设备指纹** —— 请求特征不匹配真实用户行为

**本工具专注解决这些技术挑战**，让您能够：
- ✅ 使用纯净的住宅 IP 地址，避免 VPN 检测
- ✅ 保持 24 小时固定 IP，建立稳定的使用模式  
- ✅ 模拟真实浏览器指纹，通过行为检测
- ✅ 多人共享同一代理，降低使用成本

> 💡 **完整解决方案**：本工具解决 IP 和指纹问题，支付问题请参考下面的支付方案说明。

## 💳 支付方案说明

解决了 IP 问题后，您还需要一个有效的支付方式来订阅 Claude Code。

### 🎯 推荐方案

| 支付方式 | 适用人群 | 推荐指数 | 说明 |
|----------|----------|----------|------|
| **Google Play 礼品卡** | Android 用户 | ⭐⭐⭐⭐⭐ | 最简单，支持支付宝购买 |
| **App Store 礼品卡** | iPhone 用户 | ⭐⭐⭐⭐⭐ | 最简单，支持支付宝购买 |
| **野卡** | 普通用户 | ⭐⭐⭐⭐ | 支持支付宝，[推荐码有优惠](https://yeka.ai/i/YD0TA7M7) |
| **Depay** | 有经验用户 | ⭐⭐⭐ | 较早的虚拟卡平台 |
| **海外公司卡** | 企业用户 | ⭐⭐⭐⭐⭐ | 最稳定，适合企业 |
| **美国银行卡** | 高端用户 | ⭐⭐⭐⭐⭐ | 最稳定，但获取门槛高 |

> 💡 **提示**: 支付问题不是本项目的重点，主要作用是解决 IP 和代理问题。具体支付方式请根据自己情况选择。

## 🤔 技术细节：为什么普通方案不行？

如果您在使用 Claude Code 时遇到以下问题：

- **网络限制** —— 某些地区无法直接访问 Claude Code
- **IP 被限制** —— 数据中心IP或频繁变动的代理IP容易被识别和限制
- **连接不稳定** —— 网络波动导致Claude Code调用失败
- **风控问题** —— 频繁更换IP触发安全检测

本项目通过"**本地代理 + 固定住宅IP**"的方案一次性解决这些问题：

- 🚀 **稳定访问**：使用真实住宅IP，避免数据中心IP的限制
- 🛡️ **低风险**：24小时固定IP，避免频繁切换触发风控
- 🔒 **隐私安全**：代理运行在本地，数据不经过第三方
- 🤖 **零配置**：设置环境变量即可，无需修改现有代码

## 📋 系统架构

```mermaid
graph LR
    A[Claude Code] --> B[本地代理服务<br/>localhost:8080]
    B --> C[住宅代理供应商<br/>固定住宅IP]
    C --> D[Claude API<br/>api.anthropic.com]
    
    style B fill:#e3f2fd
    style C fill:#e8f5e8
```

工作流程：

1. Claude Code 发送请求到本地代理 (localhost:8080)
2. 本地代理通过住宅IP代理转发请求
3. 住宅代理使用固定住宅IP访问 Claude API
4. 响应按原路返回

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| **住宅IP代理** | 使用真实住宅IP，避免数据中心IP限制 |
| **24小时粘性会话** | 固定IP连接，自动维护会话状态 |
| **多供应商支持** | 支持 LumiProxy、Oxylabs、Bright Data 等 |
| **自动故障转移** | 智能切换备用代理，保证服务稳定 |
| **TLS指纹伪装** | 模拟真实浏览器请求，避免检测 |
| **零配置启动** | 一键启动，自动处理所有配置 |
| **实时监控** | 健康检查、统计信息、日志记录 |
| **SDK支持** | 提供编程接口，方便集成到现有项目 |

## 🚀 快速开始

### 安装 Node.js

如果您的系统没有 Node.js，请先安装：

**macOS/Linux:**

```bash
# 使用 Homebrew (推荐)
brew install node

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

**Windows:**

```powershell
# 使用 Chocolatey
choco install nodejs

# 或直接下载安装包
# https://nodejs.org/
```

验证安装：

```bash
node --version  # 应显示 v18.0.0 或更高版本
npm --version
```

### 安装 Claude Code

**如果您已经安装了 Claude Code，可以跳过这一步。**

Claude Code 是 Anthropic 官方的 CLI 工具，用于与 Claude API 交互：

```bash
npm install -g @anthropics/claude-code
```

> **注意**: 如果在您的地区安装 Claude Code 遇到网络问题，请尝试使用不同的 npm 镜像源：
> 
> ```bash
> npm install -g @anthropics/claude-code --registry=https://registry.npmmirror.com
> ```

验证安装：

```bash
claude --version
```

### 安装代理服务

**方式1：从 Gitee 下载安装包（推荐）**

访问 [Gitee Releases 页面](https://gitee.com/codeauto/claude_cli/releases) 下载对应平台的安装包：

```bash
# 下载并安装 (以 Linux 为例)
wget https://gitee.com/codeauto/claude_cli/releases/download/v1.0.0/claude-residential-proxy-1.0.0.tgz
npm install -g claude-residential-proxy-1.0.0.tgz
```

**方式2：从源码安装**

```bash
# 克隆仓库
git clone https://gitee.com/codeauto/claude_cli.git
cd claude_cli

# 安装依赖
npm install

# 构建发布包
npm run build:release

# 安装到全局
npm install -g dist/claude-residential-proxy-1.0.0.tgz
```

**方式3：开发模式运行**

```bash
git clone https://gitee.com/codeauto/claude_cli.git
cd claude_cli
npm install
npm start
```

### 配置代理服务

1. **配置代理提供商**

编辑 `config/proxy.json`：
```json
{
  "providers": {
    "lumiproxy": {
      "enabled": true,
      "username": "your-username",
      "password": "your-password", 
      "endpoint": "residential-proxy.lumiproxy.com:8000"
    }
  }
}
```

2. **启动代理服务**

```bash
# 如果全局安装了包，可以使用 npm 脚本启动
npm start

# 或源码模式
npm start
```

服务将在 `http://localhost:8080` 启动。

3. **配置 Claude Code**

设置环境变量：
```bash
export ANTHROPIC_BASE_URL=http://localhost:8080
```

或在每次使用时指定：
```bash
ANTHROPIC_BASE_URL=http://localhost:8080 claude "你好"
```

## 🎯 完整使用流程

### 第一次使用（完整流程）

```bash
# 1. 安装 Node.js（如果未安装）
brew install node  # macOS
# 或访问 https://nodejs.org/ 下载安装

# 2. 安装 Claude Code（如果未安装）
npm install -g @anthropics/claude-code

# 3. 安装代理服务
wget https://gitee.com/codeauto/claude_cli/releases/download/v1.0.0/claude-residential-proxy-1.0.0.tgz
npm install -g claude-residential-proxy-1.0.0.tgz

# 4. 配置代理服务
# 编辑 config/proxy.json 添加您的代理提供商信息

# 5. 启动代理服务
npm start
# 服务将在 http://localhost:8080 启动

# 6. 设置环境变量
export ANTHROPIC_BASE_URL=http://localhost:8080

# 7. 开始使用
claude "你好，帮我写一个 Python 脚本"
```

### 日常使用（已安装）

```bash
# 1. 启动代理服务
npm start

# 2. 设置环境变量（或添加到 .bashrc/.zshrc）
export ANTHROPIC_BASE_URL=http://localhost:8080

# 3. 使用 Claude Code
claude "帮我解释这段代码"
claude -p "这个函数做什么？" < my_script.py
cat README.md | claude -p "总结这个项目"
```

## ✅ 部署验证与测试

### 1. 检查代理服务状态

```bash
# 检查代理服务健康状态
curl http://localhost:8080/health
```

期望响应：
```json
{
  "status": "healthy",
  "timestamp": "2025-06-28T18:15:30.445Z",
  "session": {
    "id": "session_123",
    "ip": "192.168.1.100",
    "status": "active"
  },
  "proxy": {
    "healthy": true,
    "provider": "lumiproxy"
  }
}
```

### 2. 检查当前IP地址

**通过浏览器访问（推荐）:**
- 打开浏览器访问：http://localhost:8080/ip
- 或访问：http://localhost:8080/status

**通过命令行检测:**
```bash
# 检查当前使用的IP地址
curl http://localhost:8080/ip

# 或使用外部服务检测
curl --proxy http://localhost:8080 http://httpbin.org/ip
curl --proxy http://localhost:8080 https://api.ipify.org?format=json
curl --proxy http://localhost:8080 https://ipinfo.io/json
```

### 3. 验证代理连通性

**方法1：直接测试**
```bash
# 测试代理是否可以访问外网
curl --proxy http://localhost:8080 https://www.google.com -I

# 测试访问Claude API
curl --proxy http://localhost:8080 https://api.anthropic.com -I
```

**方法2：使用检测网页**

在浏览器中访问以下网址来检测IP和网络状态：

- **IP地址检测**: 
  - [https://whatismyipaddress.com/](https://whatismyipaddress.com/)
  - [https://www.whatsmyip.org/](https://www.whatsmyip.org/)
  - [https://ipinfo.io/](https://ipinfo.io/)

- **IP纯净度检测（重要）**:
  - [https://scamalytics.com/](https://scamalytics.com/) - 检测IP风险评分
  - [https://whatismyipaddress.com/blacklist-check](https://whatismyipaddress.com/blacklist-check) - 黑名单检查
  - [https://www.abuseipdb.com/](https://www.abuseipdb.com/) - IP滥用数据库检查
  - [https://fraudguard.io/](https://fraudguard.io/) - 欺诈检测

- **网络连通性检测**:
  - [https://www.speedtest.net/](https://www.speedtest.net/)
  - [https://fast.com/](https://fast.com/)

### 4. 测试Claude Code连接

```bash
# 设置代理环境变量
export ANTHROPIC_BASE_URL=http://localhost:8080

# 测试Claude Code是否正常工作
claude "请说'连接成功'"

# 如果上面成功，会返回Claude的回复："连接成功"
```

### 5. 查看详细状态

```bash
# 查看代理统计信息
curl http://localhost:8080/stats

# 查看代理日志
tail -f logs/proxy-$(date +%Y-%m-%d).log

# 检查错误日志
tail -f logs/proxy-error-$(date +%Y-%m-%d).log
```

### 🚨 故障诊断

如果遇到问题，按以下步骤检查：

#### 1. 服务无法启动
```bash
# 检查端口是否被占用
lsof -i :8080

# 查看错误日志
npm start 2>&1 | tee startup.log
```

#### 2. 代理连接失败
```bash
# 检查代理配置
cat config/proxy.json

# 测试代理服务商连接
curl -x http://username:password@proxy-host:port http://httpbin.org/ip
```

#### 3. Claude Code无法连接
```bash
# 检查环境变量
echo $ANTHROPIC_BASE_URL

# 检查Claude Code版本
claude --version

# 重置并重试
unset ANTHROPIC_BASE_URL
export ANTHROPIC_BASE_URL=http://localhost:8080
claude "测试连接"
```

## 🛠️ 配置说明

### 代理配置 (config/proxy.json)

```json
{
  "providers": {
    "lumiproxy": {
      "enabled": true,
      "username": "your-username",
      "password": "your-password",
      "endpoint": "residential-proxy.lumiproxy.com:8000",
      "timeout": 30000,
      "maxRetries": 3
    },
    "oxylabs": {
      "enabled": false,
      "username": "your-username", 
      "password": "your-password",
      "endpoint": "residential.oxylabs.io:8001"
    }
  }
}
```

### 安全配置 (config/security.json)

```json
{
  "enableTLSFingerprinting": true,
  "enableHTTP2": true,
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "timing": {
    "minDelay": 100,
    "maxDelay": 500,
    "requestInterval": 1000
  }
}
```

## 📊 监控和管理

### 健康检查

```bash
curl http://localhost:8080/health
```

响应示例：
```json
{
  "status": "healthy",
  "timestamp": "2025-06-28T18:15:30.445Z",
  "session": {
    "id": "session_123",
    "ip": "192.168.1.100",
    "status": "active"
  },
  "proxy": {
    "healthy": true,
    "provider": "lumiproxy"
  }
}
```

### 统计信息

```bash
curl http://localhost:8080/stats
```

### 日志查看

```bash
# 实时日志
tail -f logs/proxy-$(date +%Y-%m-%d).log

# 错误日志
tail -f logs/proxy-error-$(date +%Y-%m-%d).log
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 分类测试
npm run test:unit        # 单元测试
npm run test:integration # 集成测试
npm run test:e2e        # 端到端测试

# 测试覆盖率
npm run test:coverage
```

## 🖥️ 服务器/VPS 部署

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start scripts/start-proxy.js --name claude-proxy

# 查看状态
pm2 status

# 查看日志
pm2 logs claude-proxy
```

### 使用 Docker

```bash
# 构建镜像
docker build -t claude-proxy .

# 运行容器
docker run -d \
  --name claude-proxy \
  -p 8080:8080 \
  -v $(pwd)/config:/app/config \
  claude-proxy
```

### 使用 systemd

```bash
# 复制服务文件
sudo cp scripts/claude-proxy.service /etc/systemd/system/

# 启动服务
sudo systemctl enable claude-proxy
sudo systemctl start claude-proxy
```

## 🔧 故障排除

### 常见问题

1. **代理连接失败**
   ```bash
   # 检查代理配置
   curl -s http://localhost:8080/health | jq '.proxy'
   
   # 测试代理连接
   curl -x http://username:password@proxy-endpoint:port http://httpbin.org/ip
   ```

2. **端口被占用**
   ```bash
   # 查找占用进程
   lsof -i :8080
   
   # 更换端口
   PORT=8081 npm start
   ```

3. **Claude Code 无法连接**
   ```bash
   # 检查环境变量
   echo $ANTHROPIC_BASE_URL
   
   # 测试代理服务
   curl http://localhost:8080/health
   ```

### 调试模式

```bash
# 启用详细日志
DEBUG_PROXY=1 npm start

# 或使用调试脚本
npm run debug
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 打开 Pull Request

## 📜 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🛣️ 路线图

### 当前版本 (v1.0)
- [x] 基础代理服务功能
- [x] 24小时粘性会话
- [x] TLS指纹伪装
- [x] 多提供商支持
- [x] IP纯净度检测

### 🆕 v1.0 版本优化说明

本版本在原有基础上进行了全面的优化和增强，主要改进包括：

#### 📌 代码质量提升
- **修复异步构造函数问题** - ProxyManager 现使用静态工厂方法，消除潜在的竞态条件
- **简化配置加载** - 统一配置格式，移除兼容性代码，提升可维护性
- **改进错误处理** - 未处理的 Promise 拒绝现在会触发优雅关闭
- **重构中间件** - 认证和会话管理分离为独立中间件，职责更清晰

#### 📌 安全性全面加固
- **DNS 泄露防护** - 所有网络请求（包括健康检查）现在都通过代理，防止真实 IP 暴露
- **动态 TLS 指纹** - 实现 5 种浏览器 TLS 配置池，每个会话随机选择，避免指纹识别
- **浏览器一致性** - User-Agent、Client Hints、Accept 等头部完全匹配，消除指纹矛盾
- **背景噪音流量** - 新增 NoiseManager，生成随机网站访问，避免单一 API 流量模式

#### 📌 高级功能实现
- **18-30小时随机会话** - 会话时长随机化，更接近真实用户行为
- **人类行为模拟** - 新增 BehaviorManager，实现 ACTIVE/THINKING/IDLE 状态机
- **地理位置匹配** - 新增 GeoMatcher，自动匹配代理位置的语言和时区
- **分级健康检查** - 轻量级检查与重量级检查分离，减少不必要的 API 调用

#### 📌 测试与稳定性
- **完整测试套件** - 新增单元测试、集成测试、性能测试，覆盖率 95%+
- **熔断器机制** - 所有代理失效时自动进入冷却期，避免资源耗尽
- **日志脱敏** - 自动隐藏 IP、密码等敏感信息
- **配置验证** - 启动时自动验证配置完整性

#### 📌 用户体验优化
- **macOS 应用支持** - 提供原生 .app 包，双击即可启动
- **配置外部化** - 浏览器指纹、TLS 配置移至 `config/fingerprints.json`
- **详细文档** - 新增架构文档、测试报告、优化指南等

这些优化使得代理服务更加稳定、安全、难以被检测，同时保持了易用性。

### 近期计划 (v1.x)
- [ ] Web 管理界面
- [ ] 更多代理供应商支持
- [ ] 自动配置向导
- [ ] 性能优化和缓存
- [ ] Kubernetes 支持

### 🚀 未来愿景 (v2.0)
- [ ] **多客户端多IP架构** - 一任务一代理一IP
- [ ] **智能负载均衡** - 自动分配最优代理资源
- [ ] **多账号并行工作** - 同时使用多个Claude账号
- [ ] **动态会话管理** - 根据需求动态创建代理

> 📖 **详细了解未来规划**: 查看 [FUTURE_VISION.md](FUTURE_VISION.md) 了解完整的未来架构设计和实现路线图

## 💬 支持

- 📖 **文档**: 查看 [QUICK_START.md](QUICK_START.md) 获取详细使用指南
- 🐛 **问题反馈**: 在 [Issues](https://gitee.com/codeauto/claude_cli/issues) 页面报告问题
- 💡 **功能建议**: 欢迎提出新功能建议

## 🙏 致谢

特别感谢 [shiyongyin](https://gitee.com/shiyongyin) 在功能增强方面的贡献和支持！

---

**让 Claude API 访问更稳定！** 🚀