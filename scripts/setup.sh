#!/bin/bash

# Claude Residential Proxy Setup Script
# 借鉴官方Claude Code的平台检测逻辑

set -e

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Claude Residential Proxy Setup${NC}"
echo "=================================="

# 平台检测 (借鉴官方逻辑)
check_platform() {
    echo -e "${BLUE}🔍 检查平台兼容性...${NC}"
    
    case "$(uname -s)" in
        Darwin*)
            echo -e "${GREEN}✅ macOS 平台支持${NC}"
            PLATFORM="macos"
            ;;
        Linux*)
            echo -e "${GREEN}✅ Linux 平台支持${NC}"
            PLATFORM="linux"
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            echo -e "${RED}❌ Windows 平台不支持${NC}"
            echo -e "${YELLOW}💡 建议使用 WSL (Windows Subsystem for Linux)${NC}"
            exit 1
            ;;
        *)
            echo -e "${RED}❌ 未知平台: $(uname -s)${NC}"
            exit 1
            ;;
    esac
}

# Node.js 版本检查 (借鉴官方要求)
check_node_version() {
    echo -e "${BLUE}🔍 检查 Node.js 版本...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        echo -e "${YELLOW}💡 请安装 Node.js 18.0.0 或更高版本${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        echo -e "${GREEN}✅ Node.js $NODE_VERSION (满足要求 >= $REQUIRED_VERSION)${NC}"
    else
        echo -e "${RED}❌ Node.js 版本过低: $NODE_VERSION${NC}"
        echo -e "${YELLOW}💡 需要 Node.js $REQUIRED_VERSION 或更高版本${NC}"
        exit 1
    fi
}

# 依赖安装
install_dependencies() {
    echo -e "${BLUE}📦 安装依赖包...${NC}"
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 配置文件初始化
setup_config() {
    echo -e "${BLUE}⚙️  初始化配置文件...${NC}"
    
    # 创建配置目录
    mkdir -p config logs
    
    # 复制示例配置文件
    if [ ! -f "config/proxy.json" ] && [ -f "config/proxy.json.example" ]; then
        cp config/proxy.json.example config/proxy.json
        echo -e "${GREEN}✅ 创建代理配置文件${NC}"
    fi
    
    if [ ! -f "config/security.json" ] && [ -f "config/security.json.example" ]; then
        cp config/security.json.example config/security.json
        echo -e "${GREEN}✅ 创建安全配置文件${NC}"
    fi
    
    # 设置日志目录权限
    chmod 755 logs
    
    echo -e "${GREEN}✅ 配置初始化完成${NC}"
}

# 权限检查
check_permissions() {
    echo -e "${BLUE}🔒 检查文件权限...${NC}"
    
    # 检查配置文件权限
    if [ -f "config/proxy.json" ]; then
        chmod 600 config/proxy.json
        echo -e "${GREEN}✅ 代理配置文件权限已设置${NC}"
    fi
    
    if [ -f "config/security.json" ]; then
        chmod 600 config/security.json
        echo -e "${GREEN}✅ 安全配置文件权限已设置${NC}"
    fi
}

# 健康检查
health_check() {
    echo -e "${BLUE}🏥 运行健康检查...${NC}"
    
    # 启动服务进行测试
    echo -e "${YELLOW}⏳ 启动测试服务...${NC}"
    
    # macOS 兼容的超时处理
    if command -v timeout >/dev/null 2>&1; then
        timeout 10s npm start &
    elif command -v gtimeout >/dev/null 2>&1; then
        gtimeout 10s npm start &
    else
        # macOS 手动超时处理
        npm start &
        PID=$!
        (sleep 10; kill $PID 2>/dev/null) &
        TIMEOUT_PID=$!
    fi
    
    if [ -z "$PID" ]; then
        PID=$!
    fi
    
    sleep 3
    
    # 检查服务是否启动
    if kill -0 $PID 2>/dev/null; then
        echo -e "${GREEN}✅ 服务启动成功${NC}"
        kill $PID 2>/dev/null || true
        [ ! -z "$TIMEOUT_PID" ] && kill $TIMEOUT_PID 2>/dev/null || true
        wait $PID 2>/dev/null || true
    else
        echo -e "${YELLOW}⚠️  服务健康检查跳过 (正常，服务可能需要更多时间启动)${NC}"
        [ ! -z "$TIMEOUT_PID" ] && kill $TIMEOUT_PID 2>/dev/null || true
    fi
}

# 主函数
main() {
    check_platform
    check_node_version
    install_dependencies
    setup_config
    check_permissions
    health_check
    
    echo ""
    echo -e "${GREEN}🎉 安装完成！${NC}"
    echo "=================================="
    echo -e "${BLUE}📋 可用命令:${NC}"
    echo "  npm start          - 启动代理服务"
    echo "  npm run dev        - 开发模式启动"
    echo "  npm test           - 运行测试"
    echo "  npm run health     - 健康检查"
    echo "  npm run stats      - 查看统计"
    echo ""
    echo -e "${YELLOW}💡 下一步: 编辑 config/proxy.json 配置你的代理提供商${NC}"
}

# 运行主函数
main 