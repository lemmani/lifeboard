#!/usr/bin/env node
// One-shot migration: read lifeboard.db (SQLite) and emit app/lib/seed.json
// in the shape the client-side store expects.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB = path.join(ROOT, "lifeboard.db");
const OUT = path.join(ROOT, "app/lib/seed.json");

function q(sql) {
  const raw = execFileSync("sqlite3", ["-json", DB, sql], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return raw.trim() ? JSON.parse(raw) : [];
}

const goals = q("SELECT id,title,category,start_date,target_date,financial_target,financial_current,focus_period,status,note FROM goals ORDER BY created_at ASC");
const tasks = q("SELECT id,title,parent_goal,importance,urgency,due_date,status FROM tasks ORDER BY created_at ASC");
const sourceRows = q("SELECT id,source_name,category,projected_annual,actual_ytd,linked_goals,actions FROM sources ORDER BY source_name ASC");
const transactions = q("SELECT id,date,source,amount,note,kind FROM transactions ORDER BY date DESC, created_at DESC");
const monthlyRows = q("SELECT source_id,month_idx,amount FROM monthly");

const sources = sourceRows.map((s) => ({
  ...s,
  linked_goals: JSON.parse(s.linked_goals || "[]"),
}));

const monthly = {};
for (const m of monthlyRows) {
  if (!monthly[m.source_id]) monthly[m.source_id] = new Array(12).fill(0);
  monthly[m.source_id][m.month_idx] = m.amount;
}

const seed = { goals, tasks, sources, transactions, monthly };
writeFileSync(OUT, JSON.stringify(seed, null, 2) + "\n");

console.log(`Wrote ${OUT}`);
console.log(`  goals: ${goals.length}`);
console.log(`  tasks: ${tasks.length}`);
console.log(`  sources: ${sources.length}`);
console.log(`  transactions: ${transactions.length}`);
console.log(`  monthly entries: ${monthlyRows.length}`);
