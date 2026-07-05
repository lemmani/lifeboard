#!/usr/bin/env node
/* End-to-end UI test runner.
   Drives the running dev server at http://localhost:3000 in headless Chromium,
   exercises every flow, screenshots key states, and writes a JSON report.

   Usage:
     node scripts/test-ui.mjs
*/

import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const SHOTS = "screenshots";
mkdirSync(SHOTS, { recursive: true });

const results = [];
let stepIdx = 0;
function nextStep() {
  return String(++stepIdx).padStart(2, "0");
}

async function step(page, name, fn) {
  const id = nextStep();
  const t0 = Date.now();
  let pass = true;
  let err = null;
  try {
    await fn();
  } catch (e) {
    pass = false;
    err = e.message;
  }
  const dur = Date.now() - t0;
  const shotPath = `${SHOTS}/${id}_${name.replace(/[^a-z0-9]+/gi, "_")}${pass ? "" : "_FAIL"}.png`;
  try {
    await page.screenshot({ path: shotPath, fullPage: false });
  } catch {}
  results.push({ id, name, pass, ms: dur, err, shot: shotPath });
  console.log(
    `${pass ? "✓" : "✗"} ${id} ${name} (${dur}ms)${err ? " — " + err : ""}`,
  );
  if (!pass && process.env.STOP_ON_FAIL) throw new Error(name + ": " + err);
}

const STORAGE_KEY = "lifeboard.v2";

// The app stores all data in localStorage under STORAGE_KEY.
// Reset = remove the key and reload so the store falls back to seed.json.
async function resetDb(page) {
  await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
  await page.reload({ waitUntil: "networkidle" });
}

// Read the persisted snapshot for assertions (null until first mutation).
async function getStore(page) {
  return page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) || "null"),
    STORAGE_KEY,
  );
}

// The bottom-center toast can overlap buttons for ~2.6s; dismiss it so
// clicks are not intercepted.
async function clearToast(page) {
  const toast = page.locator('button[title="Dismiss"]');
  if (await toast.count()) {
    await toast.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // Capture console errors throughout
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push("console: " + msg.text());
  });

  try {
    await step(page, "load home", async () => {
      await page.goto(BASE, { waitUntil: "networkidle" });
      await resetDb(page);
      await page.waitForSelector("text=LifeBoard");
    });

    // --- Sidebar navigation ---
    for (const screen of ["Goals", "Matrix", "Finance", "Settings", "Timeline"]) {
      await step(page, `nav: ${screen}`, async () => {
        await page.locator(`.nav-item:has-text("${screen}")`).first().click();
        await page.waitForSelector(`.page-title:has-text("${screen === "Matrix" ? "Eisenhower" : screen}")`);
      });
    }

    // --- Create Goal flow (3-step) ---
    await step(page, "open Create Goal modal", async () => {
      await page.locator("button:has-text(\"New goal\")").first().click();
      await page.waitForSelector("text=Step 1 of 3");
    });

    await step(page, "step 1: title + category + dates", async () => {
      await page.locator('input[placeholder*="Launch Kala"]').fill("UI Test Goal");
      await page.locator('button:has-text("Career")').click();
      await page.locator('button:has-text("Continue")').click();
      await page.waitForSelector("text=Step 2 of 3");
    });

    await step(page, "step 2: financial target + focus", async () => {
      await page.locator('input[type="number"]').first().fill("5000");
      await page.locator('button:has-text("Secondary · Q3–Q4")').click();
      await page.locator('button:has-text("Continue")').click();
      await page.waitForSelector("text=Step 3 of 3");
    });

    await step(page, "step 3: add 2 tasks", async () => {
      await page.locator('input[placeholder*="New task"]').fill("Sub-task A");
      await page.locator('button:has-text("Add")').click();
      await page.waitForTimeout(150);
      await page.locator('input[placeholder*="New task"]').fill("Sub-task B");
      await page.locator('button:has-text("Add")').click();
      await page.waitForTimeout(150);
    });

    await step(page, "submit Create Goal", async () => {
      await page.locator('button:has-text("Create goal")').click();
      // Toast confirmation
      await page.waitForSelector("text=added to the timeline", { timeout: 4000 });
      // Store confirmation
      const s = await getStore(page);
      const n = s.goals.filter((g) => g.title === "UI Test Goal").length;
      if (n !== 1) throw new Error(`expected 1 goal in store, got ${n}`);
    });

    // --- Click goal bar → drawer ---
    await step(page, "open goal drawer", async () => {
      await page.locator('text="UI Test Goal"').first().click();
      await page.waitForSelector("text=Funding progress", { timeout: 4000 });
    });

    await step(page, "drawer: add task with picker", async () => {
      await page.locator('input[placeholder*="Add a task"]').fill("Drawer task");
      await page.locator('form button:has-text("Add")').click();
      await page.waitForTimeout(300);
      const s = await getStore(page);
      const n = s.tasks.filter((t) => t.title === "Drawer task").length;
      if (n !== 1) throw new Error(`drawer task not persisted: count=${n}`);
    });

    await step(page, "drawer: toggle task done", async () => {
      // Find the new task's checkbox (the leading 22x22 button)
      const card = page.locator('text="Drawer task"').first().locator('..').locator('..');
      // Click the leading button (toggle)
      const cb = card.locator('button').first();
      await cb.click();
      await page.waitForTimeout(300);
      const s = await getStore(page);
      const status = s.tasks.find((t) => t.title === "Drawer task")?.status;
      if (status !== "Done") throw new Error(`expected Done, got ${status}`);
    });

    await step(page, "drawer: Mark Complete goal", async () => {
      await clearToast(page);
      await page.locator('button[title="Mark goal complete"]').click();
      await page.waitForTimeout(500);
      const s = await getStore(page);
      const status = s.goals.find((g) => g.title === "UI Test Goal")?.status;
      if (status !== "Completed") throw new Error(`expected Completed, got ${status}`);
    });

    await step(page, "drawer: Reopen goal", async () => {
      await clearToast(page);
      await page.locator('button[title="Reopen this goal"]').click();
      await page.waitForTimeout(500);
      const s = await getStore(page);
      const status = s.goals.find((g) => g.title === "UI Test Goal")?.status;
      if (status === "Completed") throw new Error(`still Completed`);
    });

    await step(page, "drawer: Edit → 3-step modal (Basics→Targets→Funding)", async () => {
      await page.locator('button:has-text("Edit"):visible').first().click();
      await page.waitForSelector("text=Edit goal");
      await page
        .locator('input[value="UI Test Goal"]')
        .fill("UI Test Goal (edited)");
      // Step 1 → 2
      await page.locator('button:has-text("Continue")').click();
      await page.waitForSelector("text=Step 2 of 3 · Targets");
      // Step 2 → 3 (Funding)
      await page.locator('button:has-text("Continue")').click();
      await page.waitForSelector("text=Step 3 of 3 · Funding");
      // Link the goal to "Vibe Code" source via the funding checkbox button
      await page.locator('button:has-text("Vibe Code")').click();
      await page.waitForTimeout(150);
      await page.waitForSelector("text=Save changes");
      await page.locator('button:has-text("Save changes")').click();
      await page.waitForTimeout(700);
      const s = await getStore(page);
      const goal = s.goals.find((g) => g.title.startsWith("UI Test Goal"));
      if (!goal?.title.includes("edited"))
        throw new Error(`title not updated: ${goal?.title}`);
      // Verify funding link persisted
      const vibe = s.sources.find((src) => src.id === "s-vibe");
      if (!vibe.linked_goals.includes(goal.id))
        throw new Error(
          `funding link not persisted; goal ${goal.id} not in ${JSON.stringify(vibe.linked_goals)}`,
        );
    });

    await step(page, "close drawer with Esc", async () => {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      const stillOpen = await page.locator("text=Funding progress").count();
      if (stillOpen > 0) throw new Error("drawer still open after Esc");
    });

    await step(page, "reopen drawer for edited goal (left column)", async () => {
      // Use the left-column goal label cell (not the drawer header, not the bar)
      await page
        .locator('.card div[style*="border-right"] >> text="UI Test Goal (edited)"')
        .first()
        .click({ timeout: 5000 })
        .catch(async () => {
          // fallback: click the bar
          await page
            .locator('span[style*="text-overflow: ellipsis"]:has-text("UI Test Goal (edited)")')
            .first()
            .click();
        });
      await page.waitForSelector("text=Funding progress");
    });

    await step(page, "drawer: Delete → confirm dialog appears", async () => {
      await page.locator('button:has-text("Delete"):visible').first().click();
      await page.waitForSelector('text=Delete "UI Test Goal (edited)"?', { timeout: 4000 });
    });

    await step(page, "confirm dialog: Cancel keeps goal", async () => {
      await page.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(300);
      const s = await getStore(page);
      const n = s.goals.filter((g) => g.title.startsWith("UI Test Goal")).length;
      if (n !== 1) throw new Error(`expected 1, got ${n}`);
    });

    await step(page, "drawer: Delete → confirm → goal removed", async () => {
      await page.locator('button:has-text("Delete"):visible').first().click();
      await page.waitForSelector('text=Delete "UI Test Goal (edited)"?');
      await page.locator('button:has-text("Delete goal")').click();
      await page.waitForTimeout(500);
      const s = await getStore(page);
      const n = s.goals.filter((g) => g.title.startsWith("UI Test Goal")).length;
      if (n !== 0) throw new Error(`expected 0, got ${n}`);
    });

    // --- Matrix drag-and-drop ---
    await step(page, "go to Matrix", async () => {
      await page.locator('.nav-item:has-text("Matrix")').click();
      await page.waitForSelector('.page-title:has-text("Eisenhower")');
    });

    await step(page, "matrix: drag card across quadrants", async () => {
      const card = page
        .locator('[draggable="true"]:has-text("Make Pitch Deck")')
        .first();
      const dst = page.locator('.card:has-text("Eliminate")').first();
      await card.waitFor({ timeout: 5000 });
      await dst.waitFor({ timeout: 5000 });
      // Playwright's documented HTML5 drag pattern: share a single DataTransfer
      // handle across the dispatched events so React state updates land.
      const dataTransfer = await page.evaluateHandle(
        () => new DataTransfer(),
      );
      await card.dispatchEvent("dragstart", { dataTransfer });
      await dst.dispatchEvent("dragenter", { dataTransfer });
      await dst.dispatchEvent("dragover", { dataTransfer });
      await dst.dispatchEvent("drop", { dataTransfer });
      await card.dispatchEvent("dragend", { dataTransfer });
      await page.waitForTimeout(800);
      const s = await getStore(page);
      const t = s.tasks.find((x) => x.title === "Make Pitch Deck");
      const row = `${t?.importance}/${t?.urgency}`;
      if (row !== "Not Important/Not Urgent")
        throw new Error(`drag did not reclassify: ${row}`);
    });

    await step(page, "matrix: complete a task (animation)", async () => {
      const card = page
        .locator('[draggable="true"]:has-text("Register Medikated")')
        .first();
      await card.locator("button").first().click({ force: true });
      await page.waitForTimeout(700);
      const s = await getStore(page);
      const status = s.tasks.find((t) => t.title === "Register Medikated")?.status;
      if (status !== "Done") throw new Error(`task not done: ${status}`);
    });

    await step(page, "matrix: delete task via X icon", async () => {
      const card = page
        .locator('[draggable="true"]:has-text("Test Platform")')
        .first();
      await card.locator('button[title="Delete task"]').click();
      const dialog = page.locator('.card:has-text("Delete task?")');
      await dialog.waitFor({ timeout: 4000 });
      await dialog.locator('button.btn-primary').click();
      await page.waitForTimeout(600);
      const s = await getStore(page);
      const n = s.tasks.filter((t) => t.title === "Test Platform").length;
      if (n !== 0) throw new Error(`task still present: ${n}`);
    });

    // --- Finance: log income, delete transaction ---
    await step(page, "go to Finance", async () => {
      await page.locator('.nav-item:has-text("Finance")').click();
      await page.waitForSelector('.page-title:has-text("Finance")');
    });

    await step(page, "open Log Income modal", async () => {
      // Topbar action button
      await page
        .locator('.top-actions button:has-text("Log income")')
        .click();
      await page.waitForSelector("text=Updates YTD totals");
    });

    await step(page, "fill + submit income", async () => {
      await page
        .locator('select')
        .first()
        .selectOption({ label: "Vibe Code" });
      await page.locator('input[type="number"]').fill("777");
      await page
        .locator('input[type="text"][placeholder*="MRR"]')
        .fill("UI test income");
      await page.locator('button:has-text("Log $777")').click();
      await page.waitForSelector("text=$777 logged", { timeout: 4000 });
      const s = await getStore(page);
      const n = s.transactions.filter((x) => x.note === "UI test income").length;
      if (n !== 1) throw new Error(`tx not persisted: ${n}`);
    });

    await step(page, "delete a transaction with confirm", async () => {
      const xBtn = page.locator('button[title="Delete transaction"]').first();
      await xBtn.click();
      const dialog = page.locator('.card:has-text("Delete $")');
      await dialog.waitFor({ timeout: 4000 });
      await dialog.locator('button.btn-primary').click();
      await page.waitForTimeout(600);
      const s = await getStore(page);
      const n = s.transactions.filter((x) => x.note === "UI test income").length;
      if (n !== 0) throw new Error(`tx still present: ${n}`);
    });

    // --- Esc closes modals ---
    await step(page, "Esc closes goal modal", async () => {
      await page.locator('button:has-text("New goal")').first().click();
      await page.waitForSelector("text=Step 1 of 3");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      const stillOpen = await page.locator("text=Step 1 of 3").count();
      if (stillOpen > 0) throw new Error("modal still open after Esc");
    });

    await step(page, "Esc closes goal drawer", async () => {
      await page.locator('.nav-item:has-text("Timeline")').click();
      await page.waitForSelector('.page-title:has-text("Timeline")');
      // Click first bar
      await page.locator('div[style*="border-radius: 11px"][style*="cursor: pointer"]').first().click();
      await page.waitForSelector("text=Funding progress");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      const stillOpen = await page.locator("text=Funding progress").count();
      if (stillOpen > 0) throw new Error("drawer still open after Esc");
    });

    // --- Settings reset ---
    await step(page, "settings: reset → custom dialog", async () => {
      await page.locator('.nav-item:has-text("Settings")').click();
      await page.waitForSelector('.page-title:has-text("Settings")');
      await page.locator('button:has-text("Reset data")').click();
      const dialog = page.locator('.card:has-text("Reset all data?")');
      await dialog.waitFor({ timeout: 4000 });
      await dialog.locator('button.btn-primary').click();
      await page.waitForTimeout(1500);
      const s = await getStore(page);
      if (s.goals.length !== 9)
        throw new Error(`expected 9 seed goals after reset, got ${s.goals.length}`);
    });

    // --- Goals screen: filter + card click ---
    await step(page, "go to Goals", async () => {
      await page.locator('.nav-item:has-text("Goals")').click();
      await page.waitForSelector('.page-title:has-text("Goals")');
    });

    await step(page, "Goals filter: Primary only", async () => {
      await page.locator('button:has-text("Primary focus")').click();
      await page.waitForTimeout(150);
      // Should show only primary goals. Seed has 3 Primary goals.
      const cards = await page
        .locator('.card[style*="cursor: pointer"]')
        .count();
      if (cards < 1) throw new Error(`no primary cards visible: ${cards}`);
    });

    await step(page, "Goals filter: Secondary", async () => {
      await page.locator('button:has-text("Secondary focus")').click();
      await page.waitForTimeout(150);
    });

    await step(page, "Goals filter: All", async () => {
      await page.locator('button:has-text("All goals")').click();
      await page.waitForTimeout(150);
    });

    await step(page, "open drawer via Goals card", async () => {
      await page.locator('text="Save $50k"').first().click();
      await page.waitForSelector("text=Funding progress");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    });

    // --- Timeline zoom ---
    await step(page, "Timeline zoom: Quarter", async () => {
      await page.locator('.nav-item:has-text("Timeline")').click();
      await page.waitForSelector('.page-title:has-text("Timeline")');
      await page.locator('button:has-text("Quarter")').click();
      await page.waitForTimeout(200);
    });
    await step(page, "Timeline zoom: Month", async () => {
      await page.locator('button:has-text("Month")').click();
      await page.waitForTimeout(200);
    });
    await step(page, "Timeline zoom: Year", async () => {
      await page.locator('button:has-text("Year")').click();
      await page.waitForTimeout(200);
    });

    // --- Finance: Categories filter dropdown + CSV export ---
    await step(page, "Finance CSV export downloads", async () => {
      await page.locator('.nav-item:has-text("Finance")').click();
      await page.waitForSelector('.page-title:has-text("Finance")');
      const dlPromise = page.waitForEvent("download");
      await page.locator('button:has-text("CSV")').first().click();
      const dl = await dlPromise;
      if (!dl.suggestedFilename().endsWith(".csv"))
        throw new Error("not a csv: " + dl.suggestedFilename());
    });

    // --- Matrix goal-filter dropdown ---
    await step(page, "Matrix goal-filter dropdown", async () => {
      await page.locator('.nav-item:has-text("Matrix")').click();
      await page.waitForSelector('.page-title:has-text("Eisenhower")');
      // Find the goal-filter select (it's the dropdown next to Filter label)
      const sel = page.locator('select').first();
      const before = await page
        .locator('[draggable="true"]')
        .count();
      await sel.selectOption({ label: "Raise $100k for Kala" });
      await page.waitForTimeout(200);
      const after = await page
        .locator('[draggable="true"]')
        .count();
      if (after >= before)
        throw new Error(`filter didn't shrink count: ${before} → ${after}`);
      await sel.selectOption({ label: "All goals" });
    });

    // --- Settings: JSON export ---
    await step(page, "Settings JSON export downloads", async () => {
      await page.locator('.nav-item:has-text("Settings")').click();
      const dlPromise = page.waitForEvent("download");
      await page.locator('button:has-text("JSON")').first().click();
      const dl = await dlPromise;
      if (!dl.suggestedFilename().endsWith(".json"))
        throw new Error("not json: " + dl.suggestedFilename());
    });

    // --- Timeline: days-of-week shown in Month zoom ---
    await step(page, "Timeline Month zoom: days-of-week visible", async () => {
      await page.locator('.nav-item:has-text("Timeline")').click();
      await page.waitForSelector('.page-title:has-text("Timeline")');
      await page.locator('button:has-text("Month")').click();
      await page.waitForTimeout(300);
      // Count weekday letter cells (each day cell shows S/M/T/W/T/F/S)
      const letters = await page
        .locator('div[style*="border-top"]:has-text("M")')
        .count();
      if (letters < 30)
        throw new Error(
          `expected many day cells, got ${letters}`,
        );
    });

    // --- Finance: new dual-stat tiles ---
    await step(page, "Finance shows Savings/Income/Expenses tiles", async () => {
      await page.locator('.nav-item:has-text("Finance")').click();
      await page.waitForSelector('.page-title:has-text("Finance")');
      const want = ["Savings", "Income", "Expenses"];
      for (const label of want) {
        const c = await page
          .locator(`.eyebrow:has-text("${label}")`)
          .count();
        if (c < 1) throw new Error(`missing tile: ${label}`);
      }
      // Check sub labels "Balance", "Target", "This month", "YTD" are present
      for (const label of ["Balance", "Target", "This month", "YTD"]) {
        const c = await page
          .locator(`text="${label}"`)
          .first()
          .count();
        if (c < 1) throw new Error(`missing sub-label: ${label}`);
      }
    });

    // --- Log expense flow ---
    await step(page, "Log expense modal opens", async () => {
      await page.locator('button:has-text("Log expense")').click();
      await page.waitForSelector("text=Tracks monthly + YTD spending");
    });

    await step(page, "submit expense", async () => {
      await page.locator('select').first().selectOption({ label: "Food" });
      await page.locator('input[type="number"]').fill("88");
      await page
        .locator('input[type="text"][placeholder*="rent"]')
        .fill("UI test expense");
      await page.locator('button:has-text("Log $88")').click();
      await page.waitForSelector("text=$88 expense logged", {
        timeout: 4000,
      });
      const s = await getStore(page);
      const n = s.transactions.filter(
        (x) => x.note === "UI test expense" && x.kind === "expense",
      ).length;
      if (n !== 1) throw new Error(`expense not persisted: ${n}`);
    });

    // --- View All transactions modal ---
    await step(page, "Recent income → View all modal", async () => {
      await page.locator('button:has-text("View all")').click();
      const modal = page.locator('.card:has-text("All transactions")');
      await modal.waitFor({ timeout: 4000 });
      // Filter to expense via the dialog's segmented control
      await modal.locator('button:has-text("expense")').click();
      await page.waitForTimeout(250);
      const expRowCount = await modal
        .locator('text="UI test expense"')
        .count();
      if (expRowCount < 1)
        throw new Error("expense not visible in View All");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
    });

    // --- Edit Task from Matrix ---
    await step(page, "Matrix: click task title → Edit modal", async () => {
      await page.locator('.nav-item:has-text("Matrix")').click();
      await page.waitForSelector('.page-title:has-text("Eisenhower")');
      // Click any task title — use one we know exists (post-reset seed)
      await page
        .locator('text="Make Pitch Deck"')
        .first()
        .click();
      await page.waitForSelector("text=Edit task");
    });

    await step(page, "Edit Task: change title + save", async () => {
      const input = page.locator('input[value="Make Pitch Deck"]');
      await input.fill("Make Pitch Deck (edited)");
      await page.locator('button:has-text("Save changes")').click();
      await page.waitForSelector("text=Task updated", { timeout: 4000 });
      const s = await getStore(page);
      const title = s.tasks.find((t) =>
        t.title.startsWith("Make Pitch Deck"),
      )?.title;
      if (!title?.includes("edited"))
        throw new Error(`task title not saved: ${title}`);
    });

    // --- Empty state ---
    await step(page, "empty state when no goals", async () => {
      // Wipe the store directly (faster than UI) then reload
      await page.evaluate((k) => {
        localStorage.setItem(
          k,
          JSON.stringify({
            goals: [],
            tasks: [],
            sources: [],
            transactions: [],
            monthly: {},
          }),
        );
      }, STORAGE_KEY);
      await page.reload({ waitUntil: "networkidle" });
      // We need a Timeline-route empty state. The route default is Timeline.
      await page.waitForSelector("text=No goals yet");
      await page.waitForSelector("text=Create your first goal");
    });

    // Reseed for next runs
    await resetDb(page);
  } catch (e) {
    console.error("\nABORTED:", e.message);
  } finally {
    if (consoleErrors.length) {
      console.log("\n— Console errors detected during run —");
      consoleErrors.forEach((e) => console.log("  " + e));
    }
    writeFileSync(
      `${SHOTS}/_report.json`,
      JSON.stringify({ results, consoleErrors }, null, 2),
    );
    await browser.close();
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(
    `\n${results.length - failed}/${results.length} passed${failed ? ", " + failed + " failed" : ""}`,
  );
  process.exit(failed > 0 ? 1 : 0);
})();
