export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type GoalStatus =
  | "Not Started"
  | "In Progress"
  | "At Risk"
  | "Overdue"
  | "Completed";

export type CategoryKey =
  | "Financial"
  | "Career"
  | "Education"
  | "Personal"
  | "Health";

export type FocusPeriod = "Primary" | "Secondary";

export type Importance = "Important" | "Not Important";
export type Urgency = "Urgent" | "Not Urgent";
export type TaskStatus = "To Do" | "In Progress" | "Done" | "Blocked";

export interface Goal {
  id: string;
  title: string;
  category: CategoryKey;
  start_date: string;
  target_date: string;
  financial_target: number;
  financial_current: number;
  focus_period: FocusPeriod;
  status: GoalStatus;
  note: string;
}

export interface Task {
  id: string;
  title: string;
  parent_goal: string;
  importance: Importance;
  urgency: Urgency;
  due_date: string;
  status: TaskStatus;
}

export type SourceCategory =
  | "Startup"
  | "Freelance"
  | "Grant"
  | "Contract"
  | "Side Business"
  | "Employment";

export interface IncomeSource {
  id: string;
  source_name: string;
  category: SourceCategory;
  projected_annual: number;
  actual_ytd: number;
  linked_goals: string[];
  actions: string;
}

export interface Transaction {
  id: string;
  date: string;
  source: string;
  amount: number;
  note: string;
  kind: "income" | "expense";
}

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Food",
  "Transport",
  "Utilities",
  "Healthcare",
  "Education",
  "Subscriptions",
  "Travel",
  "Entertainment",
  "Other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CAT_COLOR: Record<ExpenseCategory, string> = {
  Rent: "var(--cat-financial)",
  Food: "var(--cat-personal)",
  Transport: "var(--st-track)",
  Utilities: "var(--cat-education)",
  Healthcare: "var(--cat-health)",
  Education: "var(--cat-education)",
  Subscriptions: "var(--cat-career)",
  Travel: "var(--cat-personal)",
  Entertainment: "var(--st-risk)",
  Other: "var(--ink-3)",
};

export const CATEGORY: Record<
  CategoryKey,
  { label: string; color: string; wash: string }
> = {
  Financial: {
    label: "Financial",
    color: "var(--cat-financial)",
    wash: "var(--cat-financial-wash)",
  },
  Career: {
    label: "Career",
    color: "var(--cat-career)",
    wash: "var(--cat-career-wash)",
  },
  Education: {
    label: "Education",
    color: "var(--cat-education)",
    wash: "var(--cat-education-wash)",
  },
  Personal: {
    label: "Personal",
    color: "var(--cat-personal)",
    wash: "var(--cat-personal-wash)",
  },
  Health: {
    label: "Health",
    color: "var(--cat-health)",
    wash: "var(--cat-health-wash)",
  },
};

export const STATUS: Record<
  GoalStatus,
  { label: string; color: string; wash: string }
> = {
  "Not Started": {
    label: "Not Started",
    color: "var(--ink-3)",
    wash: "var(--surface-2)",
  },
  "In Progress": {
    label: "On Track",
    color: "var(--st-track)",
    wash: "var(--st-track-wash)",
  },
  "At Risk": {
    label: "At Risk",
    color: "var(--st-risk)",
    wash: "var(--st-risk-wash)",
  },
  Overdue: {
    label: "Overdue",
    color: "var(--st-over)",
    wash: "var(--st-over-wash)",
  },
  Completed: {
    label: "Completed",
    color: "var(--st-done)",
    wash: "var(--st-done-wash)",
  },
};

export const SOURCE_CAT: Record<SourceCategory, string> = {
  Startup: "var(--cat-career)",
  Freelance: "var(--cat-personal)",
  Grant: "var(--cat-education)",
  Contract: "var(--st-track)",
  "Side Business": "var(--cat-health)",
  Employment: "var(--ink-3)",
};

export const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const monthlyTarget = 56000;

const DAY = 86400000;
export function parseD(s: string): Date {
  const a = s.split("-");
  return new Date(+a[0], +a[1] - 1, +a[2]);
}
export function fmtMoney(n: number, opts?: { compact?: boolean }): string {
  const compact = opts?.compact;
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  let str: string;
  if (compact && v >= 1000) {
    if (v >= 1e6) str = (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + "M";
    else str = Math.round(v / 1000) + "K";
  } else {
    str = v.toLocaleString("en-US");
  }
  return sign + "$" + str;
}
export function fmtDate(s: string, opts?: "long"): string {
  const d = parseD(s);
  const m = monthLabels[d.getMonth()];
  if (opts === "long") return `${m} ${d.getDate()}, ${d.getFullYear()}`;
  return `${m} ${d.getDate()}`;
}
export function daysBetween(a: string, b: string): number {
  return Math.round((parseD(b).getTime() - parseD(a).getTime()) / DAY);
}

export function deriveGoalStatus(g: Goal, today: string): GoalStatus {
  if (g.status === "Completed") return "Completed";
  const pct = g.financial_target ? g.financial_current / g.financial_target : 0;
  const total = daysBetween(g.start_date, g.target_date);
  const elapsed = Math.max(0, Math.min(total, daysBetween(g.start_date, today)));
  const timePct = total > 0 ? elapsed / total : 1;
  const overdue = parseD(today) > parseD(g.target_date);
  if (overdue && pct < 1) return "Overdue";
  if (g.status === "Not Started") return "Not Started";
  if (pct + 0.12 < timePct) return "At Risk";
  return "In Progress";
}
