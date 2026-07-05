import { LifeBoardApp } from "./components/lifeboard-app";
import { getSnapshot } from "./lib/db";
import { todayISO } from "./lib/data";

export const dynamic = "force-dynamic";

const SAVINGS_GOAL_ID = "g-save";

export default function Page() {
  const snap = getSnapshot();

  // Savings balance is a derived quantity: every logged income raises it,
  // every logged expense lowers it. Override the savings goal's stored
  // financial_current so every screen (tiles, drawer, funding panel, status
  // derivation) shows the same number.
  const totalIncome = snap.transactions
    .filter((x) => x.kind === "income")
    .reduce((a, x) => a + x.amount, 0);
  const totalExpense = snap.transactions
    .filter((x) => x.kind === "expense")
    .reduce((a, x) => a + x.amount, 0);
  const savingsBalance = Math.max(0, totalIncome - totalExpense);
  const goals = snap.goals.map((g) =>
    g.id === SAVINGS_GOAL_ID
      ? { ...g, financial_current: savingsBalance }
      : g,
  );

  return (
    <LifeBoardApp
      today={todayISO()}
      goals={goals}
      tasks={snap.tasks}
      sources={snap.sources}
      transactions={snap.transactions}
      monthly={snap.monthly}
    />
  );
}
