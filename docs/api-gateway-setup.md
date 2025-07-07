# API 网关部署方案

## 方案对比

### A. Cloudflare Workers（推荐）
- **优势**：免费额度高、部署简单、全球节点、IP 信誉极佳
- **限制**：每日 100,000 请求免费

### B. AWS API Gateway + Lambda
- **优势**：AWS IP 信誉好、可扩展性强
- **成本**：按请求计费，约 $3.5/百万请求

## Cloudflare Workers 实现

### 1. 创建 Worker 脚本

创建 `cloudflare-worker.js`:

```javascript
export default {
  async fetch(request, env) {
    // 验证请求来源
    const authHeader = request.headers.get('X-Proxy-Auth');
    if (authHeader !== env.PROXY_AUTH_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 提取真实的 Authorization
    const realAuth = request.headers.get('X-Real-Authorization');
    if (!realAuth) {
      return new Response('Missing Authorization', { status: 400 });
    }

    // 构建目标 URL
    const url = new URL(request.url);
    url.hostname = 'api.anthropic.com';
    url.protocol = 'https:';

    // 创建新请求
    const headers = new Headers(request.headers);
    headers.delete('X-Proxy-Auth');
    headers.delete('X-Real-Authorization');
    headers.set('Authorization', realAuth);
    
    // 设置合理的请求头
    headers.set('User-Agent', 'Anthropic-SDK/1.0');
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow'
    });

    // 转发请求
    try {
      const response = await fetch(modifiedRequest);
      
      // 复制响应头
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('X-Worker-Region', request.cf?.colo || 'unknown');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Gateway error', 
        message: error.message 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
```

### 2. 部署到 Cloudflare

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建项目
wrangler init claude-gateway

# 配置 wrangler.toml
cat > wrangler.toml << EOF
name = "claude-gateway"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
PROXY_AUTH_KEY = "your-secret-key-here"
EOF

# 部署
wrangler deploy
```

### 3. 修改本地代理配置

```javascript
// src/config/gateway.js
export const gatewayConfig = {
  // Cloudflare Worker URL
  endpoint: 'https://claude-gateway.your-subdomain.workers.dev',
  authKey: 'your-secret-key-here',
  
  // 请求配置
  requestConfig: {
    headers: {
      'X-Proxy-Auth': 'your-secret-key-here'
    },
    timeout: 30000
  }
};
```

### 4. 更新代理管理器

```javascript
// src/managers/GatewayProxyManager.js
import axios from 'axios';

export class GatewayProxyManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  async proxyRequest(originalRequest) {
    const { endpoint, authKey } = this.config;
    
    // 准备网关请求
    const gatewayHeaders = {
      ...originalRequest.headers,
      'X-Proxy-Auth': authKey,
      'X-Real-Authorization': originalRequest.headers['Authorization']
    };
    
    delete gatewayHeaders['Authorization'];
    
    try {
      const response = await axios({
        method: originalRequest.method,
        url: `${endpoint}${originalRequest.path}`,
        headers: gatewayHeaders,
        data: originalRequest.body,
        maxRedirects: 0,
        validateStatus: () => true
      });
      
      this.logger.info('Gateway request successful', {
        status: response.status,
        region: response.headers['x-worker-region']
      });
      
      return response;
    } catch (error) {
      this.logger.error('Gateway request failed', { error: error.message });
      throw error;
    }
  }
}
```

## AWS Lambda 方案

### 1. Lambda 函数代码

```python
import json
import requests
import os

def lambda_handler(event, context):
    # 验证密钥
    auth_key = event['headers'].get('X-Proxy-Auth')
    if auth_key != os.environ['PROXY_AUTH_KEY']:
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    # 获取真实 Authorization
    real_auth = event['headers'].get('X-Real-Authorization')
    if not real_auth:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing Authorization'})
        }
    
    # 构建请求
    url = f"https://api.anthropic.com{event['path']}"
    headers = {
        'Authorization': real_auth,
        'Content-Type': 'application/json',
        'User-Agent': 'Anthropic-SDK/1.0'
    }
    
    # 转发请求
    try:
        response = requests.request(
            method=event['httpMethod'],
            url=url,
            headers=headers,
            data=event.get('body'),
            timeout=30
        )
        
        return {
            'statusCode': response.status_code,
            'headers': dict(response.headers),
            'body': response.text
        }
    except Exception as e:
        return {
            'statusCode': 502,
            'body': json.dumps({'error': str(e)})
        }
```

### 2. 部署配置

```yaml
# serverless.yml
service: claude-gateway

provider:
  name: aws
  runtime: python3.9
  region: us-east-1
  environment:
    PROXY_AUTH_KEY: ${env:PROXY_AUTH_KEY}

functions:
  proxy:
    handler: handler.lambda_handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

## 优势总结

1. **极高的 IP 信誉**
   - Cloudflare/AWS IP 几乎不会被封
   - 被识别为正常的云服务流量

2. **全球分布**
   - 可选择离目标最近的节点
   - 降低延迟

3. **高可用性**
   - 云服务商保证 99.9%+ 可用性
   - 自动故障转移

4. **安全性**
   - 隐藏真实 IP 和代理配置
   - 支持访问控制和速率限制

5. **成本效益**
   - Cloudflare Workers 每日 10 万请求免费
   - AWS Lambda 每月 100 万请求免费

## 注意事项

1. **延迟增加**：多一跳网络延迟
2. **流量限制**：注意免费额度
3. **日志记录**：云服务商可能记录请求
4. **地区限制**：某些地区可能无法访问云服务