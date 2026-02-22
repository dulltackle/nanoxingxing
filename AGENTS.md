## Git 工作流

### 分支策略

```
upstream/main ───────────────────────────────────►  (上游仓库 HKUDS/nanobot)
     ↓ rebase
main ────────────────────────────────────────────►  (纯净，用于提交 PR)
     ↓ merge
local ───────────────────────────────────────────►  (包含私有定制，用于部署)
     ↓ rsync
  服务器
```

| 分支        | 用途     | 说明                                    |
| ----------- | -------- | --------------------------------------- |
| `main`      | 跟踪上游 | 始终与 upstream/main 保持同步，保持纯净 |
| `local`     | 私有定制 | 包含功能定制、笔记等私有修改，用于部署  |
| `feature/*` | PR 开发  | 从 main 创建，完成后提交 PR             |

### 不同类型修改的处理

| 类型        | 处理方式                       |
| ----------- | ------------------------------ |
| 功能定制    | 放在 `local` 分支              |
| 配置文件    | `.gitignore` 排除（`*.local`） |
| 笔记/上下文 | `local/notes/` 目录（已排除）  |

---

## 同步脚本

| 脚本                          | 用途                                  |
| ----------------------------- | ------------------------------------- |
| scripts/sync-from-upstream.sh | 上游 → main → local → GitHub → 服务器 |
| scripts/sync-to-server.sh     | 本地 → 服务器                         |
| scripts/sync-from-server.sh   | 服务器 → 本地 → GitHub（交互式确认）  |

使用方式：

```bash
./scripts/sync-from-upstream.sh  # 同步上游更新
./scripts/sync-to-server.sh      # 推送到服务器
./scripts/sync-from-server.sh    # 从服务器拉取
```

---

## 常见操作

### 1. 同步上游更新

```bash
./scripts/sync-from-upstream.sh
```

### 2. 开发要提交 PR 的功能

```bash
git checkout main
git checkout -b feature/new-feature
# 开发...
git push origin feature/new-feature
# 在 GitHub 上创建 PR 到 upstream
```

### 3. 添加私有定制

```bash
git checkout local
# 开发私有功能...
git add . && git commit -m "local: 描述"
git push origin local
./scripts/sync-to-server.sh
```

### 4. 服务器上修改后同步

```bash
# 服务器上修改后，本地执行：
./scripts/sync-from-server.sh
```
