# Cloudflare WARP + 代理链设置

## 方案概述
通过 WARP 创建双层代理：本地 → WARP → 住宅代理 → Claude API

## 1. 安装 WARP

### macOS
```bash
# 下载并安装 WARP 客户端
brew install --cask cloudflare-warp

# 或从官网下载
# https://1.1.1.1/
```

## 2. 配置 WARP 代理模式

```bash
# 注册设备
warp-cli register

# 设置为代理模式（不是 VPN 模式）
warp-cli mode proxy

# 设置监听端口
warp-cli proxy-port 40000

# 连接
warp-cli connect

# 验证状态
warp-cli status
```

## 3. 修改代理链配置

创建 `config/warp-chain.json`:

```json
{
  "server": {
    "port": 7070,
    "host": "127.0.0.1"
  },
  "warp": {
    "enabled": true,
    "endpoint": "127.0.0.1:40000",
    "protocol": "socks5"
  },
  "providers": {
    "residential-proxy": {
      "enabled": true,
      "endpoint": "92.112.131.84:49722",
      "username": "b0oqXP0D98eepYe",
      "password": "3d3tRPSejR3H6px",
      "chainThrough": "warp"
    }
  }
}
```

## 4. 实现代理链逻辑

```javascript
// src/utils/ProxyChain.js
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class ProxyChain {
  constructor(config) {
    this.warpConfig = config.warp;
    this.proxyConfig = config.providers['residential-proxy'];
  }

  async createChainedAgent() {
    if (this.warpConfig.enabled && this.proxyConfig.chainThrough === 'warp') {
      // 创建 WARP -> 住宅代理 链
      const warpAgent = new SocksProxyAgent(`socks5://${this.warpConfig.endpoint}`);
      
      // 通过 WARP 连接到住宅代理
      return new HttpsProxyAgent({
        proxy: `http://${this.proxyConfig.username}:${this.proxyConfig.password}@${this.proxyConfig.endpoint}`,
        agent: warpAgent
      });
    }
    
    // 直接使用住宅代理
    return new HttpsProxyAgent(
      `http://${this.proxyConfig.username}:${this.proxyConfig.password}@${this.proxyConfig.endpoint}`
    );
  }
}
```

## 优势
1. **双层 IP 隐藏** - 住宅代理只看到 Cloudflare IP
2. **更好的隐私** - Cloudflare 的隐私政策保护
3. **降低检测风险** - Cloudflare IP 信誉良好
4. **全球节点** - 可选择最佳出口位置

## 注意事项
- WARP 免费版有流量限制
- 可能增加延迟（多一跳）
- 需要 WARP+ 订阅获得更好性能