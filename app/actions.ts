"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./lib/db";
import {
  parseD,
  type ExpenseCategory,
  type Goal,
  type Importance,
  type Task,
  type Urgency,
} from "./lib/data";

function bumpUI() {
  revalidatePath("/");
}

export async function createGoal(
  goal: Omit<Goal, "id">,
  newTasks: Omit<Task, "id" | "parent_goal">[],
): Promise<{ id: string }> {
  const id = newId("g_");
  const insG = db().prepare(`
    INSERT INTO goals (id,title,category,start_date,target_date,financial_target,financial_current,focus_period,status,note)
    VALUES (@id,@title,@category,@start_date,@target_date,@financial_target,@financial_current,@focus_period,@status,@note)
  `);
  const insT = db().prepare(`
    INSERT INTO tasks (id,title,parent_goal,importance,urgency,due_date,status)
    VALUES (@id,@title,@parent_goal,@importance,@urgency,@due_date,@status)
  `);
  db().transaction(() => {
    insG.run({ ...goal, id });
    newTasks.forEach((t) =>
      insT.run({ ...t, id: newId("t_"), parent_goal: id }),
    );
  })();
  bumpUI();
  return { id };
}

export async function updateGoal(goal: Goal): Promise<void> {
  db()
    .prepare(
      `UPDATE goals SET title=@title, category=@category, start_date=@start_date,
        target_date=@target_date, financial_target=@financial_target,
        financial_current=@financial_current, focus_period=@focus_period,
        status=@status, note=@note
        WHERE id=@id`,
    )
    .run(goal);
  bumpUI();
}

export async function deleteGoal(id: string): Promise<void> {
  db().prepare("DELETE FROM goals WHERE id=?").run(id);
  bumpUI();
}

export async function createTask(
  task: Omit<Task, "id">,
): Promise<{ id: string }> {
  const id = newId("t_");
  db()
    .prepare(
      `INSERT INTO tasks (id,title,parent_goal,importance,urgency,due_date,status)
       VALUES (@id,@title,@parent_goal,@importance,@urgency,@due_date,@status)`,
    )
    .run({ ...task, id });
  bumpUI();
  return { id };
}

export async function toggleTask(id: string): Promise<void> {
  db()
    .prepare(
      `UPDATE tasks
       SET status = CASE WHEN status='Done' THEN 'To Do' ELSE 'Done' END
       WHERE id=?`,
    )
    .run(id);
  bumpUI();
}

export async function reclassifyTask(
  id: string,
  importance: Importance,
  urgency: Urgency,
): Promise<void> {
  db()
    .prepare("UPDATE tasks SET importance=?, urgency=? WHERE id=?")
    .run(importance, urgency, id);
  bumpUI();
}

export async function deleteTask(id: string): Promise<void> {
  db().prepare("DELETE FROM tasks WHERE id=?").run(id);
  bumpUI();
}

export async function logIncome(p: {
  sourceId: string;
  amount: number;
  date: string;
  note: string;
}): Promise<{ id: string; linkedGoals: string[] }> {
  const id = newId("x_");
  const monthIdx = parseD(p.date).getMonth();
  const sourceRow = db()
    .prepare("SELECT linked_goals FROM sources WHERE id=?")
    .get(p.sourceId) as { linked_goals: string } | undefined;
  const linkedGoals: string[] = sourceRow
    ? (JSON.parse(sourceRow.linked_goals) as string[])
    : [];

  db().transaction(() => {
    db()
      .prepare(
        "INSERT INTO transactions (id,date,source,amount,note,kind) VALUES (?,?,?,?,?, 'income')",
      )
      .run(id, p.date, p.sourceId, p.amount, p.note);
    db()
      .prepare(
        "UPDATE sources SET actual_ytd = actual_ytd + ? WHERE id=?",
      )
      .run(p.amount, p.sourceId);
    db()
      .prepare(
        `INSERT INTO monthly (source_id, month_idx, amount) VALUES (?,?,?)
         ON CONFLICT(source_id, month_idx) DO UPDATE SET amount = amount + excluded.amount`,
      )
      .run(p.sourceId, monthIdx, p.amount);
    if (linkedGoals.length) {
      const share = p.amount / linkedGoals.length;
      const upd = db().prepare(
        `UPDATE goals
         SET financial_current = MIN(financial_target, financial_current + ?),
             status = CASE WHEN status='Not Started' THEN 'In Progress' ELSE status END
         WHERE id=? AND financial_target > 0`,
      );
      linkedGoals.forEach((gid) => upd.run(share, gid));
    }
  })();
  bumpUI();
  return { id, linkedGoals };
}

export async function logExpense(p: {
  category: ExpenseCategory;
  amount: number;
  date: string;
  note: string;
}): Promise<{ id: string }> {
  const id = newId("e_");
  db()
    .prepare(
      "INSERT INTO transactions (id,date,source,amount,note,kind) VALUES (?,?,?,?,?, 'expense')",
    )
    .run(id, p.date, p.category, p.amount, p.note);
  bumpUI();
  return { id };
}

export async function updateTask(t: Task): Promise<void> {
  db()
    .prepare(
      `UPDATE tasks SET title=@title, importance=@importance, urgency=@urgency,
         due_date=@due_date, status=@status WHERE id=@id`,
    )
    .run(t);
  bumpUI();
}

export async function updateGoalSources(
  goalId: string,
  sourceIds: string[],
): Promise<void> {
  const allSources = db()
    .prepare("SELECT id, linked_goals FROM sources")
    .all() as { id: string; linked_goals: string }[];
  const want = new Set(sourceIds);
  db().transaction(() => {
    const upd = db().prepare(
      "UPDATE sources SET linked_goals=? WHERE id=?",
    );
    allSources.forEach((s) => {
      const linked = new Set(JSON.parse(s.linked_goals) as string[]);
      const wasLinked = linked.has(goalId);
      const shouldBeLinked = want.has(s.id);
      if (wasLinked === shouldBeLinked) return;
      if (shouldBeLinked) linked.add(goalId);
      else linked.delete(goalId);
      upd.run(JSON.stringify([...linked]), s.id);
    });
  })();
  bumpUI();
}

export async function deleteTransaction(id: string): Promise<void> {
  const tx = db()
    .prepare(
      "SELECT date, source, amount, kind FROM transactions WHERE id=?",
    )
    .get(id) as
    | { date: string; source: string; amount: number; kind: string }
    | undefined;
  if (!tx) return;
  if (tx.kind === "expense") {
    db().prepare("DELETE FROM transactions WHERE id=?").run(id);
    bumpUI();
    return;
  }
  const monthIdx = parseD(tx.date).getMonth();
  const sourceRow = db()
    .prepare("SELECT linked_goals FROM sources WHERE id=?")
    .get(tx.source) as { linked_goals: string } | undefined;
  const linkedGoals: string[] = sourceRow
    ? (JSON.parse(sourceRow.linked_goals) as string[])
    : [];
  db().transaction(() => {
    db().prepare("DELETE FROM transactions WHERE id=?").run(id);
    db()
      .prepare("UPDATE sources SET actual_ytd = actual_ytd - ? WHERE id=?")
      .run(tx.amount, tx.source);
    db()
      .prepare(
        `UPDATE monthly SET amount = amount - ?
         WHERE source_id=? AND month_idx=?`,
      )
      .run(tx.amount, tx.source, monthIdx);
    db()
      .prepare(
        "DELETE FROM monthly WHERE source_id=? AND month_idx=? AND amount<=0",
      )
      .run(tx.source, monthIdx);
    if (linkedGoals.length) {
      const share = tx.amount / linkedGoals.length;
      const upd = db().prepare(
        `UPDATE goals SET financial_current = MAX(0, financial_current - ?) WHERE id=?`,
      );
      linkedGoals.forEach((gid) => upd.run(share, gid));
    }
  })();
  bumpUI();
}

export async function resetDatabase(): Promise<void> {
  db().exec(`
    DELETE FROM monthly;
    DELETE FROM transactions;
    DELETE FROM tasks;
    DELETE FROM sources;
    DELETE FROM goals;
  `);
  // Drop the cached connection so the next access re-runs the seed.
  const g = globalThis as unknown as { __lbDb?: { close: () => void } };
  if (g.__lbDb) {
    g.__lbDb.close();
    g.__lbDb = undefined;
  }
  bumpUI();
}
