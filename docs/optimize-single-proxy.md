# 单个高质量代理优化方案

## 核心原则
- 保持稳定的单一 IP 连接
- 模拟真实用户的使用模式
- 最小化特征暴露

## 1. 请求模式优化

### 避免机器人特征
```javascript
// src/utils/RequestOptimizer.js
class RequestOptimizer {
  constructor() {
    this.lastRequestTime = 0;
    this.requestHistory = [];
  }

  async optimizeRequest(request) {
    // 1. 动态请求间隔（避免固定频率）
    const minInterval = 2000;  // 最少2秒
    const variance = Math.random() * 3000;  // 0-3秒随机
    const interval = minInterval + variance;
    
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < interval) {
      await new Promise(resolve => 
        setTimeout(resolve, interval - timeSinceLastRequest)
      );
    }
    
    // 2. 模拟工作时间模式
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      // 深夜降低频率
      await new Promise(resolve => 
        setTimeout(resolve, 5000 + Math.random() * 10000)
      );
    }
    
    // 3. 累积使用模式
    this.recordRequest(request);
    
    this.lastRequestTime = Date.now();
  }
  
  recordRequest(request) {
    this.requestHistory.push({
      timestamp: Date.now(),
      type: request.path.includes('messages') ? 'message' : 'other'
    });
    
    // 只保留最近1小时的记录
    const oneHourAgo = Date.now() - 3600000;
    this.requestHistory = this.requestHistory.filter(
      r => r.timestamp > oneHourAgo
    );
  }
}
```

## 2. 会话管理优化

### 保持自然的会话模式
```javascript
// 配置建议
{
  "session": {
    // 模拟真实工作时长
    "maxDuration": 28800000,  // 8小时
    "idleTimeout": 1800000,   // 30分钟无活动断开
    
    // 休息模式
    "breakInterval": 7200000,  // 每2小时
    "breakDuration": 600000    // 休息10分钟
  }
}
```

## 3. 连接稳定性优化

### 自动重连机制
```javascript
class ConnectionManager {
  async maintainConnection() {
    // 检测连接健康
    if (!this.isHealthy()) {
      // 等待随机时间后重连（避免立即重连）
      const delay = 30000 + Math.random() * 60000;  // 30-90秒
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await this.reconnect();
    }
  }
}
```

## 4. 高质量代理检查清单

购买代理时确认以下特性：

### 必需特性
- ✅ **真实住宅 IP**（非数据中心）
- ✅ **24小时+ Sticky Session**
- ✅ **支持 HTTP/2**
- ✅ **无限带宽**（或足够大）
- ✅ **低延迟**（< 500ms）

### 推荐特性
- ✅ **IP 历史干净**（无滥用记录）
- ✅ **支持选择地区**（选择美国/欧洲）
- ✅ **99%+ 正常运行时间**
- ✅ **提供多个备用端口**

## 5. 推荐的代理服务商

### 高端选择（$50-200/月）
1. **Bright Data (Luminati)**
   - 业界领先，IP 质量最高
   - 7200万+ 住宅 IP
   - 完美的 Sticky Session

2. **Oxylabs**
   - 企业级服务
   - 1亿+ 住宅 IP
   - 优秀的技术支持

3. **SmartProxy**
   - 性价比高
   - 4000万+ 住宅 IP
   - 简单易用

### 中端选择（$20-50/月）
1. **IPRoyal**
   - 真实住宅 IP
   - 支持长时间 Session
   - 价格合理

2. **Proxy-Cheap**
   - 600万+ 住宅 IP
   - 支持 Sticky Session
   - 适合个人使用

## 6. 配置示例

更新您的 proxy.json：
```json
{
  "server": {
    "port": 7070,
    "host": "127.0.0.1"
  },
  "providers": {
    "high-quality-residential": {
      "enabled": true,
      "endpoint": "your.premium.proxy:port",
      "username": "your-username",
      "password": "your-password",
      "type": "sticky-residential",
      "sessionDuration": 86400000,
      "location": "US"
    }
  },
  "optimization": {
    "humanBehavior": true,
    "adaptiveDelays": true,
    "workingHours": {
      "enabled": true,
      "timezone": "America/New_York",
      "start": 9,
      "end": 18
    }
  }
}
```

## 7. 监控建议

定期检查：
1. IP 评分保持 70+ 
2. 连接稳定性 > 99%
3. 平均延迟 < 500ms
4. 无异常断连

## 总结

对于 Claude Code 使用：
- **一个高质量代理 > 多个普通代理**
- **稳定性 > 数量**
- **自然使用模式 > 高频切换**

投资一个好的住宅代理服务，配合适当的使用模式优化，比复杂的多代理系统更可靠。