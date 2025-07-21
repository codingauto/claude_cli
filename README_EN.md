# Claude Code Residential Proxy Service

> Stable residential IP proxy for Claude Code • 24-hour sticky sessions • Auto anti-detection • Ready to use
>
> [![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) ![node](https://img.shields.io/badge/node-%3E=18.0-blue) ![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**Language**: [中文](README.md) | **English**

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

**Claude Code Residential Proxy Service** is a professional local proxy tool specifically designed to solve Claude Code's access control issues.

## 🎯 Why Do You Need This Project?

### Core Problem: Anthropic's Strict Access Control

Many people ask: Why not use VPN directly? Why not install Claude Code on a server? Why not use software router solutions?

**Truth: Many solutions work, but they suit different scenarios**

| Common Solutions | Issues | Our Solution |
|------------------|--------|--------------|
| **Regular VPN** | IPs marked as VPN, easily trigger controls | Use clean residential IPs, simulate real users |
| **Server Claude Code** | Data center IPs, easily detected and blocked | 24-hour fixed residential IP, avoid detection |
| **Router Solutions** | Complex configuration, no IP quality guarantee | Ready to use, verified IP purity |
| **Public Proxies** | Shared by many users, easily contaminated | Independent proxy channels, stable and reliable |

### 🔥 Differentiated Value of This Project

#### 1. **Team Collaboration Optimization**
- 👥 **One account, multiple users** - The biggest highlight, no need for individual purchases
- 🌐 **Unified IP management** - All team members use the same IP for consistency
- 📋 **Centralized management** - Configure once, everyone benefits

#### 2. **Professional Configuration**
- 🛡️ **Deep disguise** - Not just IP change, but real browser behavior simulation
- 🔍 **IP quality assurance** - Built-in detection tools ensure high-quality IP usage
- 📊 **Monitoring and logging** - Detailed usage data and problem diagnosis

> 💡 **Premium Choice**: If budget allows, IEPL dedicated line + this project is the strongest combination. Dedicated lines provide maximum security (no public network), this project provides team collaboration and fine-grained management.

#### 3. **User-Friendly Features**
- 🚀 **Ready to use** - No complex configuration, suitable for non-technical users
- 💰 **Cost transparency** - Clear pricing and cost-sharing mechanisms
- 🛠️ **Technical support** - Get help when problems arise

### 💡 Objective Comparison with Other Solutions

> **Truth**: Many solutions work, the key is fitting different use scenarios. Here's an honest comparison:

| Feature | Premium VPN | IEPL Line | Server Deploy | Router | This Project |
|---------|-------------|-----------|---------------|--------|--------------|
| **Feasibility** | ✅ **Fully viable** | ✅ **Fully viable** | ✅ **Fully viable** | ✅ **Fully viable** | ✅ **Fully viable** |
| **Security** | ✅ High | ✅ **Highest** | ⚠️ Medium | 🎲 Depends | ✅ High |
| **IP Quality** | ✅ Good (residential) | ✅ **Excellent** (no public network) | ⚠️ Medium (data center) | 🎲 Luck-based | ✅ High (professional residential) |
| **Personal Use** | ✅ **Best choice** | 💰 High cost | ✅ Suitable | ⚠️ Too complex | ⚠️ High cost |
| **Team Sharing** | ⚠️ Need multiple accounts | ✅ **Can share costs** | ⚠️ Need multiple deployments | ⚠️ Complex management | ✅ **Native support** |
| **Cost** | Medium (personal) | High (shareable) | Low (personal) | High (hardware) | Low (shared) |
| **Management Complexity** | Low | Low | Medium | High | Low |
| **Control Resistance** | Medium | ✅ **Strongest** | Low | Medium | High |

### 💬 Real Situation Analysis

**You're right:**
- Claude probably doesn't spend much effort on account banning
- Simple IP-based judgment might be the main approach
- **Premium residential VPN can indeed solve the problem**
- **IEPL dedicated line is the safest choice** (no public network, lowest control risk)

#### 💸 IEPL Dedicated Line Explained

**What is IEPL?**
- **International Ethernet Private Line**
- Direct connection between domestic and overseas, no public internet
- Extremely low control risk, but higher price

**IEPL Advantages:**
- ✅ **Highest security** - No public network, nearly impossible to detect
- ✅ **Stable speed** - Dedicated line, unaffected by public network congestion
- ✅ **Cost sharing** - Multiple users share costs, lower barrier
- ⚠️ **IP changes** - IP may change periodically, but security remains high

**Why still use this project?**

#### For Individual Users:
- ✅ **Use good residential VPN directly** (like NordVPN, ExpressVPN residential lines)
- ⚠️ This project might be over-engineered for individuals

#### For Teams/Companies:
- ✅ **Multiple users share one account** — The biggest value
- ✅ **Unified IP management** — Everyone through same proxy
- ✅ **Cost control** — No need to buy VPN for everyone
- ✅ **Customized configuration** — Adjust according to team needs

#### For Advanced Users:
- ✅ **Precise control** — User-Agent, fingerprints, timing, etc.
- ✅ **Multi-proxy rotation** — Risk distribution and load balancing
- ✅ **Monitoring and logging** — Detailed usage data and problem diagnosis

### 🎯 Selection Recommendations

| Your Situation | Recommended Solution | Reason |
|-----------------|---------------------|--------|
| **Individual Developer** | Premium residential VPN | Simple and direct, cost-effective |
| **Well-funded Individual** | IEPL dedicated line | Highest security, no public network |
| **Small Team (2-5 people)** | This project or IEPL sharing | Shared costs, simple management |
| **Medium-large Team (5+ people)** | This project | Unified management, clear cost advantage |
| **Tech Enthusiast** | Router solution | Full control, highest cost-effectiveness |
| **Enterprise User** | IEPL dedicated line or this project | Stability, security, compliance |
| **Extremely Cautious User** | IEPL dedicated line | Dedicated connection, lowest control risk |

### 🎯 Target User Scenarios

#### Scenario 1: Development Team Collaboration
```bash
# Team of 5, only need 1 Claude account + 1 proxy service
# Everyone sets the same proxy, shares account usage
export ANTHROPIC_BASE_URL=http://your-proxy:8080
claude "Help me write this feature"
```

#### Scenario 2: Multi-project Parallel Development
```bash
# Use Claude Code in multiple projects simultaneously
# Maintain IP consistency through proxy, avoid account controls
cd project-a && claude "Optimize this module"
cd project-b && claude "Fix this bug"
```

#### Scenario 3: Long-term Stable Usage
```bash
# 24-hour fixed IP, build good usage history
# Avoid triggering Anthropic's control system due to IP changes
claude "Continue yesterday's development task today"
```

## 🌟 Importance of Claude Code

**Claude Code has become a rising star in the programming world**. This CLI tool launched by Anthropic is completely changing how programmers code:

- 🎯 **Vibe Coder's choice** — AI-assisted programming through command line becomes new trend
- ⚡ **Brand new programming experience** — Not just Claude model's power, CLI approach makes coding more intuitive and efficient
- 🔥 **Developer favorite** — From code generation to problem solving, Claude Code is reshaping development workflows

**However, Anthropic's strict access control is the biggest obstacle**:

As we all know, Anthropic implements strict access restrictions for Chinese users, preventing many developers from experiencing this revolutionary tool. Under modern control mechanisms, stable Claude Code usage faces core challenges:

1. **IP Detection** — Using "dirty" IPs, VPN IPs, or data center IPs are easily identified and blocked
2. **Behavior Patterns** — Frequent IP changes, machine-like request patterns easily trigger controls
3. **Device Fingerprints** — Request characteristics don't match real user behavior

**This tool focuses on solving these technical challenges**, allowing you to:
- ✅ Use clean residential IP addresses, avoid VPN detection
- ✅ Maintain 24-hour fixed IP, establish stable usage patterns
- ✅ Simulate real browser fingerprints, pass behavior detection
- ✅ Multiple users share same proxy, reduce usage costs

> 💡 **Complete Solution**: This tool solves IP and fingerprint issues. For payment issues, please refer to the payment solution description below.

## 💳 Payment Solution Guide

After solving IP issues, you still need a valid payment method to subscribe to Claude Code.

### 🎯 Recommended Solutions

| Payment Method | Target Users | Rating | Description |
|----------------|--------------|--------|-------------|
| **Google Play Gift Card** | Android users | ⭐⭐⭐⭐⭐ | Simplest, supports Alipay purchase |
| **App Store Gift Card** | iPhone users | ⭐⭐⭐⭐⭐ | Simplest, supports Alipay purchase |
| **PokePay U-Card** | Regular users | ⭐⭐⭐⭐ | Supports Alipay, [Official Website](https://pokepay.cc) |
| **51VCard U-Card** | Regular users | ⭐⭐⭐⭐ | Virtual card platform, [Official Website](https://51vcard.com) |
| **Depay** | Experienced users | ⭐⭐⭐ | Earlier virtual card platform |
| **Overseas Company Card** | Enterprise users | ⭐⭐⭐⭐⭐ | Most stable, suitable for enterprises |
| **US Bank Card** | Premium users | ⭐⭐⭐⭐⭐ | Most stable, but high barrier |

> 💡 **Note**: Payment issues are not the focus of this project, which mainly solves IP and proxy issues. Please choose specific payment methods according to your situation.

## 🤔 Technical Details: Why Don't Regular Solutions Work?

If you encounter the following issues when using Claude Code:

- **Network restrictions** — Certain regions cannot directly access Claude Code
- **IP limitations** — Data center IPs or frequently changing proxy IPs are easily identified and restricted
- **Unstable connections** — Network fluctuations cause Claude Code call failures
- **Control issues** — Frequent IP changes trigger security detection

This project solves these problems through "**local proxy + fixed residential IP**" approach:

- 🚀 **Stable access**: Use real residential IP, avoid data center IP restrictions
- 🛡️ **Low risk**: 24-hour fixed IP, avoid frequent switching triggering controls
- 🔒 **Privacy security**: Proxy runs locally, data doesn't go through third parties
- 🤖 **Zero configuration**: Set environment variables, no need to modify existing code

## 📋 System Architecture

```mermaid
graph LR
    A[Claude Code] --> B[Local Proxy Service<br/>localhost:8080]
    B --> C[Residential Proxy Provider<br/>Fixed Residential IP]
    C --> D[Claude API<br/>api.anthropic.com]
    
    style B fill:#e3f2fd
    style C fill:#e8f5e8
```

Workflow:

1. Claude Code sends request to local proxy (localhost:8080)
2. Local proxy forwards request through residential IP proxy
3. Residential proxy uses fixed residential IP to access Claude API
4. Response returns via original path

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| **Residential IP Proxy** | Use real residential IP, avoid data center IP restrictions |
| **24-hour Sticky Sessions** | Fixed IP connection, automatically maintain session state |
| **Multi-provider Support** | Support LumiProxy, Oxylabs, Bright Data, etc. |
| **Auto Failover** | Smart switching to backup proxies, ensure service stability |
| **TLS Fingerprint Disguise** | Simulate real browser requests, avoid detection |
| **Zero Configuration Startup** | One-click startup, automatically handle all configurations |
| **Real-time Monitoring** | Health checks, statistics, logging |
| **SDK Support** | Provide programming interface, easy integration into existing projects |

## 🚀 Quick Start

### Install Node.js

If your system doesn't have Node.js, please install first:

**macOS/Linux:**

```bash
# Use Homebrew (recommended)
brew install node

# Or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

**Windows:**

```powershell
# Use Chocolatey
choco install nodejs

# Or download installer directly
# https://nodejs.org/
```

Verify installation:

```bash
node --version  # Should show v18.0.0 or higher
npm --version
```

### Install Claude Code

**If you already have Claude Code installed, you can skip this step.**

Claude Code is Anthropic's official CLI tool for interacting with Claude API:

```bash
npm install -g @anthropics/claude-code
```

> **Note**: If you encounter network issues installing Claude Code in your region, try using a different npm registry:
> 
> ```bash
> npm install -g @anthropics/claude-code --registry=https://registry.npmmirror.com
> ```

Verify installation:

```bash
claude --version
```

### Install Proxy Service

**Method 1: Download from Gitee Releases (Recommended)**

Visit [Gitee Releases page](https://gitee.com/codeauto/claude_cli/releases) to download the corresponding platform package:

```bash
# Download and install (Linux example)
wget https://gitee.com/codeauto/claude_cli/releases/download/v1.0.0/claude-residential-proxy-1.0.0.tgz
npm install -g claude-residential-proxy-1.0.0.tgz
```

**Method 2: Install from Source**

```bash
# Clone repository
git clone https://gitee.com/codeauto/claude_cli.git
cd claude_cli

# Install dependencies
npm install

# Build release package
npm run build:release

# Install globally
npm install -g dist/claude-residential-proxy-1.0.0.tgz
```

**Method 3: Development Mode**

```bash
git clone https://gitee.com/codeauto/claude_cli.git
cd claude_cli
npm install
npm start
```

### Configure Proxy Service

1. **Configure Proxy Provider**

Edit `config/proxy.json`:
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

2. **Start Proxy Service**

```bash
# If globally installed package, can use npm script to start
npm start

# Or source mode
npm start
```

Service will start at `http://localhost:8080`.

3. **Configure Claude Code**

Set environment variable:
```bash
export ANTHROPIC_BASE_URL=http://localhost:8080
```

Or specify each time:
```bash
ANTHROPIC_BASE_URL=http://localhost:8080 claude "Hello"
```

## 🎯 Complete Usage Flow

### First Time Use (Complete Flow)

```bash
# 1. Install Node.js (if not installed)
brew install node  # macOS
# Or visit https://nodejs.org/ to download installer

# 2. Install Claude Code (if not installed)
npm install -g @anthropics/claude-code

# 3. Install proxy service
wget https://gitee.com/codeauto/claude_cli/releases/download/v1.0.0/claude-residential-proxy-1.0.0.tgz
npm install -g claude-residential-proxy-1.0.0.tgz

# 4. Configure proxy service
# Edit config/proxy.json to add your proxy provider information

# 5. Start proxy service
npm start
# Service will start at http://localhost:8080

# 6. Set environment variable
export ANTHROPIC_BASE_URL=http://localhost:8080

# 7. Start using
claude "Hello, help me write a Python script"
```

### Daily Use (Already Installed)

```bash
# 1. Start proxy service
npm start

# 2. Set environment variable (or add to .bashrc/.zshrc)
export ANTHROPIC_BASE_URL=http://localhost:8080

# 3. Use Claude Code
claude "Help me explain this code"
claude -p "What does this function do?" < my_script.py
cat README.md | claude -p "Summarize this project"
```

## ✅ Deployment Verification and Testing

### 1. Check Proxy Service Status

```bash
# Check proxy service health status
curl http://localhost:8080/health
```

Expected response:
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

### 2. Check Current IP Address

**Through browser (recommended):**
- Open browser and visit: http://localhost:8080/ip
- Or visit: http://localhost:8080/status

**Through command line:**
```bash
# Check current IP address in use
curl http://localhost:8080/ip

# Or use external service detection
curl --proxy http://localhost:8080 http://httpbin.org/ip
curl --proxy http://localhost:8080 https://api.ipify.org?format=json
curl --proxy http://localhost:8080 https://ipinfo.io/json
```

### 3. Verify Proxy Connectivity

**Method 1: Direct test**
```bash
# Test if proxy can access external network
curl --proxy http://localhost:8080 https://www.google.com -I

# Test Claude API access
curl --proxy http://localhost:8080 https://api.anthropic.com -I
```

**Method 2: Use detection websites**

Visit the following URLs in browser to check IP and network status:

- **IP Address Detection**: 
  - [https://whatismyipaddress.com/](https://whatismyipaddress.com/)
  - [https://www.whatsmyip.org/](https://www.whatsmyip.org/)
  - [https://ipinfo.io/](https://ipinfo.io/)

- **IP Purity Detection (Important)**:
  - [https://scamalytics.com/](https://scamalytics.com/) - Check IP risk score
  - [https://whatismyipaddress.com/blacklist-check](https://whatismyipaddress.com/blacklist-check) - Blacklist check
  - [https://www.abuseipdb.com/](https://www.abuseipdb.com/) - IP abuse database check
  - [https://fraudguard.io/](https://fraudguard.io/) - Fraud detection

- **Network Connectivity Detection**:
  - [https://www.speedtest.net/](https://www.speedtest.net/)
  - [https://fast.com/](https://fast.com/)

### 4. Test Claude Code Connection

```bash
# Set proxy environment variable
export ANTHROPIC_BASE_URL=http://localhost:8080

# Test if Claude Code works normally
claude "Please say 'Connection successful'"

# If successful, will return Claude's reply: "Connection successful"
```

### 5. View Detailed Status

```bash
# View proxy statistics
curl http://localhost:8080/stats

# View proxy logs
tail -f logs/proxy-$(date +%Y-%m-%d).log

# Check error logs
tail -f logs/proxy-error-$(date +%Y-%m-%d).log
```

### 🚨 Troubleshooting

If you encounter problems, check following steps:

#### 1. Service Cannot Start
```bash
# Check if port is occupied
lsof -i :8080

# View error logs
npm start 2>&1 | tee startup.log
```

#### 2. Proxy Connection Failed
```bash
# Check proxy configuration
cat config/proxy.json

# Test proxy provider connection
curl -x http://username:password@proxy-host:port http://httpbin.org/ip
```

#### 3. Claude Code Cannot Connect
```bash
# Check environment variable
echo $ANTHROPIC_BASE_URL

# Check Claude Code version
claude --version

# Reset and retry
unset ANTHROPIC_BASE_URL
export ANTHROPIC_BASE_URL=http://localhost:8080
claude "Test connection"
```

## 🛠️ Configuration

### Proxy Configuration (config/proxy.json)

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

### Security Configuration (config/security.json)

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

## 📊 Monitoring and Management

### Health Check

```bash
curl http://localhost:8080/health
```

Response example:
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

### Statistics

```bash
curl http://localhost:8080/stats
```

### Log Viewing

```bash
# Real-time logs
tail -f logs/proxy-$(date +%Y-%m-%d).log

# Error logs
tail -f logs/proxy-error-$(date +%Y-%m-%d).log
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Category tests
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests

# Test coverage
npm run test:coverage
```

## 🖥️ Server/VPS Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start scripts/start-proxy.js --name claude-proxy

# View status
pm2 status

# View logs
pm2 logs claude-proxy
```

### Using Docker

```bash
# Build image
docker build -t claude-proxy .

# Run container
docker run -d \
  --name claude-proxy \
  -p 8080:8080 \
  -v $(pwd)/config:/app/config \
  claude-proxy
```

### Using systemd

```bash
# Copy service file
sudo cp scripts/claude-proxy.service /etc/systemd/system/

# Start service
sudo systemctl enable claude-proxy
sudo systemctl start claude-proxy
```

## 🔧 Troubleshooting

### Common Issues

1. **Proxy Connection Failed**
   ```bash
   # Check proxy configuration
   curl -s http://localhost:8080/health | jq '.proxy'
   
   # Test proxy connection
   curl -x http://username:password@proxy-endpoint:port http://httpbin.org/ip
   ```

2. **Port Occupied**
   ```bash
   # Find occupying process
   lsof -i :8080
   
   # Change port
   PORT=8081 npm start
   ```

3. **Claude Code Cannot Connect**
   ```bash
   # Check environment variable
   echo $ANTHROPIC_BASE_URL
   
   # Test proxy service
   curl http://localhost:8080/health
   ```

### Debug Mode

```bash
# Enable verbose logging
DEBUG_PROXY=1 npm start

# Or use debug script
npm run debug
```

## 🤝 Contributing

1. Fork this repository
2. Create feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open Pull Request

## 📜 License

This project is open source under [MIT License](LICENSE).

## 🛣️ Roadmap

### Current Version (v1.0)
- [x] Basic proxy service functionality
- [x] 24-hour sticky sessions
- [x] TLS fingerprint disguise
- [x] Multi-provider support
- [x] IP purity detection

### 🆕 v1.0 Version Optimization

This version has comprehensive optimization and enhancement based on the original, main improvements include:

#### 📌 Code Quality Improvement
- **Fixed async constructor issues** - ProxyManager now uses static factory method, eliminates potential race conditions
- **Simplified configuration loading** - Unified configuration format, removed compatibility code, improved maintainability
- **Improved error handling** - Unhandled Promise rejections now trigger graceful shutdown
- **Refactored middleware** - Authentication and session management separated into independent middleware, clearer responsibilities

#### 📌 Comprehensive Security Hardening
- **DNS leak protection** - All network requests (including health checks) now go through proxy, prevent real IP exposure
- **Dynamic TLS fingerprints** - Implemented 5 browser TLS configuration pools, random selection per session, avoid fingerprint recognition
- **Browser consistency** - User-Agent, Client Hints, Accept headers completely matched, eliminate fingerprint conflicts
- **Background noise traffic** - Added NoiseManager, generates random website visits, avoid single API traffic patterns

#### 📌 Advanced Feature Implementation
- **18-30 hour random sessions** - Session duration randomization, closer to real user behavior
- **Human behavior simulation** - Added BehaviorManager, implements ACTIVE/THINKING/IDLE state machine
- **Geographic location matching** - Added GeoMatcher, automatically matches proxy location language and timezone
- **Tiered health checks** - Lightweight checks separated from heavyweight checks, reduce unnecessary API calls

#### 📌 Testing and Stability
- **Complete test suite** - Added unit tests, integration tests, performance tests, 95%+ coverage
- **Circuit breaker mechanism** - Automatic cooldown when all proxies fail, avoid resource exhaustion
- **Log desensitization** - Automatically hide sensitive information like IPs, passwords
- **Configuration validation** - Automatic configuration integrity validation at startup

#### 📌 User Experience Optimization
- **macOS app support** - Provide native .app package, double-click to start
- **Configuration externalization** - Browser fingerprints, TLS configuration moved to `config/fingerprints.json`
- **Detailed documentation** - Added architecture docs, test reports, optimization guides, etc.

These optimizations make the proxy service more stable, secure, and harder to detect, while maintaining ease of use.

### Near-term Plans (v1.x)
- [ ] Web management interface
- [ ] More proxy provider support
- [ ] Auto configuration wizard
- [ ] Performance optimization and caching
- [ ] Kubernetes support

### 🚀 Future Vision (v2.0)
- [ ] **Multi-client multi-IP architecture** - One task, one proxy, one IP
- [ ] **Smart load balancing** - Automatically assign optimal proxy resources
- [ ] **Multi-account parallel work** - Use multiple Claude accounts simultaneously
- [ ] **Dynamic session management** - Dynamically create proxies based on demand

> 📖 **Learn more about future plans**: Check [FUTURE_VISION.md](FUTURE_VISION.md) for complete future architecture design and implementation roadmap

## 💬 Support

- 📖 **Documentation**: Check [QUICK_START.md](QUICK_START.md) for detailed usage guide
- 🐛 **Issue Reports**: Report issues on [Issues](https://gitee.com/codeauto/claude_cli/issues) page
- 💡 **Feature Suggestions**: Welcome new feature suggestions

## 🙏 Acknowledgments

Special thanks to [shiyongyin](https://gitee.com/shiyongyin) for contributions and support in functionality enhancements!

---

**Make Claude API access more stable!** 🚀