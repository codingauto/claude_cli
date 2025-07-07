# Claude 住宅代理服务 - 优化与安全加固指南

## 1. 文档目的

本文档旨在基于近期进行的安全审计，为 `claude-residential-proxy` 项目提供一套详细的、按优先级排序的优化与安全加固方案。核心目标是**显著提升代理的隐蔽性，降低被目标服务（Anthropic）检测到的风险**，同时保证系统的稳定性和安全性。

请工程师严格按照优先级顺序进行开发，优先解决“高优先级”问题，因为它们是当前最主要的检测风险点。

---

## 2. 高优先级改进项 (High Priority)

这些是当前系统最主要的风险点，必须优先解决。

### 2.1. 动态 TLS 指纹伪装

- **风险**: 当前在 `ProxyManager.js` 中使用单一、静态的 TLS 指纹配置。这是非常强烈的代理行为特征，极易被高级风控系统识别。
- **目标**: 模拟来自不同操作系统和浏览器的真实 TLS 握手行为，使每个会话都具有独特的、难以追踪的指纹。
- **实现建议**:
    1.  在 `src/utils/EnhancedSecurity.js` 中，创建一个 TLS 指纹配置池。每个配置对象应包含一套完整的、真实的浏览器 TLS 参数（`ciphers`, `sigalgs`, `supportedGroups` 等）。
        ```javascript
        // src/utils/EnhancedSecurity.js
        this.tlsProfiles = [
          {
            // Chrome 120 on Windows
            name: 'Chrome120-Win',
            ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
            // ... 其他参数
          },
          {
            // Safari 17 on macOS
            name: 'Safari17-macOS',
            ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
            // ... 其他参数
          }
        ];
        
        getTLSConfig() {
          return this.tlsProfiles[Math.floor(Math.random() * this.tlsProfiles.length)];
        }
        ```
    2.  在 `src/managers/ProxyManager.js` 的 `buildProxyConfig` 方法中，为每个新创建的会话随机从上述池中选择一个 TLS 配置来构建 `https-proxy-agent`。

### 2.2. 请求头一致性与动态生成

- **风险**: 当前 `User-Agent` 与 `Sec-CH-UA-*` (Client Hints) 等头部之间可能存在矛盾，这是非常低级的错误，容易被检测。
- **目标**: 确保所有 HTTP 请求头都与一个统一的、真实的浏览器配置文件完全匹配。
- **实现建议**:
    1.  在 `src/utils/EnhancedSecurity.js` 中，将 `User-Agent`、`Sec-CH-UA`、`Sec-CH-UA-Platform` 等强关联的头部信息整合成一个完整的“浏览器配置文件”。
        ```javascript
        // src/utils/EnhancedSecurity.js
        this.browserProfiles = [
          {
            name: 'Chrome120-Win',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
            secChUa: '"Not_A Brand";v="8", "Chromium";v="120", ...',
            secChUaPlatform: '"Windows"'
          },
          // ... 其他配置文件
        ];
        ```
    2.  修改 `generateHeaders` 方法，使其首先随机选择一个完整的浏览器配置文件，然后基于该文件生成所有相关的请求头，确保内部一致性。

### 2.4. DNS 请求代理

- **风险**: 系统级的 DNS 查询会绕过代理，直接暴露本机的真实 IP，导致 DNS 泄露，使得所有代理努力付诸东流。
- **目标**: 确保所有出站请求（包括健康检查、IP信誉检查等）的 DNS 解析也必须通过住宅代理进行。
- **实现建议**:
    1.  `https-proxy-agent` 默认会代理 DNS 请求，但需要确保项目中的**所有**网络请求都使用了它。
    2.  重点检查 `src/utils/IPReputationChecker.js` 和 `src/managers/ProxyManager.js` 中的 `axios` 调用。
    3.  在 `testProxyConnection` 和 `checkIPQuality` 等函数中，所有 `axios.get` 或 `axios.post` 都必须明确配置 `httpsAgent` 和 `httpAgent`，使其流量通过代理发出。
        ```javascript
        // 示例: IPReputationChecker.js
        const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
          httpsAgent: this.proxyAgent, // 必须传入代理 agent
          timeout: 5000
        });
        ```

### 2.5. 引入“噪音”背景流量

- **风险**: 当前代理的流量中只包含对 Claude API 的请求，模式单一，非常容易通过流量分析被识别为自动化工具。
- **目标**: 模拟真实用户在浏览网页时产生的、访问其他网站的背景流量，以混淆代理流量特征。
- **实现建议**:
    1.  创建一个新的管理器 `src/managers/NoiseManager.js`。
    2.  该管理器在后台以非常低的、完全随机的频率（例如，5到15分钟之间）向一些全球常见的域名（如 `google-analytics.com`, `doubleclick.net`, `gstatic.com`, `cdn.jsdelivr.net` 等）发送 `HEAD` 或 `GET` 请求。
    3.  **关键**: 这些噪音请求也必须通过当前活跃的住宅代理会话发出。
    4.  在 `src/index.js` 的 `main` 函数中初始化并启动 `NoiseManager`。

---

## 3. 中等优先级改进项 (Medium Priority)

完成高优先级任务后，请处理以下问题以进一步加固系统。

### 3.1. 更自然的请求间隔与会话模式

- **风险**: 纯粹基于数学模型的请求间隔（即使是随机的）在长时间观察下也可能暴露其非人类的模式。
- **目标**: 模拟人类使用产品时的“活跃-思考-空闲”行为模式。
- **实现建议**:
    1.  在 `EnhancedSecurity.js` 中引入一个简单的状态机，包含 `ACTIVE` (请求间隔短)、`THINKING` (间隔中等)、`IDLE` (间隔长) 等状态。
    2.  系统根据随机算法在这些状态间转换，并让 `getRequestInterval` 方法根据当前状态返回一个更符合该状态的延迟时间。

### 3.2. 基于地理位置的时区与语言

- **风险**: 请求头中的 `Accept-Language` 和时区信息与代理 IP 的实际地理位置不符，是常见的检测点。
- **目标**: 确保语言、时区等信息与代理 IP 的国家/地区严格匹配。
- **实现建议**:
    1.  在 `ProxyManager.js` 的 `testProxyConnection` 中，从 `ipinfo.io` 的响应里解析出国家代码 (e.g., 'US', 'JP')。
    2.  将此国家代码作为参数，传递给 `EnhancedSecurity.js` 的 `generateHeaders` 方法。
    3.  `generateHeaders` 方法内部根据传入的国家代码，选择与之匹配的 `Accept-Language` 和 `timezones`。

### 3.3. 日志脱敏处理

- **风险**: 当前日志可能记录了完整的 IP 地址、部分代理凭据或其他敏感信息，存在安全风险。
- **目标**: 在记录日志前，对所有敏感数据进行屏蔽或移除。
- **实现建议**:
    1.  在 `src/utils/logger.js` 中创建一个统一的脱敏函数。
    2.  该函数使用正则表达式或字符串替换，将 IP 地址替换为 `[REDACTED_IP]`，将用户名/密码等替换为 `[REDACTED]`。
    3.  在调用 `logger.info`, `logger.error` 等方法时，先将包含敏感数据的对象或消息传递给此脱敏函数进行处理。

---

## 4. 低优先级改进项 (Low Priority)

这些是锦上添花的改进，可以在核心风险解决后考虑。

### 4.1. 更隐蔽的健康检查

- **风险**: 对单一、固定的测试目标 (`httpbin.org`) 的周期性请求，本身就是一种可被识别的模式。
- **目标**: 使健康检查的流量看起来像是用户在正常浏览网页。
- **实现建议**:
    1.  在 `ProxyManager.js` 中，维护一个包含多个常见、高流量网站（如 `google.com`, `wikipedia.org`, `weather.com`）的列表。
    2.  每次执行健康检查时，随机从此列表中选择一个目标网站，并请求其主页。

### 4.2. 会话预热与冷却

- **风险**: 一个全新的代理会话（新IP）立即开始高强度、有规律的 API 请求，这种行为模式很突兀。
- **目标**: 使会话的生命周期更平滑，更符合人类的使用习惯。
- **实现建议**:
    - **预热 (Warm-up)**: 在 `ProxyManager.js` 的 `createSession` 成功后，不要立即将其投入使用。先通过该会话向 1-2 个良性网站（如 Google）发送请求，等待几秒钟后，再开始代理 Claude API 的流量。
    - **冷却 (Cool-down)**: (可选，实现更复杂) 监控会话的剩余有效时间，在即将到期前的几分钟内，逐渐降低允许的请求频率。

---

## 5. 总结

请严格按照本文档的优先级顺序进行开发。完成所有**高优先级**项目后，系统的隐蔽性和安全性将得到质的提升。中、低优先级项目则能在此基础上进一步巩固和完善，使整个系统更加健壮和难以被检测。
