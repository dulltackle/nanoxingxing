#!/bin/bash
# 上游 → main (rebase) → local (merge) → GitHub → 服务器

set -e

SERVER="root@121.40.243.4"
SERVER_PATH="/root/nanoxingxing"

ORIGINAL_BRANCH=$(git branch --show-current)

echo ">>> 从上游仓库拉取更新..."
git fetch upstream

echo ">>> 更新 main 分支 (rebase)..."
git checkout main
git rebase upstream/main

echo ">>> 推送 main 到 GitHub..."
git push origin main --force-with-lease

echo ">>> 合并到 local 分支..."
if git show-ref --verify --quiet refs/heads/local; then
    git checkout local
    git merge main
else
    echo ">>> local 分支不存在，从 main 创建..."
    git checkout -b local
fi

echo ">>> 推送 local 到 GitHub..."
git push origin local --force-with-lease

echo ">>> 同步到服务器..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' --exclude='*.local' --exclude='local/notes' --exclude='.venv' ./ ${SERVER}:${SERVER_PATH}/

git checkout "$ORIGINAL_BRANCH" 2>/dev/null || git checkout local

echo ">>> 同步完成!"
