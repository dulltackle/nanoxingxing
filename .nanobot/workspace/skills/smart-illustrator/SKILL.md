---
name: smart-illustrator
description: 为 Markdown 文章与 Slides 脚本生成配图、信息图与封面图，支持 `article`、`slides`、`cover` 三种模式，并支持 `--prompt-only` 输出可复用提示词。用户提到“配图/插图/信息图/PPT/slides/封面图/thumbnail/cover/bento grid”，或给出文章并要求自动出图、批量出图、按平台尺寸出封面时使用。
---

# Smart Illustrator

## Instructions

### 1) 先执行硬规则

- 把用户提供的 Markdown 文件视为业务输入（文章或 slides 脚本），不要当作 Skill 配置。
- 先读取风格文件，再生成任何 prompt；不要自写替代版 System Prompt。
- 默认生成真实图片；仅在用户显式要求 `--prompt-only` 时输出提示词而不调用图像 API。
- 保留图表中间文件（`.mmd`、`.excalidraw`）以便复用与二次编辑。

风格文件映射：

- `article` 默认：`styles/style-light.md`
- `cover` 默认：`styles/style-cover.md`
- `--style dark`：`styles/style-dark.md`
- `--style minimal`：`styles/style-minimal.md`
- `--style bento`：`styles/style-bento.md`

### 2) 选模式并校验输入

- `article`：输入为文章 Markdown，输出正文配图，可附带封面图。
- `slides`：输入为讲稿或大纲，拆成多张独立信息图（默认 16:9）。
- `cover`：只生成封面图；可用 `--topic` 在无文章输入时直接生成。

输入校验：

- `cover` 模式无文件输入时，必须提供 `--topic`。
- `slides` 模式需拆分成“一页一图”语义，不允许把多页内容合并为一张。

### 3) 按固定流程执行

1. 读取输入内容，提炼主题、受众、关键视觉锚点。
2. 根据内容结构选择引擎（Gemini / Excalidraw / Mermaid）。
3. 拼接“风格文件 + 当前图内容”生成最终 prompt。
4. 调用脚本出图并保存中间文件（如适用）。
5. 在 `article` 模式生成 `{article}-image.md`，插入图片引用，不覆盖原文。
6. 汇总交付文件清单，报告生成数量与失败项（如有）。

### 4) 引擎选择与强制参数

默认优先级：`Gemini > Excalidraw > Mermaid`

- Gemini：封面图、隐喻图、创意表达、难结构化概念。
- Excalidraw：概念关系图、轻流程、对比图、手绘风格示意。
- Mermaid：复杂流程、多层架构、多角色时序、分支决策图。

当用户显式传入 `--engine` 时，不做自动回退，严格按指定引擎执行。

### 5) 脚本调用规则

- 在技能根目录执行脚本，统一使用相对路径。
- 主要命令：
  - `npx -y bun scripts/generate-image.ts ...`
  - `npx -y bun scripts/mermaid-export.ts ...`
  - `npx -y bun scripts/excalidraw-export.ts ...`
- 若缺依赖，在 `scripts/` 执行 `npm install`。
- 透传用户显式参数（例如 `--ref`、`--no-config`、`-c/--candidates`、`-a/--aspect-ratio`）。

### 6) 配置优先级

优先级：CLI 参数 > 项目级配置 > 用户级配置

- 项目级配置：`.smart-illustrator/config.json`
- 用户级配置：`~/.smart-illustrator/config.json`

`--no-config` 仅禁用配置文件读取，不影响 `styles/style-*.md` 的读取。

### 7) 失败处理

- API/导出失败时，明确失败原因、失败文件、可重试命令；不要静默失败。
- `--prompt-only` 下若剪贴板命令缺失，仍需落盘 prompt 文件并告知路径。
- 不擅自修改用户原始输入文件；仅新增输出文件。

## References（按需读取）

- `references/usage-guide.md`：
  - 需要完整参数、模式示例、slides JSON 规范、cover 平台尺寸、配置示例时读取。
- `references/engine-selection.md`：
  - 需要细粒度引擎判定、Mermaid 色板与布局约束时读取。
- `references/excalidraw-guide.md`：
  - 生成 `.excalidraw` 前必须读取，确保 JSON 字段与视觉规范正确。
- `references/command-recipes.md`：
  - 需要可直接执行的命令模板、`--prompt-only` 剪贴板流程、命名约定时读取。
- `references/cover-best-practices.md`：
  - 生成 YouTube/社媒封面时，需要提升点击率与视觉层级时读取。
- `references/excalidraw-export-selectors.md`：
  - 调整或排查 Excalidraw Playwright 导出流程与选择器时读取。

## Output Contract

- 原文：`{article}.md`（不修改）
- 结果文档：`{article}-image.md`
- 封面图：`{article}-cover.png`
- 正文配图：`{article}-image-01.png`、`{article}-image-02.png` ...
- Mermaid 中间文件：`*.mmd`
- Excalidraw 中间文件：`*.excalidraw`
