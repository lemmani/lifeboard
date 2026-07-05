"use client";

import { useSyncExternalStore } from "react";
import { LifeBoardApp } from "./components/lifeboard-app";
import { todayISO } from "./lib/data";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "./lib/store";

const SAVINGS_GOAL_ID = "g-save";

export default function Page() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
