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

export interface DbSnapshot {
  goals: Goal[];
  tasks: Task[];
  sources: IncomeSource[];
  transactions: Transaction[];
  monthly: Record<string, number[]>;
}

const STORAGE_KEY = "lifeboard.v1";

function seedSnapshot(): DbSnapshot {
  return {
    goals: seedGoals.map((g) => ({ ...g })),
    tasks: seedTasks.map((t) => ({ ...t })),
    sources: seedSources.map((s) => ({ ...s, linked_goals: [...s.linked_goals] })),
    transactions: seedTransactions.map((x) => ({ ...x })),
    monthly: Object.fromEntries(
      Object.entries(seedMonthly).map(([k, v]) => [k, [...v]]),
    ),
  };
}

let current: DbSnapshot = seedSnapshot();
let hydrated = false;
const listeners = new Set<() => void>();

function hydrateFromStorage() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DbSnapshot;
      if (parsed && parsed.goals && parsed.tasks && parsed.sources) {
        current = parsed;
      }
    }
  } catch {
    // Corrupt storage — fall back to seed. Don't erase what's there in case
    // the user recovers it manually.
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Quota exceeded or storage disabled — silently drop; UI keeps working
    // in-memory for the session.
  }
}

export function getSnapshot(): DbSnapshot {
  hydrateFromStorage();
  return current;
}

export function getServerSnapshot(): DbSnapshot {
  return current;
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setSnapshot(next: DbSnapshot): void {
  current = next;
  persist();
  listeners.forEach((cb) => cb());
}

export function updateSnapshot(fn: (snap: DbSnapshot) => DbSnapshot): void {
  setSnapshot(fn(getSnapshot()));
}

export function resetToSeed(): void {
  setSnapshot(seedSnapshot());
}

export function newId(prefix: string): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.floor(Math.random() * 1e6).toString(36)
  );
}
