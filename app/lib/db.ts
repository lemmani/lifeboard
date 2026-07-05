import "server-only";
import Database from "better-sqlite3";
import path from "node:path";
import {
  goals as seedGoals,
  monthly as seedMonthly,
  sources as seedSources,
  tasks as seedTasks,
  transactions as seedTransactions,
  type Goal,
  type IncomeSource,
  type Task,
  type Transaction,
} from "./data";

const DB_PATH = path.join(process.cwd(), "lifeboard.db");

// Reuse one connection across HMR / dev reloads.
const globalForDb = globalThis as unknown as { __lbDb?: Database.Database };

function open(): Database.Database {
  if (globalForDb.__lbDb) return globalForDb.__lbDb;
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  init(db);
  globalForDb.__lbDb = db;
  return db;
}

function init(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      start_date TEXT NOT NULL,
      target_date TEXT NOT NULL,
      financial_target REAL NOT NULL DEFAULT 0,
      financial_current REAL NOT NULL DEFAULT 0,
      focus_period TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      parent_goal TEXT NOT NULL,
      importance TEXT NOT NULL,
      urgency TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_goal) REFERENCES goals(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      category TEXT NOT NULL,
      projected_annual REAL NOT NULL DEFAULT 0,
      actual_ytd REAL NOT NULL DEFAULT 0,
      linked_goals TEXT NOT NULL DEFAULT '[]',
      actions TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      source TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'income',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS monthly (
      source_id TEXT NOT NULL,
      month_idx INTEGER NOT NULL,
      amount REAL NOT NULL,
      PRIMARY KEY (source_id, month_idx)
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(parent_goal);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  `);

  // Add kind column to legacy databases that pre-date the income/expense split.
  const cols = db
    .prepare("PRAGMA table_info(transactions)")
    .all() as { name: string }[];
  if (!cols.find((c) => c.name === "kind")) {
    db.exec(
      "ALTER TABLE transactions ADD COLUMN kind TEXT NOT NULL DEFAULT 'income'",
    );
  }
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_transactions_kind ON transactions(kind)",
  );

  const count = (db.prepare("SELECT COUNT(*) AS n FROM goals").get() as {
    n: number;
  }).n;
  if (count === 0) seedDb(db);
}

function seedDb(db: Database.Database) {
  const insGoal = db.prepare(`
    INSERT INTO goals (id,title,category,start_date,target_date,financial_target,financial_current,focus_period,status,note)
    VALUES (@id,@title,@category,@start_date,@target_date,@financial_target,@financial_current,@focus_period,@status,@note)
  `);
  const insTask = db.prepare(`
    INSERT INTO tasks (id,title,parent_goal,importance,urgency,due_date,status)
    VALUES (@id,@title,@parent_goal,@importance,@urgency,@due_date,@status)
  `);
  const insSource = db.prepare(`
    INSERT INTO sources (id,source_name,category,projected_annual,actual_ytd,linked_goals,actions)
    VALUES (@id,@source_name,@category,@projected_annual,@actual_ytd,@linked_goals,@actions)
  `);
  const insTx = db.prepare(`
    INSERT INTO transactions (id,date,source,amount,note,kind)
    VALUES (@id,@date,@source,@amount,@note,@kind)
  `);
  const insMonthly = db.prepare(`
    INSERT INTO monthly (source_id, month_idx, amount) VALUES (?,?,?)
  `);

  db.transaction(() => {
    seedGoals.forEach((g) => insGoal.run(g));
    seedTasks.forEach((t) => insTask.run(t));
    seedSources.forEach((s) =>
      insSource.run({ ...s, linked_goals: JSON.stringify(s.linked_goals) }),
    );
    seedTransactions.forEach((x) => insTx.run(x));
    Object.entries(seedMonthly).forEach(([sid, arr]) => {
      arr.forEach((amt, i) => {
        if (amt > 0) insMonthly.run(sid, i, amt);
      });
    });
  })();
}

interface SourceRow {
  id: string;
  source_name: string;
  category: string;
  projected_annual: number;
  actual_ytd: number;
  linked_goals: string;
  actions: string;
}

export interface DbSnapshot {
  goals: Goal[];
  tasks: Task[];
  sources: IncomeSource[];
  transactions: Transaction[];
  monthly: Record<string, number[]>;
}

export function getSnapshot(): DbSnapshot {
  const db = open();
  const goals = db
    .prepare("SELECT * FROM goals ORDER BY created_at ASC")
    .all() as Goal[];
  const tasks = db
    .prepare("SELECT * FROM tasks ORDER BY created_at ASC")
    .all() as Task[];
  const sourceRows = db
    .prepare("SELECT * FROM sources ORDER BY source_name ASC")
    .all() as SourceRow[];
  const transactions = db
    .prepare("SELECT * FROM transactions ORDER BY date DESC, created_at DESC")
    .all() as Transaction[];
  const monthlyRows = db
    .prepare("SELECT source_id, month_idx, amount FROM monthly")
    .all() as { source_id: string; month_idx: number; amount: number }[];

  const sources: IncomeSource[] = sourceRows.map((s) => ({
    ...s,
    linked_goals: JSON.parse(s.linked_goals) as string[],
    category: s.category as IncomeSource["category"],
  }));

  const monthly: Record<string, number[]> = {};
  monthlyRows.forEach((m) => {
    if (!monthly[m.source_id])
      monthly[m.source_id] = new Array(12).fill(0) as number[];
    monthly[m.source_id][m.month_idx] = m.amount;
  });

  return { goals, tasks, sources, transactions, monthly };
}

export function db() {
  return open();
}

export function newId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}
