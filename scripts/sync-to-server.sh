#!/bin/bash
# 本地 local 分支 → 服务器

set -e

SERVER="root@121.40.243.4"
SERVER_PATH="/root/nanoxingxing"

CURRENT_BRANCH=$(git branch --show-current)

if [[ "$CURRENT_BRANCH" != "local" ]]; then
    echo "警告: 当前分支是 '$CURRENT_BRANCH'，建议切换到 local 分支"
    read -p ">>> 是否继续? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo ">>> 已取消"
        exit 0
    fi
fi

echo ">>> 同步本地代码到服务器..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' --exclude='*.local' --exclude='local/notes' --exclude='.venv' ./ ${SERVER}:${SERVER_PATH}/

echo ">>> 同步完成!"
