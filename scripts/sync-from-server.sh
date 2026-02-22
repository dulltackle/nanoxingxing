#!/bin/bash
# 服务器 → 本地 → GitHub (local 分支)

set -e

SERVER="root@121.40.243.4"
SERVER_PATH="/root/nanoxingxing"

if ! git show-ref --verify --quiet refs/heads/local; then
    echo ">>> local 分支不存在，从 main 创建..."
    git checkout main
    git checkout -b local
fi

CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "local" ]]; then
    echo ">>> 切换到 local 分支..."
    git checkout local
fi

echo ">>> 从服务器拉取修改..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' --exclude='*.local' --exclude='local/notes' --exclude='.venv' ${SERVER}:${SERVER_PATH}/ ./

echo ">>> 检查是否有变更..."
if git diff --quiet && git diff --cached --quiet; then
    echo ">>> 没有变更，无需提交"
    exit 0
fi

echo ">>> 以下文件有变更:"
git status --short

echo ""
read -p ">>> 是否提交并推送到 GitHub (local 分支)? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo ">>> 已取消"
    exit 0
fi

echo ">>> 提交变更到 local 分支..."
git add .
git commit -m "local: 从服务器同步修改 $(date '+%Y-%m-%d %H:%M')"

echo ">>> 推送 local 分支到 GitHub..."
git push origin local

echo ">>> 同步完成!"
