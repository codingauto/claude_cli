#!/bin/bash

# Gitee发布脚本
set -e

VERSION=$(node -p "require('./package.json').version")
REPO_NAME="claude-residential-proxy"

echo "🚀 准备发布版本 v$VERSION 到 Gitee..."

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "❌ 未找到构建文件，请先运行 npm run build:release"
    exit 1
fi

# 推送代码到gitee
echo "📤 推送代码到Gitee..."
git add .
git commit -m "release: v$VERSION" || echo "没有新的更改需要提交"
git tag "v$VERSION" || echo "标签已存在"
git push gitee master
git push gitee "v$VERSION" || echo "标签已推送"

echo ""
echo "📋 手动上传步骤："
echo "1. 访问你的Gitee仓库"
echo "2. 点击 '发行版' 或 'Releases'"
echo "3. 点击 '创建发行版'"
echo "4. 选择标签: v$VERSION"
echo "5. 上传以下文件："
echo "   - dist/claude-proxy-linux.tar.gz"
echo "   - dist/claude-proxy-macos.tar.gz"
echo "   - dist/claude-proxy-windows.zip"
echo ""
echo "✅ 发布准备完成！"