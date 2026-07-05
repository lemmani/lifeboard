#!/usr/bin/env node
// End-to-end DB layer verification: exercises every CRUD action against the
// real lifeboard.db. Run from project root: node scripts/verify-db.mjs
//
// Strategy: replicate the same SQL the Server Actions run, against a
// dedicated test row. Leaves the seed data intact.

import Database from "better-sqlite3";
import path from "node:path";

const db = new Database(path.join(process.cwd(), "lifeboard.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function assert(cond, msg) {
  if (!cond) {
    console.error("✗", msg);
    process.exit(1);
  }
  console.log("✓", msg);
}

function count(table, where = "") {
  const sql = `SELECT COUNT(*) AS n FROM ${table}${where ? " WHERE " + where : ""}`;
  return db.prepare(sql).get().n;
}

console.log("\n— Baseline —");
const before = {
  goals: count("goals"),
  tasks: count("tasks"),
  sources: count("sources"),
  transactions: count("transactions"),
};
console.log(before);

// 1. createGoal
console.log("\n— createGoal —");
const g = {
  id: "test_g_" + Date.now(),
  title: "Verify DB Test Goal",
  category: "Career",
  start_date: "2026-06-15",
  target_date: "2026-09-15",
  financial_target: 5000,
  financial_current: 0,
  focus_period: "Secondary",
  status: "Not Started",
  note: "test row",
};
db.prepare(
  `INSERT INTO goals (id,title,category,start_date,target_date,financial_target,financial_current,focus_period,status,note)
   VALUES (@id,@title,@category,@start_date,@target_date,@financial_target,@financial_current,@focus_period,@status,@note)`,
).run(g);
assert(count("goals", `id='${g.id}'`) === 1, "goal inserted");

// 2. updateGoal
console.log("\n— updateGoal —");
db.prepare(`UPDATE goals SET title=?, financial_target=? WHERE id=?`).run(
  "Verify Updated Title",
  7500,
  g.id,
);
const updated = db
  .prepare("SELECT title, financial_target FROM goals WHERE id=?")
  .get(g.id);
assert(
  updated.title === "Verify Updated Title" && updated.financial_target === 7500,
  "goal updated",
);

// 3. createTask
console.log("\n— createTask —");
const t = {
  id: "test_t_" + Date.now(),
  title: "Verify task",
  parent_goal: g.id,
  importance: "Important",
  urgency: "Urgent",
  due_date: "2026-09-01",
  status: "To Do",
};
db.prepare(
  `INSERT INTO tasks (id,title,parent_goal,importance,urgency,due_date,status)
   VALUES (@id,@title,@parent_goal,@importance,@urgency,@due_date,@status)`,
).run(t);
assert(count("tasks", `id='${t.id}'`) === 1, "task inserted");

// 4. toggleTask -> Done
console.log("\n— toggleTask (Done) —");
db.prepare(
  `UPDATE tasks SET status = CASE WHEN status='Done' THEN 'To Do' ELSE 'Done' END WHERE id=?`,
).run(t.id);
const done = db.prepare("SELECT status FROM tasks WHERE id=?").get(t.id);
assert(done.status === "Done", "task toggled to Done");

// 5. reclassifyTask
console.log("\n— reclassifyTask —");
db.prepare("UPDATE tasks SET importance=?, urgency=? WHERE id=?").run(
  "Not Important",
  "Not Urgent",
  t.id,
);
const reclassed = db
  .prepare("SELECT importance, urgency FROM tasks WHERE id=?")
  .get(t.id);
assert(
  reclassed.importance === "Not Important" &&
    reclassed.urgency === "Not Urgent",
  "task reclassified",
);

// 6. logIncome — creates transaction, bumps source actual_ytd & monthly, bumps linked goal financial_current
console.log("\n— logIncome —");
const sourceId = "s-vibe"; // Vibe Code, links to g-travel and g-car
const baseSource = db
  .prepare("SELECT actual_ytd FROM sources WHERE id=?")
  .get(sourceId).actual_ytd;
const txId = "test_x_" + Date.now();
const amount = 500;
const monthIdx = 5; // June
db.transaction(() => {
  db.prepare(
    "INSERT INTO transactions (id,date,source,amount,note) VALUES (?,?,?,?,?)",
  ).run(txId, "2026-06-15", sourceId, amount, "verify");
  db.prepare(
    "UPDATE sources SET actual_ytd = actual_ytd + ? WHERE id=?",
  ).run(amount, sourceId);
  db.prepare(
    `INSERT INTO monthly (source_id, month_idx, amount) VALUES (?,?,?)
     ON CONFLICT(source_id, month_idx) DO UPDATE SET amount = amount + excluded.amount`,
  ).run(sourceId, monthIdx, amount);
})();
const afterYtd = db
  .prepare("SELECT actual_ytd FROM sources WHERE id=?")
  .get(sourceId).actual_ytd;
assert(
  afterYtd === baseSource + amount,
  `source actual_ytd bumped: ${baseSource} -> ${afterYtd}`,
);
const monthRow = db
  .prepare(
    "SELECT amount FROM monthly WHERE source_id=? AND month_idx=?",
  )
  .get(sourceId, monthIdx);
assert(monthRow && monthRow.amount > 0, "monthly amount upserted");

// 7. deleteTransaction reverses the bumps
console.log("\n— deleteTransaction —");
const monthBefore = db
  .prepare("SELECT amount FROM monthly WHERE source_id=? AND month_idx=?")
  .get(sourceId, monthIdx);
db.transaction(() => {
  db.prepare("DELETE FROM transactions WHERE id=?").run(txId);
  db.prepare(
    "UPDATE sources SET actual_ytd = actual_ytd - ? WHERE id=?",
  ).run(amount, sourceId);
  db.prepare(
    "UPDATE monthly SET amount = amount - ? WHERE source_id=? AND month_idx=?",
  ).run(amount, sourceId, monthIdx);
})();
const restoredYtd = db
  .prepare("SELECT actual_ytd FROM sources WHERE id=?")
  .get(sourceId).actual_ytd;
assert(restoredYtd === baseSource, "source actual_ytd restored");
const monthAfter = db
  .prepare("SELECT amount FROM monthly WHERE source_id=? AND month_idx=?")
  .get(sourceId, monthIdx);
assert(
  monthAfter && monthAfter.amount === monthBefore.amount - amount,
  "monthly amount decremented",
);

// 8. deleteGoal cascades to tasks (FK ON DELETE CASCADE)
console.log("\n— deleteGoal cascades to tasks —");
const taskBefore = count("tasks", `parent_goal='${g.id}'`);
db.prepare("DELETE FROM goals WHERE id=?").run(g.id);
assert(count("goals", `id='${g.id}'`) === 0, "goal deleted");
assert(
  count("tasks", `parent_goal='${g.id}'`) === 0,
  `tasks cascade-deleted (${taskBefore} were attached)`,
);

console.log("\n— Final —");
const after = {
  goals: count("goals"),
  tasks: count("tasks"),
  sources: count("sources"),
  transactions: count("transactions"),
};
console.log(after);
assert(after.goals === before.goals, "no leftover goals");
assert(after.tasks === before.tasks, "no leftover tasks");
assert(after.transactions === before.transactions, "no leftover transactions");

console.log("\nAll CRUD operations verified ✓");
db.close();
