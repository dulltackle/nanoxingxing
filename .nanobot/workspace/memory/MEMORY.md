# Long-term Memory

This file stores important information that should persist across sessions.

## User Information

- **Communication Language:** Chinese (Simplified)
- **Workspace Path:** `~/nanoxingxing/.nanobot/workspace/` (also accessible as `/root/nanoxingxing/.nanobot/workspace/`)
- **Shell:** `npx -y bun` for script execution

## Preferences

- Prefers detailed, step-by-step guidance with verification
- Likes visual progress indicators during installation/setup processes

## Project Context

### 健康提醒任务 (2026-03-02)

- **任务内容:** 站起来走动喝口水 💧🚶
- **提醒时间:** 每天 09:00-19:00（每小时整点，共 11 次）
- **任务 ID:** c735ae92
- **状态:** 已启用

### 用户的 AI Skills 生态系统

用户维护多个相互增强的技能：

- **creating-skill-plus** - 增强版 skill 编写器（核心飞轮）
- **generating-study-materials** - 长文拆解 skill
- **飞轮效应:** 学习新的 skill 知识 → 改进 creating-skill-plus → 用它改进其他 skills（如 generating-study-materials）

### smart-illustrator Skill

- **Location:** `/root/nanoxingxing/.nanobot/workspace/skills/smart-illustrator/`
- **Purpose:** Generate images for Markdown articles and slides (supports `article`, `slides`, `cover` modes, and `--prompt-only` for prompts only)
- **Status:** 已配置但存在环境问题（2026-03-02 测试时发现/tmp 目录只读，无法执行）

**Dependencies:**

- Node.js v24.13.1 ✓
- 415 npm packages installed
- Playwright browsers (Chromium + FFmpeg) ✓
- TypeScript v5.8.2 (typecheck passes ✓)
- @mermaid-js/mermaid-cli v11.12.0 ✓ (installed 2026-03-02)
- Style files: 6 templates (brand-colors, style-bento, style-cover, style-dark, style-light, style-minimal)

**Key Scripts:**

- `scripts/generate-image.ts` - Main image generation (API-based)
- `scripts/mermaid-export.ts` - Mermaid diagram export
- `scripts/excalidraw-export.ts` - Excalidraw export (pending test)
- `scripts/batch-generate.ts` - Batch image generation
- `scripts/cover-learner.ts` - Cover learning

**Configuration:**

- `.env` file configured with `TUZI_API_KEY=sk-xsmYVxpxI5tCSTWF0827B5276d2a43158242A6Da90909d8d`
- `scripts/puppeteer-config.json` configured for Mermaid CLI:
  - `executablePath`: `/usr/bin/chromium`
  - `args`: `["--no-sandbox"]` (required for root user)

**Chinese Font Configuration (2026-03-02):**

- Installed system fonts: `fonts-noto-cjk`, `fonts-wqy-microhei`, `fonts-wqy-zenhei`
- Created `scripts/mermaid-theme-cn.css` for Mermaid Chinese font support
- Mermaid CLI now correctly renders Chinese characters in diagrams
- Documentation: `CHINESE_FONT_CONFIG.md`

**Test Results (2026-03-02):**

| Feature                | Status     | Details                                                |
| ---------------------- | ---------- | ------------------------------------------------------ |
| Basic image generation | ✅ Tested  | Tuzi API (nano-banana-2, 2k size)                      |
| 16:9 cover generation  | ✅ Tested  | Works with `--aspect-ratio`                            |
| Style reference        | ✅ Tested  | `--ref` parameter works                                |
| Prompt from file       | ✅ Tested  | `--prompt-file` works                                  |
| Batch generation       | ⚠️ Partial | 2/3 generated (3rd timed out)                          |
| Mermaid export         | ✅ Tested  | Light/dark themes + Chinese support ✓                  |
| Excalidraw export      | ⚠️ Tested  | Requires network access to excalidraw.com, may timeout |

**Known Issues (2026-03-02):**

- **/tmp 目录只读** - 无法创建临时目录，导致 tsx 和 puppeteer 无法运行
- **npx 不可用** - 需要使用 bun 直接运行
- Batch generation: 3+ candidates may timeout (use `--candidates 2`)
- OpenRouter doesn't support style reference
- Mermaid CLI requires `--no-sandbox` when running as root

**Mermaid Usage:**

```bash
# From file with Chinese support
cd /root/nanoxingxing/.nanobot/workspace/skills/smart-illustrator/scripts
./node_modules/.bin/mmdc -i input.mmd -o output.png -t neutral -b white -p puppeteer-config.json -C mermaid-theme-cn.css

# Dark theme (transparent background for cover images)
./node_modules/.bin/mmdc -i input.mmd -o output.png -t dark -b transparent -p puppeteer-config.json -C mermaid-theme-cn.css
```

## Important Notes

- MCP services available: web-search-prime, web-reader, zread_search_doc, zread_read_file, zread_get_repo_structure
- User 飞书 ID: ou_04dcc61f62ab836fd54eba7c6a6f6777

---

_This file is automatically updated by nanobot when important information should be remembered._
