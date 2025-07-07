#!/bin/bash

# 构建发布版本脚本
set -e

echo "🔨 开始构建发布版本..."

# 清理旧的构建文件
echo "📦 清理旧构建文件..."
rm -rf dist/
mkdir -p dist/

# 安装依赖
echo "📥 安装依赖..."
npm install

# 运行测试
echo "🧪 运行测试..."
npm test

# 构建可执行文件
echo "🚀 构建多平台可执行文件..."
npm run build:exe

# 创建发布包
echo "📦 创建发布包..."
npm run package:release

echo "✅ 构建完成！发布文件位于 dist/ 目录"
echo ""
echo "📁 发布文件："
ls -la dist/

echo ""
echo "🎉 可以上传到Gitee的文件："
echo "- claude-proxy-linux.tar.gz"
echo "- claude-proxy-macos.tar.gz" 
echo "- claude-proxy-windows.zip"