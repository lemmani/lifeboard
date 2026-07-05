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

export const goals: Goal[] = [
  {
    id: "g-rent",
    title: "Rent a House",
    category: "Personal",
    start_date: "2026-01-06",
    target_date: "2026-03-31",
    financial_target: 1000,
    financial_current: 1000,
    focus_period: "Primary",
    status: "Completed",
    note: "Secure a stable home base for the year.",
  },
  {
    id: "g-travel",
    title: "Travel to Several Countries",
    category: "Personal",
    start_date: "2026-01-06",
    target_date: "2026-06-30",
    financial_target: 10000,
    financial_current: 6200,
    focus_period: "Primary",
    status: "At Risk",
    note: "Visit partners, conferences and a couple of personal trips.",
  },
  {
    id: "g-raise",
    title: "Raise $1M / 30K MRR",
    category: "Career",
    start_date: "2026-01-06",
    target_date: "2026-12-18",
    financial_target: 1000000,
    financial_current: 182000,
    focus_period: "Primary",
    status: "In Progress",
    note: "Close a $1M round across Send Me & Kala, hit $30K MRR.",
  },
  {
    id: "g-car",
    title: "Buy a Car",
    category: "Financial",
    start_date: "2026-04-01",
    target_date: "2026-12-20",
    financial_target: 30000,
    financial_current: 9500,
    focus_period: "Secondary",
    status: "In Progress",
    note: "Reliable vehicle for mobility across ventures.",
  },
  {
    id: "g-save",
    title: "$50K in Savings",
    category: "Financial",
    start_date: "2026-01-06",
    target_date: "2026-12-31",
    financial_target: 50000,
    financial_current: 21000,
    focus_period: "Secondary",
    status: "In Progress",
    note: "Build a 12-month personal runway.",
  },
  {
    id: "g-masters",
    title: "Complete Two Masters",
    category: "Education",
    start_date: "2026-07-01",
    target_date: "2026-12-31",
    financial_target: 10000,
    financial_current: 3500,
    focus_period: "Secondary",
    status: "Not Started",
    note: "Apply, enroll and fund two graduate programs.",
  },
];

export const tasks: Task[] = [
  { id: "t1", title: "Send investor deck to Chanzo Capital", parent_goal: "g-raise", importance: "Important", urgency: "Urgent", due_date: "2026-06-16", status: "To Do" },
  { id: "t2", title: "Follow up with Digital Africa", parent_goal: "g-raise", importance: "Important", urgency: "Urgent", due_date: "2026-06-15", status: "In Progress" },
  { id: "t3", title: "Update the financial model", parent_goal: "g-raise", importance: "Important", urgency: "Not Urgent", due_date: "2026-06-25", status: "To Do" },
  { id: "t4", title: "Prepare the investor data room", parent_goal: "g-raise", importance: "Important", urgency: "Not Urgent", due_date: "2026-07-10", status: "To Do" },
  { id: "t5", title: "Schedule intro with South African angel", parent_goal: "g-raise", importance: "Not Important", urgency: "Urgent", due_date: "2026-06-17", status: "To Do" },
  { id: "t6", title: "Renew passport before it expires", parent_goal: "g-travel", importance: "Important", urgency: "Urgent", due_date: "2026-06-18", status: "To Do" },
  { id: "t7", title: "Book Q2 flights before prices rise", parent_goal: "g-travel", importance: "Important", urgency: "Urgent", due_date: "2026-06-20", status: "To Do" },
  { id: "t8", title: "Research visa requirements", parent_goal: "g-travel", importance: "Important", urgency: "Not Urgent", due_date: "2026-07-01", status: "To Do" },
  { id: "t9", title: "Build a travel mood board", parent_goal: "g-travel", importance: "Not Important", urgency: "Not Urgent", due_date: "2026-08-01", status: "To Do" },
  { id: "t10", title: "Request recommendation letters", parent_goal: "g-masters", importance: "Important", urgency: "Urgent", due_date: "2026-06-16", status: "To Do" },
  { id: "t11", title: "Submit application essays", parent_goal: "g-masters", importance: "Important", urgency: "Urgent", due_date: "2026-06-22", status: "To Do" },
  { id: "t12", title: "Map scholarship deadlines", parent_goal: "g-masters", importance: "Important", urgency: "Not Urgent", due_date: "2026-08-01", status: "To Do" },
  { id: "t13", title: "Organize course-notes folder", parent_goal: "g-masters", importance: "Not Important", urgency: "Not Urgent", due_date: "2026-09-01", status: "To Do" },
  { id: "t14", title: "Automate weekly savings transfer", parent_goal: "g-save", importance: "Important", urgency: "Not Urgent", due_date: "2026-07-01", status: "To Do" },
  { id: "t15", title: "Review subscriptions to cut", parent_goal: "g-save", importance: "Not Important", urgency: "Urgent", due_date: "2026-06-19", status: "To Do" },
  { id: "t16", title: "Cancel unused gym membership", parent_goal: "g-save", importance: "Not Important", urgency: "Not Urgent", due_date: "2026-07-15", status: "To Do" },
  { id: "t17", title: "Set aside $2k toward the car", parent_goal: "g-car", importance: "Important", urgency: "Urgent", due_date: "2026-06-30", status: "To Do" },
  { id: "t18", title: "Compare financing options", parent_goal: "g-car", importance: "Important", urgency: "Not Urgent", due_date: "2026-09-01", status: "To Do" },
  { id: "t19", title: "Test-drive the shortlist", parent_goal: "g-car", importance: "Not Important", urgency: "Not Urgent", due_date: "2026-10-01", status: "To Do" },
  { id: "t20", title: "Sign the lease agreement", parent_goal: "g-rent", importance: "Important", urgency: "Urgent", due_date: "2026-03-20", status: "Done" },
  { id: "t21", title: "Pay the security deposit", parent_goal: "g-rent", importance: "Important", urgency: "Urgent", due_date: "2026-03-28", status: "Done" },
];

export const sources: IncomeSource[] = [
  { id: "s-sendme", source_name: "Send Me", category: "Startup", projected_annual: 360000, actual_ytd: 96000, linked_goals: ["g-raise", "g-save"], actions: "Resume operations, reach $30K MRR" },
  { id: "s-fund", source_name: "Fund Raising", category: "Startup", projected_annual: 50000, actual_ytd: 18000, linked_goals: ["g-raise"], actions: "South African Guy, Chanzo Capital, Digital Africa" },
  { id: "s-rollout", source_name: "Rollout", category: "Startup", projected_annual: 60000, actual_ytd: 14500, linked_goals: ["g-raise"], actions: "Launch product, reach $5K MRR, get licenses" },
  { id: "s-kala", source_name: "Kala", category: "Startup", projected_annual: 100000, actual_ytd: 0, linked_goals: ["g-raise"], actions: "Start operations, raise $100K, join accelerator" },
  { id: "s-us", source_name: "US Business / AI SaaS", category: "Startup", projected_annual: 20000, actual_ytd: 1200, linked_goals: ["g-save"], actions: "Research AI businesses, get Stripe, launch" },
  { id: "s-vibe", source_name: "Vibe Code", category: "Freelance", projected_annual: 24000, actual_ytd: 11400, linked_goals: ["g-travel", "g-car"], actions: "Find and execute coding contracts" },
  { id: "s-grants", source_name: "Grants", category: "Grant", projected_annual: 40000, actual_ytd: 12000, linked_goals: ["g-masters", "g-save"], actions: "Start Prudent, Foreign Grants, ISOC, Local Grants" },
  { id: "s-gov", source_name: "Government Contracts", category: "Contract", projected_annual: 15000, actual_ytd: 5000, linked_goals: ["g-car"], actions: "Get $5K seed, visit government offices" },
  { id: "s-beauty", source_name: "Beauties in China", category: "Side Business", projected_annual: 8000, actual_ytd: 2300, linked_goals: ["g-travel"], actions: "Capital, Stripe, products, marketing" },
];

export const transactions: Transaction[] = [
  { id: "x1", date: "2026-06-11", source: "s-sendme", amount: 8000, note: "May MRR payout", kind: "income" },
  { id: "x2", date: "2026-06-09", source: "s-vibe", amount: 2200, note: "Dashboard contract milestone", kind: "income" },
  { id: "x3", date: "2026-06-02", source: "s-grants", amount: 5000, note: "ISOC grant tranche", kind: "income" },
  { id: "x4", date: "2026-05-28", source: "s-rollout", amount: 1800, note: "Rollout subscriptions", kind: "income" },
  { id: "x5", date: "2026-05-20", source: "s-gov", amount: 5000, note: "Seed contract", kind: "income" },
  { id: "x6", date: "2026-05-14", source: "s-beauty", amount: 900, note: "Product batch sales", kind: "income" },
  { id: "x7", date: "2026-05-06", source: "s-fund", amount: 10000, note: "Chanzo angel cheque", kind: "income" },
  { id: "e1", date: "2026-06-10", source: "Rent", amount: 1200, note: "June rent", kind: "expense" },
  { id: "e2", date: "2026-06-08", source: "Food", amount: 380, note: "Groceries", kind: "expense" },
  { id: "e3", date: "2026-06-05", source: "Transport", amount: 220, note: "Fuel + taxis", kind: "expense" },
  { id: "e4", date: "2026-06-01", source: "Subscriptions", amount: 95, note: "SaaS stack", kind: "expense" },
  { id: "e5", date: "2026-05-28", source: "Utilities", amount: 175, note: "Power + internet", kind: "expense" },
  { id: "e6", date: "2026-05-20", source: "Healthcare", amount: 240, note: "Clinic visit", kind: "expense" },
  { id: "e7", date: "2026-05-12", source: "Rent", amount: 1200, note: "May rent", kind: "expense" },
  { id: "e8", date: "2026-05-05", source: "Food", amount: 410, note: "Groceries + dining", kind: "expense" },
];

export const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const monthly: Record<string, number[]> = {
  "s-sendme": [12000, 14000, 15000, 16000, 18000, 21000],
  "s-fund": [0, 0, 8000, 0, 10000, 0],
  "s-rollout": [1500, 2000, 2200, 3000, 1800, 4000],
  "s-kala": [0, 0, 0, 0, 0, 0],
  "s-us": [0, 0, 0, 200, 400, 600],
  "s-vibe": [1200, 1600, 1800, 2200, 2400, 2200],
  "s-grants": [0, 2000, 0, 5000, 0, 5000],
  "s-gov": [0, 0, 0, 0, 5000, 0],
  "s-beauty": [200, 300, 400, 500, 900, 0],
};

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
