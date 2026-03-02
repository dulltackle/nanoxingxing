# 使用指南（速查版）

## 目录

- 快速入口
- 参数速查
- 三种模式的最小命令
- slides 模式 JSON 规范
- cover 平台尺寸
- 配置文件
- 常见故障

## 快速入口

- 需求是“文章自动配图”：看“文章模式最小命令”。
- 需求是“讲稿拆成多张信息图”：看“slides 模式最小命令”和“slides 模式 JSON 规范”。
- 需求是“按平台出封面”：看“cover 模式最小命令”和“cover 平台尺寸”。
- 需求是“命令模板与导出细节”：读 `references/command-recipes.md`。
- 需求是“如何选引擎”：读 `references/engine-selection.md`。
- 需求是“封面点击率优化”：读 `references/cover-best-practices.md`。

## 参数速查

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--mode` | `article` | 模式：`article` / `slides` / `cover` |
| `--platform` | `youtube` | 封面平台（仅 `cover`）：`youtube` / `wechat` / `twitter` / `xiaohongshu` |
| `--topic` | - | 封面主题（`cover` 且无文章输入时必填） |
| `--prompt-only` | `false` | 只输出 prompt，不调用图像 API |
| `--style` | `light` | 风格：`light` / `dark` / `minimal` / `bento` |
| `--no-cover` | `false` | 不生成封面（仅 `article`） |
| `--ref` | - | 参考图路径，可重复传入（如 `--ref a.png --ref b.png`） |
| `-c, --candidates` | `1` | 候选图数量（最多 4） |
| `-a, --aspect-ratio` | - | 宽高比，如 `16:9` / `3:2` / `3:4` |
| `--engine` | `auto` | 引擎：`auto` / `gemini` / `excalidraw` / `mermaid` |
| `--mermaid-embed` | `false` | Mermaid 输出代码块（旧行为，不推荐） |
| `--save-config` | - | 保存当前参数到项目配置 |
| `--no-config` | `false` | 禁用配置文件加载 |

约束与规则：

- `--no-config` 仅禁用 config 文件，不影响 `styles/style-*.md` 读取。
- `--engine auto` 走自动选引擎规则，细则见 `references/engine-selection.md`。
- `-c` 主要对 Gemini 有效；Mermaid 和 Excalidraw 通常只生成一张。

## 三种模式的最小命令

### 文章模式（article）

```bash
# 最小命令：生成正文配图 + 封面
/smart-illustrator path/to/article.md

# 只输出 prompt
/smart-illustrator path/to/article.md --prompt-only

# 常见变体
/smart-illustrator path/to/article.md --style dark
/smart-illustrator path/to/article.md --no-cover
/smart-illustrator path/to/article.md --engine excalidraw
```

### slides 模式

```bash
# 最小命令：按脚本拆成多张独立信息图
/smart-illustrator path/to/script.md --mode slides

# 只输出 JSON prompt
/smart-illustrator path/to/script.md --mode slides --prompt-only
```

行为约束：

- slides 模式按“一页一图”生成，不合并多页内容到一张图。
- 默认目标比例为 `16:9`，如需调整显式传 `-a`。

### cover 模式

```bash
# 基于文章生成封面
/smart-illustrator path/to/article.md --mode cover --platform youtube

# 无文章输入时，必须提供 --topic
/smart-illustrator --mode cover --platform wechat --topic "产品设计方法论"
```

## slides 模式 JSON 规范

当使用 `--mode slides --prompt-only`，输出应满足：

```json
{
  "instruction": "请逐条生成以下 N 张独立信息图。",
  "batch_rules": {
    "total": "N",
    "one_item_one_image": true,
    "aspect_ratio": "16:9",
    "do_not_merge": true
  },
  "style": "[从 styles/style-*.md 读取完整内容]",
  "pictures": [
    { "id": 1, "topic": "封面", "content": "..." },
    { "id": 2, "topic": "主题A", "content": "..." }
  ]
}
```

字段约束：

- `instruction` 强调“逐条生成、禁止合并”。
- `batch_rules.one_item_one_image` 与 `do_not_merge` 必须为 `true`。
- `pictures` 的 `id` 从 1 递增。

完整样例：`references/slides-prompt-example.json`

## cover 平台尺寸

输出统一按 2K 基准生成：

| 平台 | 代码 | 宽高比 | 推荐尺寸 |
|---|---|---|---|
| YouTube | `youtube` | `16:9` | `2560x1440` |
| 公众号 | `wechat` | `2.35:1` | `2824x1200` |
| Twitter/X | `twitter` | `1.91:1` | `2560x1342` |
| 小红书 | `xiaohongshu` | `3:4` | `1920x2560` |

设计策略与点击率规范见：`references/cover-best-practices.md`

## 配置文件

优先级：CLI 参数 > 项目级配置 > 用户级配置

- 项目级：`.smart-illustrator/config.json`
- 用户级：`~/.smart-illustrator/config.json`

项目级示例：

```json
{
  "references": ["./refs/style-ref-01.png"],
  "style": "light",
  "aspectRatio": "16:9",
  "candidates": 2,
  "noCover": false
}
```

常用操作：

```bash
# 生成并保存项目配置
/smart-illustrator article.md --ref ./brand.png -c 2 --save-config

# 临时禁用配置
/smart-illustrator article.md --no-config --style dark -c 1
```

## 常见故障

- `cover` 模式报参数不全：
  - 原因：无输入文件且未提供 `--topic`。
  - 处理：补充 `--topic`。
- `--prompt-only` 没复制到剪贴板：
  - 原因：系统缺少 `pbcopy/xclip/wl-copy`。
  - 处理：从 `/tmp/smart-illustrator-prompt.json` 手动复制。
- 输出数量少于预期：
  - 原因：非 Gemini 引擎通常不支持多候选。
  - 处理：改用 `--engine gemini` 或降低 `-c` 预期。
