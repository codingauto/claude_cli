# 🚀 Claude Code 住宅代理服务 - 快速开始

> **Claude Code** 已成为 Vibe Coder 们的编程新选择，但 Anthropic 的访问限制让许多中国开发者无法体验。本工具通过提供**高纯净度住宅IP代理**，帮助您稳定访问 Claude Code，享受 AI 辅助编程的魅力。

## 📋 前置要求

- Node.js >= 18.0.0
- npm 或 yarn
- 住宅代理服务商账号（LumiProxy、Oxylabs、Bright Data等）

## 🔧 安装 Claude Code

**如果您已经安装了 Claude Code，可以跳过这一步。**

```bash
npm install -g @anthropics/claude-code
```

> **网络问题解决**: 如果安装遇到网络问题，可以尝试使用镜像源：
> 
> ```bash
> npm install -g @anthropics/claude-code --registry=https://registry.npmmirror.com
> ```

验证安装：
```bash
claude --version
```

## ⚡ 安装与启动

### 方式1：安装发布包（推荐）

从 [Gitee Releases](https://gitee.com/codeauto/claude_cli/releases) 下载安装包：

```bash
# 下载并全局安装
wget https://gitee.com/codeauto/claude_cli/releases/download/v1.0.0/claude-residential-proxy-1.0.0.tgz
npm install -g claude-residential-proxy-1.0.0.tgz
```

### 方式2：源码运行

```bash
# 克隆仓库
git clone https://gitee.com/codeauto/claude_cli.git
cd claude_cli

# 安装依赖
npm install

# 启动服务
npm start
```

## 🔧 配置代理服务

### 1. 配置代理提供商

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

### 2. 配置安全策略（可选）

编辑 `config/security.json`：

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

### 3. 启动代理服务

```bash
# 启动服务
npm start
```

服务将在 `http://localhost:8080` 启动。

## 🔗 配置 Claude Code

### 方法1: 环境变量（推荐）

```bash
export ANTHROPIC_BASE_URL=http://localhost:8080
```

### 方法2: 每次使用时指定

```bash
ANTHROPIC_BASE_URL=http://localhost:8080 claude "你好"
```

## ✅ 完整使用流程

### 第一次完整设置

```bash
# 1. 安装 Claude Code（如果未安装）
npm install -g @anthropics/claude-code

# 2. 安装代理服务
wget https://gitee.com/codeauto/claude_cli/releases/download/v1.0.0/claude-residential-proxy-1.0.0.tgz
npm install -g claude-residential-proxy-1.0.0.tgz

# 3. 配置代理提供商（编辑 config/proxy.json）
# 4. 启动代理服务
npm start

# 5. 设置环境变量
export ANTHROPIC_BASE_URL=http://localhost:8080

# 6. 开始使用
claude "你好，帮我写一个 Python 脚本"
```

### 日常使用

```bash
# 1. 启动代理（如果还没启动）
npm start

# 2. 使用 Claude Code
claude "解释这段代码"
claude -p "这个函数做什么？" < script.py
cat README.md | claude -p "总结这个项目"
```

## ✅ 部署验证 - 确保一切正常

### 步骤1: 检查代理服务状态

```bash
curl http://localhost:8080/health
```

✅ **期望结果**: 返回包含 `"status": "healthy"` 的JSON响应

### 步骤2: 验证IP地址和代理连通性

**在浏览器中打开以下网址检测:**

- **查看当前IP**: http://localhost:8080/ip 
- **服务状态页**: http://localhost:8080/status

**命令行检测:**
```bash
# 检查通过代理访问的IP地址
curl --proxy http://localhost:8080 https://api.ipify.org?format=json

# 结果应显示代理服务商提供的住宅IP，而不是您的本地IP
```

### 步骤3: 测试Anthropic API连接

**重要: 这一步验证是否能正常访问Claude API**

```bash
# 测试能否访问Anthropic API
curl --proxy http://localhost:8080 https://api.anthropic.com -I

# 期望结果: 返回HTTP/2 200 或类似的成功响应
```

### 步骤4: 端到端测试Claude Code

```bash
# 设置代理环境变量
export ANTHROPIC_BASE_URL=http://localhost:8080

# 测试Claude Code完整功能
claude "请回复'测试成功'以确认连接正常"

# ✅ 如果一切正常，Claude会回复确认消息
```

### 🌐 推荐的检测网页

在浏览器中访问这些网页来验证代理效果：

1. **IP地址检测**:
   - [https://whatismyipaddress.com/](https://whatismyipaddress.com/)
   - [https://www.whatsmyip.org/](https://www.whatsmyip.org/)
   - [https://ipinfo.io/](https://ipinfo.io/)

2. **IP纯净度检测（关键）**:
   - [https://scamalytics.com/](https://scamalytics.com/) - 查看IP风险评分（应为低风险）
   - [https://whatismyipaddress.com/blacklist-check](https://whatismyipaddress.com/blacklist-check) - 检查IP是否在黑名单
   - [https://www.abuseipdb.com/](https://www.abuseipdb.com/) - 检查IP滥用记录
   - [https://fraudguard.io/](https://fraudguard.io/) - 综合欺诈检测

3. **Anthropic服务检测**:
   - [https://status.anthropic.com/](https://status.anthropic.com/) （查看Anthropic服务状态）

4. **网络连通性**:
   - [https://www.speedtest.net/](https://www.speedtest.net/)
   - [https://fast.com/](https://fast.com/)

### 📊 状态检查命令合集

```bash
# 一键检查所有状态
echo "=== 代理服务状态 ==="
curl -s http://localhost:8080/health | jq

echo -e "\n=== 当前IP地址 ==="
curl -s --proxy http://localhost:8080 https://api.ipify.org?format=json | jq

echo -e "\n=== IP地理位置信息 ==="
curl -s --proxy http://localhost:8080 https://ipinfo.io/json | jq

echo -e "\n=== Anthropic API连通性 ==="
curl -s --proxy http://localhost:8080 https://api.anthropic.com -I | head -1

echo -e "\n=== 环境变量检查 ==="
echo "ANTHROPIC_BASE_URL: $ANTHROPIC_BASE_URL"
```

### 🔍 IP纯净度验证指南

**为什么IP纯净度重要？**
- 干净的住宅IP可以避免被Anthropic等服务标记为可疑流量
- 降低账号被限制的风险
- 确保长期稳定使用

**检测步骤：**

1. **风险评分检测**：
   - 访问 [Scamalytics](https://scamalytics.com/)
   - 输入您的代理IP地址
   - ✅ **期望结果**：风险评分应为 "Very Low" 或 "Low"
   - ❌ **避免**：如果显示 "High" 或 "Very High"，建议更换代理提供商

2. **黑名单检查**：
   - 访问 [IP黑名单检查](https://whatismyipaddress.com/blacklist-check)
   - 检查IP是否在任何黑名单中
   - ✅ **期望结果**：所有检查项都应为绿色（未列入黑名单）

3. **IP类型验证**：
   ```bash
   # 检查IP类型和ISP信息
   curl -s --proxy http://localhost:8080 "https://ipinfo.io/json" | jq '.org, .country, .region, .city'
   ```
   - ✅ **期望结果**：应显示住宅ISP（如 Comcast、Verizon等）
   - ❌ **避免**：显示数据中心ISP（如 Amazon、Google Cloud等）

**IP纯净度评分标准：**

| 评分 | 状态 | 建议 |
|------|------|------|
| Very Low (0-25) | 🟢 优秀 | 可安全使用 |
| Low (26-50) | 🟡 良好 | 可以使用，建议监控 |
| Medium (51-75) | 🟠 警告 | 谨慎使用，可能有风险 |
| High (76-100) | 🔴 危险 | 立即更换IP |

### 🚨 常见问题自检

| 问题 | 检查命令 | 解决方法 |
|------|----------|----------|
| 代理服务未启动 | `curl http://localhost:8080/health` | 运行 `npm start` |
| 端口被占用 | `lsof -i :8080` | 更换端口或关闭占用进程 |
| 代理商连接失败 | `curl -x http://user:pass@proxy:port http://httpbin.org/ip` | 检查代理配置和凭据 |
| Claude Code无法连接 | `echo $ANTHROPIC_BASE_URL` | 重新设置环境变量 |
| IP未改变 | `curl --proxy http://localhost:8080 https://api.ipify.org` | 检查代理配置是否正确 |

## 📊 监控和健康检查

### 健康检查

```bash
curl http://localhost:8080/health
```

响应示例：

```json
{
  "status": "healthy",
  "timestamp": "2025-06-28T18:15:30.445Z",
  "uptime": 2.821415667,
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

## 🧪 运行测试

### 运行所有测试

```bash
npm test
```

### 运行特定测试

```bash
# 单元测试
npm run test:unit

# 集成测试  
npm run test:integration

# 端到端测试
npm run test:e2e
```

### 测试覆盖率

```bash
npm run test:coverage
```

## 🖥️ 服务器部署

### 1. 使用 PM2（推荐）

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

### 2. 使用 Docker

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

### 3. 使用 systemd

```bash
# 创建服务文件
sudo nano /etc/systemd/system/claude-proxy.service

# 启动服务
sudo systemctl enable claude-proxy
sudo systemctl start claude-proxy
```

## 🔒 安全最佳实践

### 1. 环境变量管理

- 使用 `.env` 文件管理敏感配置
- 生产环境使用环境变量或密钥管理服务
- 不要将 `.env` 文件提交到版本控制

### 2. 网络安全

```bash
# 仅允许本地访问
export BIND_HOST=127.0.0.1

# 启用 HTTPS（生产环境）
export ENABLE_HTTPS=true
export SSL_CERT_PATH=/path/to/cert.pem
export SSL_KEY_PATH=/path/to/key.pem
```

### 3. 日志管理

```bash
# 设置日志级别
export LOG_LEVEL=warn

# 启用日志轮转
export ENABLE_FILE_LOGGING=true
export LOG_FILE=./logs/proxy.log
```

## 🛠️ 故障排除

### 常见问题

#### 1. 代理连接失败

```bash
# 检查代理配置
curl -s http://localhost:8080/health | jq '.proxy'

# 查看详细日志
export LOG_LEVEL=debug && npm start
```

#### 2. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :8080

# 更换端口
export PORT=8081 && npm start
```

#### 3. 会话过期

```bash
# 检查会话状态
curl -s http://localhost:8080/stats | jq '.session'

# 手动续期会话
curl -X POST http://localhost:8080/session/renew
```

### 调试模式

```bash
# 启用详细日志
export LOG_LEVEL=debug
export ENABLE_REQUEST_LOGGING=true

# 启动服务
npm start
```

## 📚 高级配置

### 自定义代理提供商

编辑 `config/proxy.json`：

```json
{
  "providers": {
    "custom-provider": {
      "enabled": true,
      "username": "user",
      "password": "pass",
      "endpoint": "proxy.example.com:8080",
      "timeout": 10000,
      "maxRetries": 3
    }
  }
}
```

### 自定义安全策略

编辑 `config/security.json`：

```json
{
  "enableTLSFingerprinting": true,
  "enableHTTP2": true,
  "userAgent": "Mozilla/5.0 (Custom)",
  "timing": {
    "minDelay": 100,
    "maxDelay": 500,
    "requestInterval": 1000
  }
}
```

## 🎯 使用场景

### 场景1：个人开发者

```bash
# 简单启动
git clone https://gitee.com/codeauto/claude_cli.git
cd claude_cli
npm install
npm start

# 设置环境变量
export ANTHROPIC_BASE_URL=http://localhost:8080

# 开始使用 Claude Code
claude "帮我写一个Python脚本"
```

### 场景2：团队协作（VPS/服务器部署）

```bash
# 在 VPS 或服务器上部署
npm install -g claude-residential-proxy-1.0.0.tgz
PORT=8080 BIND_HOST=0.0.0.0 npm start

# 团队成员设置
export ANTHROPIC_BASE_URL=http://your-server-ip:8080
```

### 场景3：持续集成

```yaml
# .github/workflows/claude.yml
- name: Start Claude Proxy
  run: |
    npm install -g claude-residential-proxy-1.0.0.tgz
    npm start &
    
- name: Use Claude Code
  env:
    ANTHROPIC_BASE_URL: http://localhost:8080
  run: |
    claude "Review this code"
```

## 📞 支持

- 📖 **文档**: 查看 `README.md` 获取详细文档
- 🐛 **问题反馈**: 在 [Issues](https://gitee.com/codeauto/claude_cli/issues) 页面报告问题
- 💡 **功能建议**: 欢迎提出新功能建议

## 🔄 更新日志

### v1.0.0 - 2025-06-28

- ✅ 基础代理服务功能
- ✅ 24小时粘性会话
- ✅ TLS指纹伪装
- ✅ 多提供商支持
- ✅ 企业级日志系统
- ✅ 完整测试覆盖
- ✅ SDK 编程接口
- ✅ 智能启动脚本
- ✅ 平台兼容性自动检查
- ✅ 完整的示例配置文件
- ✅ 自动化构建和发布流程

---

*快速开始指南 - Claude Code 住宅代理服务 v1.0.0 (2025-06-28)*

**注意**: 此服务需要有效的住宅代理提供商账户才能正常工作。测试环境下可以使用内置的 `test-provider`。