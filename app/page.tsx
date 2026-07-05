"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { LifeBoardApp } from "./components/lifeboard-app";
import { SAVINGS_GOAL_ID, todayISO } from "./lib/data";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "./lib/store";


export default function Page() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The build-time prerender bakes a date into the HTML; rendering only after
  // mount keeps hydration clean on any later day and avoids flashing seed
  // data at returning visitors before localStorage loads.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);
  if (!today) return null;

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
      today={today}
      goals={goals}
      tasks={snap.tasks}
      sources={snap.sources}
      transactions={snap.transactions}
      monthly={snap.monthly}
    />
  );
}
