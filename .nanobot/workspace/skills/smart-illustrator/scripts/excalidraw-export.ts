#!/usr/bin/env npx -y bun

/**
 * Excalidraw Export Script
 *
 * Export .excalidraw files to PNG or SVG using Playwright directly.
 * Replaces the previous excalidraw-brute-export-cli wrapper which broke
 * due to excalidraw.com UI changes (welcome screen + menu state issues).
 *
 * Usage:
 *   npx -y bun excalidraw-export.ts -i diagram.excalidraw -o diagram.png
 *   npx -y bun excalidraw-export.ts -i diagram.excalidraw -o diagram.svg -f svg
 *   npx -y bun excalidraw-export.ts -i diagram.excalidraw -o diagram.png --dark --scale 2
 *
 * Prerequisites:
 *   cd smart-illustrator/scripts && npm install
 *   npx playwright install chromium
 */

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

interface ExportOptions {
  input: string;
  output: string;
  format: "png" | "svg";
  scale: 1 | 2 | 3;
  darkMode: boolean;
  background: boolean;
  embedScene: boolean;
  timeout: number;
}

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

async function exportWithPlaywright(opts: ExportOptions): Promise<void> {
  // Import playwright from local node_modules (installed as transitive dep of excalidraw-brute-export-cli)
  const pw = await import(
    resolve(SCRIPTS_DIR, "node_modules/playwright/index.mjs")
  );
  const { chromium } = pw;

  const absInput = resolve(opts.input);
  const absOutput = resolve(opts.output);

  const browser = await chromium.launch({
    headless: true,
    channel: "chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-features=FileSystemAccessAPI",
    ]
  });
  const page = await browser.newPage({
    acceptDownloads: true,
    viewport: { width: 1400, height: 900 },
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  try {
    // Force Open to fallback to <input type="file">. For Save, provide
    // an in-page picker shim so we can capture the blob even when download
    // event is not emitted in headless runs.
    await page.addInitScript(`
      (() => {
        const w = window;
        w.__codexExportDataUrl = null;
        const toDataUrl = (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
        try {
          Object.defineProperty(window, "showOpenFilePicker", {
            configurable: true,
            writable: true,
            value: undefined
          });
          Object.defineProperty(window, "showSaveFilePicker", {
            configurable: true,
            writable: true,
            value: async () => ({
              createWritable: async () => ({
                write: async (data) => {
                  const blob = data instanceof Blob ? data : new Blob([data]);
                  w.__codexExportDataUrl = await toDataUrl(blob);
                },
                close: async () => {}
              })
            })
          });
          Object.defineProperty(window, "showDirectoryPicker", {
            configurable: true,
            writable: true,
            value: undefined
          });
        } catch {}
      })();
    `);

    console.log("  Opening excalidraw.com...");
    await page.goto("https://excalidraw.com", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Debug: take screenshot after page load
    await page.screenshot({ path: "/tmp/excalidraw-debug-1.png" });
    console.log("  Debug screenshot saved to /tmp/excalidraw-debug-1.png");

    // Strategy: load via file input directly (setInputFiles),
    // first from welcome Open flow, then fallback to hamburger menu flow.
    console.log("  Loading file...");
    let fileLoaded = false;

    const trySetInputFiles = async (stage: string): Promise<boolean> => {
      const fileInputs = page.locator('input[type="file"]');
      const count = await fileInputs.count().catch(() => 0);
      console.log(`  [${stage}] Found ${count} file inputs`);
      if (count === 0) {
        return false;
      }

      // Prefer newest input first; older ones are more likely detached/stale.
      for (let i = count - 1; i >= 0; i--) {
        try {
          await fileInputs.nth(i).setInputFiles(absInput);
          await page.waitForTimeout(2000);
          console.log(`  [${stage}] File loaded via input #${i}.`);
          return true;
        } catch (error) {
          console.log(
            `  [${stage}] setInputFiles failed on input #${i}: ${error}`
          );
        }
      }
      return false;
    };

    const loadViaSetInputFiles = async (
      stage: string,
      trigger?: () => Promise<void>
    ): Promise<boolean> => {
      if (await trySetInputFiles(`${stage}/pre`)) {
        return true;
      }

      if (trigger) {
        try {
          await trigger();
        } catch (error) {
          console.log(`  [${stage}] Trigger failed: ${error}`);
        }
      }

      // Input can appear asynchronously after menu/open actions.
      for (let attempt = 1; attempt <= 6; attempt++) {
        await page.waitForTimeout(400);
        if (await trySetInputFiles(`${stage}/retry-${attempt}`)) {
          return true;
        }
      }
      return false;
    };

    const loadViaDragDrop = async (stage: string): Promise<boolean> => {
      try {
        const content = await readFile(absInput, "utf8");
        const fileName = basename(absInput);
        const injected = await page.evaluate(
          ({ sceneContent, name }) => {
            try {
              const win = globalThis as unknown as Record<string, any>;
              const doc = win.document as any;
              const file = new win.File([sceneContent], name, {
                type: "application/json",
                lastModified: Date.now(),
              });
              const dt = new win.DataTransfer();
              dt.items.add(file);
              const target =
                doc.querySelector(".excalidraw") ??
                doc.querySelector("main") ??
                doc.body;
              for (const eventType of ["dragenter", "dragover", "drop"]) {
                target.dispatchEvent(
                  new win.DragEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: dt,
                  })
                );
              }
              return true;
            } catch {
              return false;
            }
          },
          { sceneContent: content, name: fileName }
        );
        if (!injected) {
          console.log(`  [${stage}] Drag-drop injection failed in browser.`);
          return false;
        }

        await page.waitForTimeout(2000);
        console.log(`  [${stage}] File loaded via drag-drop.`);
        return true;
      } catch (error) {
        console.log(`  [${stage}] Drag-drop load failed: ${error}`);
        return false;
      }
    };

    const dismissModalOverlays = async (stage: string): Promise<void> => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        const modalBg = page.locator(".Modal__background");
        const modalCount = await modalBg.count().catch(() => 0);
        if (modalCount === 0) {
          return;
        }

        console.log(`  [${stage}] Dismissing modal overlay (attempt ${attempt})`);
        const closeCandidates = [
          'button[aria-label="Close"]',
          'button:has-text("Cancel")',
          'button:has-text("Close")',
          'button:has-text("OK")',
          'button:has-text("Done")',
          'button:has-text("Got it")',
        ];

        let dismissed = false;
        for (const selector of closeCandidates) {
          const btn = page.locator(selector).first();
          const count = await btn.count().catch(() => 0);
          if (count > 0) {
            await btn.click({ force: true }).catch(() => {});
            dismissed = true;
            break;
          }
        }

        if (!dismissed) {
          await page.keyboard.press("Escape").catch(() => {});
          await modalBg.first().click({ force: true }).catch(() => {});
        }
        await page.waitForTimeout(300);
      }
    };

    // Check if welcome screen Open button is visible
    const welcomeOpen = page.locator("button:has-text('Open')").first();
    const welcomeOpenCount = await welcomeOpen
      .count()
      .catch(() => 0);
    console.log(`  Welcome Open button count: ${welcomeOpenCount}`);

    if (welcomeOpenCount > 0) {
      console.log("  Trying welcome Open flow...");
      fileLoaded = await loadViaSetInputFiles("welcome-open", async () => {
        await welcomeOpen.click({ timeout: 10000 });
      });
      if (fileLoaded) {
        console.log("  File loaded via welcome flow.");
      } else {
        console.log("  Welcome flow did not expose a usable file input.");
      }
    }

    if (!fileLoaded) {
      fileLoaded = await loadViaDragDrop("drag-drop");
      if (fileLoaded) {
        console.log("  File loaded via drag-drop fallback.");
      }
    }

    if (!fileLoaded) {
      // No welcome screen or it didn't work - use hamburger menu
      console.log("  Trying hamburger menu...");
      const menuTrigger = page.locator(
        '[data-testid="main-menu-trigger"]'
      );
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(300);
      await menuTrigger.click({ timeout: 10000, force: true });
      await page.waitForTimeout(1000);
      
      // Debug: screenshot after menu click
      await page.screenshot({ path: "/tmp/excalidraw-debug-2.png" });
      console.log("  Debug screenshot saved to /tmp/excalidraw-debug-2.png");

      const openBtn = page.locator('[data-testid="load-button"]');
      const openBtnCount = await openBtn.count().catch(() => 0);
      console.log(`  Found ${openBtnCount} load buttons`);

      fileLoaded = await loadViaSetInputFiles("hamburger-open", async () => {
        if (openBtnCount > 0) {
          await openBtn.first().click({ timeout: 10000, force: true });
        }
      });
      if (fileLoaded) {
        console.log("  File loaded via hamburger flow.");
      } else {
        throw new Error(
          "Unable to load input file via setInputFiles. " +
            "No usable file input found after welcome/menu open actions."
        );
      }
    }

    // Dismiss any remaining overlays
    await page.keyboard.press("Escape").catch(() => {});
    await dismissModalOverlays("pre-export");
    await page.waitForTimeout(500);

    // Open the main menu and click Export
    console.log("  Opening export dialog...");
    const menuTrigger = page.locator(
      '[data-testid="main-menu-trigger"]'
    );
    await menuTrigger.click({ timeout: opts.timeout, force: true });
    await page.waitForTimeout(500);

    const exportMenuItem = page.locator(
      '[data-testid="image-export-button"]'
    );

    // Verify export button exists before clicking
    const exportCount = await exportMenuItem.count();
    if (exportCount === 0) {
      // Menu might have toggled closed - click again
      await menuTrigger.click({ timeout: opts.timeout, force: true });
      await page.waitForTimeout(500);
    }

    await exportMenuItem.click({ timeout: opts.timeout });

    // Wait for export dialog to be ready (not just a fixed timeout)
    const exportDialog = page.locator(".ImageExportDialog, .ImageExportModal, .ExportDialog");
    await exportDialog.waitFor({ state: "visible", timeout: opts.timeout }).catch(() => {
      // Fallback: if dialog class changed, wait a fixed time
      return page.waitForTimeout(1500);
    });

    // Configure export options in the dialog
    console.log("  Configuring export options...");

    // Helper: fail fast when user explicitly set a non-default option but control is missing
    const requireControl = async (
      locator: ReturnType<typeof page.locator>,
      name: string,
      isNonDefault: boolean
    ): Promise<boolean> => {
      const found = (await locator.count()) > 0;
      if (!found && isNonDefault) {
        throw new Error(
          `Export option "${name}" not found in dialog. ` +
          `Excalidraw UI may have changed. Cannot apply --${name.toLowerCase()} setting.`
        );
      }
      return found;
    };

    // Set scale (radio buttons: 1×, 2×, 3×)
    const scaleLabel = `${opts.scale}×`;
    const scaleRadio = page.locator(
      `.RadioGroup__choice:has-text("${scaleLabel}") input`
    );
    if (await requireControl(scaleRadio, "scale", opts.scale !== 2)) {
      await scaleRadio.click();
    }

    // Set dark mode switch
    const darkSwitch = page.locator('input[name="exportDarkModeSwitch"]');
    if (await requireControl(darkSwitch, "dark", opts.darkMode)) {
      const isDark = await darkSwitch.isChecked();
      if (opts.darkMode !== isDark) {
        await darkSwitch.click({ force: true });
      }
    }

    // Set background switch
    const bgSwitch = page.locator('input[name="exportBackgroundSwitch"]');
    if (await requireControl(bgSwitch, "background", !opts.background)) {
      const hasBg = await bgSwitch.isChecked();
      if (opts.background !== hasBg) {
        await bgSwitch.click({ force: true });
      }
    }

    // Set embed scene switch
    const embedSwitch = page.locator('input[name="exportEmbedSwitch"]');
    if (await requireControl(embedSwitch, "embed-scene", opts.embedScene)) {
      const isEmbed = await embedSwitch.isChecked();
      if (opts.embedScene !== isEmbed) {
        await embedSwitch.click({ force: true });
      }
    }

    await page.waitForTimeout(500);

    // Select format and trigger download
    const formatLabel =
      opts.format === "svg" ? "Export to SVG" : "Export to PNG";
    console.log(
      `  Exporting ${formatLabel} (scale: ${opts.scale}x, dark: ${opts.darkMode}, bg: ${opts.background})...`
    );

    const downloadPromise = page
      .waitForEvent("download", { timeout: opts.timeout })
      .catch(() => null);
    const formatBtn = page.locator(
      `button[aria-label="${formatLabel}"]`
    );
    await formatBtn.click({ timeout: opts.timeout });

    const download = await downloadPromise;
    if (download) {
      await download.saveAs(absOutput);
      console.log(`  Download saved.`);
    } else {
      const savedViaPicker = await page
        .waitForFunction(
          "Boolean(globalThis.__codexExportDataUrl)",
          { timeout: 5000 }
        )
        .then(() =>
          page.evaluate(() => (globalThis as any).__codexExportDataUrl as string)
        )
        .catch(() => null);

      if (!savedViaPicker) {
        throw new Error(
          "Export button clicked but neither download nor picker blob was captured."
        );
      }

      const commaIndex = savedViaPicker.indexOf(",");
      const base64Payload =
        commaIndex >= 0 ? savedViaPicker.slice(commaIndex + 1) : savedViaPicker;
      await writeFile(absOutput, Buffer.from(base64Payload, "base64"));
      console.log("  Export saved via picker blob fallback.");
    }
  } finally {
    await browser.close();
  }
}

function printUsage(): never {
  console.log(`
Excalidraw Export Script

Usage:
  npx -y bun excalidraw-export.ts -i <input> -o <output> [options]

Options:
  -i, --input <path>     Input .excalidraw file (required)
  -o, --output <path>    Output file path (required)
  -f, --format <fmt>     Output format: png (default) or svg
  -s, --scale <1|2|3>    Export scale (default: 2)
  -d, --dark             Enable dark mode
  -b, --background       Include background (default: white, use --no-bg for transparent)
  -e, --embed-scene      Embed scene data in exported file
  --timeout <ms>         Timeout in milliseconds (default: 30000)
  -h, --help             Show this help

Examples:
  # Export to PNG at 2x scale
  npx -y bun excalidraw-export.ts -i diagram.excalidraw -o diagram.png

  # Export to SVG
  npx -y bun excalidraw-export.ts -i diagram.excalidraw -o diagram.svg -f svg

  # Export dark mode PNG at 3x scale
  npx -y bun excalidraw-export.ts -i diagram.excalidraw -o diagram-dark.png -d -s 3

  # Export with transparent background (no white fill)
  npx -y bun excalidraw-export.ts -i diagram.excalidraw -o diagram.png --no-bg

Prerequisites:
  cd smart-illustrator/scripts && npm install
  npx playwright install chromium
`);
  process.exit(0);
}

async function main() {
  const args = process.argv.slice(2);

  const opts: ExportOptions = {
    input: "",
    output: "",
    format: "png",
    scale: 2,
    darkMode: false,
    background: true,
    embedScene: false,
    timeout: 30000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "-h":
      case "--help":
        printUsage();
        break;
      case "-i":
      case "--input":
        opts.input = args[++i];
        break;
      case "-o":
      case "--output":
        opts.output = args[++i];
        break;
      case "-f":
      case "--format":
        opts.format = args[++i] as "png" | "svg";
        break;
      case "-s":
      case "--scale":
        opts.scale = parseInt(args[++i], 10) as 1 | 2 | 3;
        break;
      case "-d":
      case "--dark":
        opts.darkMode = true;
        break;
      case "-b":
      case "--background":
        opts.background = true;
        break;
      case "--no-bg":
      case "--transparent":
        opts.background = false;
        break;
      case "-e":
      case "--embed-scene":
        opts.embedScene = true;
        break;
      case "--timeout":
        opts.timeout = parseInt(args[++i], 10);
        break;
    }
  }

  if (!opts.input) {
    console.error("Error: --input is required");
    process.exit(1);
  }
  if (!opts.output) {
    const base = opts.input.replace(/\.excalidraw$/, "").replace(/\.md$/, "");
    opts.output = `${base}.${opts.format}`;
  }

  if (extname(opts.output) === ".svg") {
    opts.format = "svg";
  }

  if (![1, 2, 3].includes(opts.scale)) {
    console.error("Error: --scale must be 1, 2, or 3");
    process.exit(1);
  }

  try {
    await access(opts.input);
  } catch {
    console.error(`Error: Input file not found: ${opts.input}`);
    process.exit(1);
  }

  await mkdir(dirname(resolve(opts.output)), { recursive: true });

  console.log(`Exporting Excalidraw diagram...`);
  console.log(`  Input:  ${opts.input}`);
  console.log(`  Output: ${opts.output}`);
  console.log(
    `  Format: ${opts.format.toUpperCase()}, Scale: ${opts.scale}x${opts.darkMode ? ", Dark mode" : ""}`
  );

  try {
    await exportWithPlaywright(opts);
    console.log(`\nExported: ${opts.output}`);
  } catch (error) {
    console.error(
      "Export failed:",
      error instanceof Error ? error.message : error
    );
    console.error(
      "\nFallback: open the .excalidraw file in excalidraw.com and export manually."
    );
    process.exit(1);
  }
}

main();
