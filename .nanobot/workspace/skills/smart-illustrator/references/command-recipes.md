# 命令模板与输出约定

## 目录

- 执行前检查
- 最小命令模板
- Gemini 命令模板
- Mermaid 导出命令模板
- Excalidraw 导出命令模板
- Prompt Only 与剪贴板
- 输出命名约定
- 常见失败与重试
- 执行后验收

## 执行前检查

在技能根目录执行命令；首次使用先安装依赖：

```bash
cd scripts
npm install
```

如需 Excalidraw 导出：

```bash
npx playwright install firefox
```

## 最小命令模板

```bash
# Gemini 文生图
npx -y bun scripts/generate-image.ts --prompt-file /tmp/prompt.txt --output article-image-01.png

# Mermaid 导出
npx -y bun scripts/mermaid-export.ts --input architecture.mmd --output architecture.png --width 2400

# Excalidraw 导出
npx -y bun scripts/excalidraw-export.ts --input concept.excalidraw --output concept.png --scale 2
```

## Gemini 命令模板

优先使用 `--prompt-file`，避免命令行转义错误：

```bash
cat > /tmp/image-prompt.txt <<'EOF'
{从 styles/style-*.md 提取的 System Prompt}

**内容**：{配图描述}
EOF

npx -y bun scripts/generate-image.ts \
  --prompt-file /tmp/image-prompt.txt \
  --output article-image-01.png \
  --aspect-ratio 16:9
```

封面图示例：

```bash
cat > /tmp/cover-prompt.txt <<'EOF'
{从 styles/style-cover.md 提取的 System Prompt}

**内容**：
- 核心概念：{主题}
- 视觉隐喻：{设计方向}
EOF

npx -y bun scripts/generate-image.ts \
  --prompt-file /tmp/cover-prompt.txt \
  --output article-cover.png \
  --aspect-ratio 16:9
```

## Mermaid 导出命令模板

```bash
npx -y bun scripts/mermaid-export.ts \
  --input architecture.mmd \
  --output architecture.png \
  --width 2400
```

如果用户要求保留可编辑版本，同时在文档里保留 `architecture.mmd`。

## Excalidraw 导出命令模板

```bash
npx -y bun scripts/excalidraw-export.ts \
  --input concept.excalidraw \
  --output concept.png \
  --scale 2
```

若导出失败且依赖缺失，明确提示缺失项并给出安装命令，不要静默失败。

## Prompt Only 与剪贴板

`--prompt-only` 时不调用 API，输出 prompt 文本并保存备份文件：

```bash
echo "$PROMPT_JSON" > /tmp/smart-illustrator-prompt.json
```

再按平台复制到剪贴板（有哪个用哪个）：

```bash
if command -v pbcopy >/dev/null 2>&1; then
  cat /tmp/smart-illustrator-prompt.json | pbcopy
elif command -v xclip >/dev/null 2>&1; then
  xclip -selection clipboard < /tmp/smart-illustrator-prompt.json
elif command -v wl-copy >/dev/null 2>&1; then
  wl-copy < /tmp/smart-illustrator-prompt.json
else
  echo "未检测到剪贴板命令，请手动复制 /tmp/smart-illustrator-prompt.json"
fi
```

## 输出命名约定

- 文章输出：`{article}-image.md`
- 封面图：`{article}-cover.png`
- 正文配图：`{article}-image-01.png`、`{article}-image-02.png`
- Mermaid 源：`{name}.mmd`
- Excalidraw 源：`{name}.excalidraw`

## 常见失败与重试

- `API key missing`：
  - 检查 `.env` 是否含 `OPENROUTER_API_KEY` / `GEMINI_API_KEY` / `TUZI_API_KEY`。
- `Failed to load reference image`：
  - 检查 `--ref` 路径是否相对当前工作目录可达。
- Excalidraw 导出失败且浏览器缺失：
  - 运行 `npx playwright install firefox` 后重试。
- `--prompt-only` 未复制到剪贴板：
  - 手动复制 `/tmp/smart-illustrator-prompt.json`。

## 执行后验收

- 图片文件已落盘且非 0 字节。
- `article` 模式生成 `{article}-image.md`，且原文未被覆盖。
- 图表模式保留 `.mmd` 或 `.excalidraw` 中间文件。
