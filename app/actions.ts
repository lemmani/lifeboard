import {
  parseD,
  type ExpenseCategory,
  type Goal,
  type Importance,
  type Task,
  type Urgency,
} from "./lib/data";
import { getSnapshot, newId, resetToSeed, setSnapshot } from "./lib/store";

export async function createGoal(
  goal: Omit<Goal, "id">,
  newTasks: Omit<Task, "id" | "parent_goal">[],
): Promise<{ id: string }> {
  const id = newId("g_");
  const snap = getSnapshot();
  const nextGoals = [...snap.goals, { ...goal, id } as Goal];
  const nextTasks = [
    ...snap.tasks,
    ...newTasks.map(
      (t) =>
        ({
          ...t,
          id: newId("t_"),
          parent_goal: id,
        }) as Task,
    ),
  ];
  setSnapshot({ ...snap, goals: nextGoals, tasks: nextTasks });
  return { id };
}

export async function updateGoal(goal: Goal): Promise<void> {
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    goals: snap.goals.map((g) => (g.id === goal.id ? goal : g)),
  });
}

export async function deleteGoal(id: string): Promise<void> {
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    goals: snap.goals.filter((g) => g.id !== id),
    tasks: snap.tasks.filter((t) => t.parent_goal !== id),
    sources: snap.sources.map((s) =>
      s.linked_goals.includes(id)
        ? { ...s, linked_goals: s.linked_goals.filter((lg) => lg !== id) }
        : s,
    ),
  });
}

export async function createTask(
  task: Omit<Task, "id">,
): Promise<{ id: string }> {
  const id = newId("t_");
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    tasks: [...snap.tasks, { ...task, id } as Task],
  });
  return { id };
}

export async function toggleTask(id: string): Promise<void> {
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    tasks: snap.tasks.map((t) =>
      t.id === id
        ? { ...t, status: t.status === "Done" ? "To Do" : "Done" }
        : t,
    ),
  });
}

export async function reclassifyTask(
  id: string,
  importance: Importance,
  urgency: Urgency,
): Promise<void> {
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    tasks: snap.tasks.map((t) =>
      t.id === id ? { ...t, importance, urgency } : t,
    ),
  });
}

export async function deleteTask(id: string): Promise<void> {
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    tasks: snap.tasks.filter((t) => t.id !== id),
  });
}

export async function updateTask(t: Task): Promise<void> {
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    tasks: snap.tasks.map((existing) => (existing.id === t.id ? t : existing)),
  });
}

export async function logIncome(p: {
  sourceId: string;
  amount: number;
  date: string;
  note: string;
}): Promise<{ id: string; linkedGoals: string[] }> {
  const id = newId("x_");
  const monthIdx = parseD(p.date).getMonth();
  const snap = getSnapshot();
  const source = snap.sources.find((s) => s.id === p.sourceId);
  const linkedGoals = source ? [...source.linked_goals] : [];

  const nextTx = [
    ...snap.transactions,
    {
      id,
      date: p.date,
      source: p.sourceId,
      amount: p.amount,
      note: p.note,
      kind: "income" as const,
    },
  ];

  const nextSources = snap.sources.map((s) =>
    s.id === p.sourceId
      ? { ...s, actual_ytd: s.actual_ytd + p.amount }
      : s,
  );

  const existing = snap.monthly[p.sourceId] ?? new Array(12).fill(0);
  const bumped = [...existing];
  bumped[monthIdx] = (bumped[monthIdx] ?? 0) + p.amount;
  const nextMonthly = { ...snap.monthly, [p.sourceId]: bumped };

  let nextGoals = snap.goals;
  if (linkedGoals.length) {
    const share = p.amount / linkedGoals.length;
    const targets = new Set(linkedGoals);
    nextGoals = snap.goals.map((g) => {
      if (!targets.has(g.id) || g.financial_target <= 0) return g;
      return {
        ...g,
        financial_current: Math.min(
          g.financial_target,
          g.financial_current + share,
        ),
        status: g.status === "Not Started" ? "In Progress" : g.status,
      };
    });
  }

  setSnapshot({
    ...snap,
    goals: nextGoals,
    sources: nextSources,
    transactions: nextTx,
    monthly: nextMonthly,
  });
  return { id, linkedGoals };
}

export async function logExpense(p: {
  category: ExpenseCategory;
  amount: number;
  date: string;
  note: string;
}): Promise<{ id: string }> {
  const id = newId("e_");
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    transactions: [
      ...snap.transactions,
      {
        id,
        date: p.date,
        source: p.category,
        amount: p.amount,
        note: p.note,
        kind: "expense" as const,
      },
    ],
  });
  return { id };
}

export async function updateGoalSources(
  goalId: string,
  sourceIds: string[],
): Promise<void> {
  const want = new Set(sourceIds);
  const snap = getSnapshot();
  setSnapshot({
    ...snap,
    sources: snap.sources.map((s) => {
      const wasLinked = s.linked_goals.includes(goalId);
      const shouldBeLinked = want.has(s.id);
      if (wasLinked === shouldBeLinked) return s;
      const nextLinked = new Set(s.linked_goals);
      if (shouldBeLinked) nextLinked.add(goalId);
      else nextLinked.delete(goalId);
      return { ...s, linked_goals: [...nextLinked] };
    }),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  const snap = getSnapshot();
  const tx = snap.transactions.find((x) => x.id === id);
  if (!tx) return;

  if (tx.kind === "expense") {
    setSnapshot({
      ...snap,
      transactions: snap.transactions.filter((x) => x.id !== id),
    });
    return;
  }

  const monthIdx = parseD(tx.date).getMonth();
  const source = snap.sources.find((s) => s.id === tx.source);
  const linkedGoals = source ? [...source.linked_goals] : [];

  const nextSources = snap.sources.map((s) =>
    s.id === tx.source
      ? { ...s, actual_ytd: s.actual_ytd - tx.amount }
      : s,
  );

  const nextMonthly = { ...snap.monthly };
  const bucket = nextMonthly[tx.source]
    ? [...nextMonthly[tx.source]]
    : new Array(12).fill(0);
  bucket[monthIdx] = (bucket[monthIdx] ?? 0) - tx.amount;
  if (bucket.every((v) => v <= 0)) delete nextMonthly[tx.source];
  else nextMonthly[tx.source] = bucket;

  let nextGoals = snap.goals;
  if (linkedGoals.length) {
    const share = tx.amount / linkedGoals.length;
    const targets = new Set(linkedGoals);
    nextGoals = snap.goals.map((g) =>
      targets.has(g.id)
        ? { ...g, financial_current: Math.max(0, g.financial_current - share) }
        : g,
    );
  }

  setSnapshot({
    ...snap,
    goals: nextGoals,
    sources: nextSources,
    transactions: snap.transactions.filter((x) => x.id !== id),
    monthly: nextMonthly,
  });
}

export async function resetDatabase(): Promise<void> {
  resetToSeed();
}
