"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deriveGoalStatus,
  fmtMoney,
  parseD,
  type Goal,
  type Importance,
  type IncomeSource,
  type Task,
  type Transaction,
  type Urgency,
} from "../lib/data";
import * as actions from "../actions";
import { ConfirmDialog, type ConfirmRequest } from "./confirm-dialog";
import { CreateGoalModal } from "./create-goal-modal";
import { EditTaskModal } from "./edit-task-modal";
import { Finance } from "./finance";
import { LogExpenseModal, type LogExpensePayload } from "./log-expense-modal";
import { ViewAllTransactionsModal } from "./view-all-transactions-modal";
import { GoalsScreen } from "./goals-screen";
import {
  IconCheck,
  IconFinance,
  IconGoals,
  IconMatrix,
  IconPlus,
  IconSettings,
  IconTimeline,
  IconWallet,
} from "./icons";
import {
  LogIncomeModal,
  type LogIncomePayload,
} from "./log-income-modal";
import { Matrix } from "./matrix";
import { SettingsScreen } from "./settings-screen";
import { Timeline } from "./timeline";

type Route = "timeline" | "goals" | "matrix" | "finance" | "settings";
type ModalState =
  | { kind: "goal" }
  | { kind: "edit-goal"; goal: Goal }
  | { kind: "income" }
  | { kind: "expense" }
  | { kind: "view-all" }
  | { kind: "edit-task"; task: Task }
  | null;

const NAV: { id: Route; label: string; icon: typeof IconTimeline }[] = [
  { id: "timeline", label: "Timeline", icon: IconTimeline },
  { id: "goals", label: "Goals", icon: IconGoals },
  { id: "matrix", label: "Matrix", icon: IconMatrix },
  { id: "finance", label: "Finance", icon: IconFinance },
  { id: "settings", label: "Settings", icon: IconSettings },
];

const TITLES: Record<Route, [string, string]> = {
  timeline: ["Timeline", "Your goals on one calendar"],
  goals: ["Goals", "Every goal, its progress and funding"],
  matrix: ["Eisenhower Matrix", "Where your attention should go today"],
  finance: ["Finance", "Income against targets, by source"],
  settings: ["Settings", "Profile, preferences & data"],
};

interface Props {
  today: string;
  goals: Goal[];
  tasks: Task[];
  sources: IncomeSource[];
  transactions: Transaction[];
  monthly: Record<string, number[]>;
}

export function LifeBoardApp({
  today,
  goals,
  tasks,
  sources,
  transactions,
  monthly,
}: Props) {
  const router = useRouter();
  const [route, setRoute] = useState<Route>("timeline");
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const [pending, startTransition] = useTransition();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function requestConfirm(req: ConfirmRequest) {
    setConfirmReq(req);
  }

  function run<T>(fn: () => Promise<T>, after?: (v: T) => void) {
    startTransition(() => {
      fn().then((v) => {
        if (after) after(v);
        router.refresh();
      });
    });
  }

  function toggleTask(id: string) {
    run(() => actions.toggleTask(id));
  }
  function deleteTask(id: string) {
    run(() => actions.deleteTask(id), () => flash("Task removed"));
  }
  function reclassify(id: string, importance: Importance, urgency: Urgency) {
    run(() => actions.reclassifyTask(id, importance, urgency));
  }
  function addTask(
    goalId: string,
    title: string,
    importance: Importance,
    urgency: Urgency,
    due: string,
  ) {
    run(
      () =>
        actions.createTask({
          title,
          parent_goal: goalId,
          importance,
          urgency,
          due_date: due,
          status: "To Do",
        }),
      () => flash(`Added "${title}"`),
    );
  }
  function deleteGoal(id: string) {
    const g = goals.find((x) => x.id === id);
    run(
      () => actions.deleteGoal(id),
      () => flash(g ? `Deleted "${g.title}"` : "Goal deleted"),
    );
  }
  function editGoal(goal: Goal) {
    setModal({ kind: "edit-goal", goal });
  }
  function updateGoal(goal: Goal, fundingSourceIds?: string[]) {
    run(
      async () => {
        await actions.updateGoal(goal);
        if (fundingSourceIds)
          await actions.updateGoalSources(goal.id, fundingSourceIds);
      },
      () => {
        setModal(null);
        flash("Goal updated");
      },
    );
  }
  function editTask(t: Task) {
    setModal({ kind: "edit-task", task: t });
  }
  function saveTask(t: Task) {
    run(
      () => actions.updateTask(t),
      () => {
        setModal(null);
        flash("Task updated");
      },
    );
  }
  function logExpense(p: LogExpensePayload) {
    run(
      () => actions.logExpense(p),
      () => {
        setModal(null);
        flash(fmtMoney(p.amount) + " expense logged");
      },
    );
  }
  function markGoalCompleted(g: Goal, completed: boolean) {
    const next: Goal = {
      ...g,
      status: completed ? "Completed" : "In Progress",
      financial_current: completed ? g.financial_target : g.financial_current,
    };
    run(
      () => actions.updateGoal(next),
      () =>
        flash(
          completed
            ? `"${g.title}" marked complete`
            : `"${g.title}" reactivated`,
        ),
    );
  }
  function createGoal(g: Goal, ts: Task[]) {
    const { ...goalNoId } = g;
    run(
      () =>
        actions.createGoal(
          goalNoId,
          ts.map((t) => ({
            title: t.title,
            importance: t.importance,
            urgency: t.urgency,
            due_date: t.due_date,
            status: t.status,
          })),
        ),
      () => {
        setModal(null);
        setRoute("timeline");
        flash(`"${g.title}" added to the timeline`);
      },
    );
  }
  function logIncome(p: LogIncomePayload) {
    run(
      () => actions.logIncome(p),
      (res) => {
        const linked = res.linkedGoals.length;
        setModal(null);
        flash(
          fmtMoney(p.amount) +
            " logged" +
            (linked
              ? ` · ${linked} goal${linked > 1 ? "s" : ""} updated`
              : ""),
        );
      },
    );
  }
  function deleteTransaction(id: string) {
    run(
      () => actions.deleteTransaction(id),
      () => flash("Transaction removed"),
    );
  }
  async function resetData() {
    await actions.resetDatabase();
    router.refresh();
    flash("Database reset to seed data");
  }
  function exportJSON() {
    const payload = { today, goals, tasks, sources, transactions, monthly };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lifeboard-export.json";
    a.click();
  }
  function exportCSV() {
    const rows: (string | number)[][] = [
      ["Date", "Source", "Amount USD", "Note"],
    ];
    transactions.forEach((x) => {
      const s = sources.find((z) => z.id === x.source);
      rows.push([x.date, s ? s.source_name : x.source, x.amount, x.note]);
    });
    const csv = rows
      .map((r) => r.map((c) => '"' + c + '"').join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lifeboard-income.csv";
    a.click();
  }

  const doFirst = tasks.filter(
    (t) =>
      t.status !== "Done" &&
      t.importance === "Important" &&
      t.urgency === "Urgent",
  ).length;
  const activeGoals = goals.filter(
    (g) => deriveGoalStatus(g, today) !== "Completed",
  ).length;
  const badges: Partial<Record<Route, number>> = {
    goals: activeGoals,
    matrix: doFirst,
  };

  // Quick focus-band summary: how many days remain in the current half-year.
  const todayD = parseD(today);
  const halfEnd = new Date(todayD.getFullYear(), todayD.getMonth() < 6 ? 6 : 12, 0);
  const halfDaysLeft = Math.max(
    0,
    Math.round((halfEnd.getTime() - todayD.getTime()) / 86400000),
  );
  const isPrimary = todayD.getMonth() < 6;

  let screen;
  if (route === "timeline")
    screen = (
      <Timeline
        goals={goals}
        tasks={tasks}
        sources={sources}
        today={today}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
        onAddTask={addTask}
        onEditGoal={editGoal}
        onDeleteGoal={deleteGoal}
        onMarkGoalCompleted={markGoalCompleted}
        onConfirm={requestConfirm}
        onNewGoal={() => setModal({ kind: "goal" })}
      />
    );
  else if (route === "goals")
    screen = (
      <GoalsScreen
        goals={goals}
        tasks={tasks}
        sources={sources}
        today={today}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
        onAddTask={addTask}
        onEditGoal={editGoal}
        onDeleteGoal={deleteGoal}
        onMarkGoalCompleted={markGoalCompleted}
        onConfirm={requestConfirm}
        onNewGoal={() => setModal({ kind: "goal" })}
      />
    );
  else if (route === "matrix")
    screen = (
      <Matrix
        goals={goals}
        tasks={tasks}
        today={today}
        onToggleTask={toggleTask}
        onReclassify={reclassify}
        onDeleteTask={deleteTask}
        onConfirm={requestConfirm}
        onEditTask={editTask}
        onNewGoal={() => setModal({ kind: "goal" })}
      />
    );
  else if (route === "finance")
    screen = (
      <Finance
        goals={goals}
        sources={sources}
        transactions={transactions}
        monthly={monthly}
        today={today}
        onDeleteTransaction={deleteTransaction}
        onConfirm={requestConfirm}
        onLogIncome={() => setModal({ kind: "income" })}
        onLogExpense={() => setModal({ kind: "expense" })}
        onViewAll={() => setModal({ kind: "view-all" })}
      />
    );
  else
    screen = (
      <SettingsScreen
        onReset={resetData}
        onExportJSON={exportJSON}
        onExportCSV={exportCSV}
        onConfirm={requestConfirm}
      />
    );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">
            <IconTimeline size={20} w={2.1} />
          </div>
          <div>
            <div className="brand-name">LifeBoard</div>
            <div className="brand-sub">Goals · Tasks · Finance</div>
          </div>
        </div>
        <button
          className="btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            marginBottom: 18,
          }}
          onClick={() => setModal({ kind: "goal" })}
        >
          <IconPlus size={17} />
          New goal
        </button>
        <nav className="nav">
          {NAV.map((n) => {
            const badge = badges[n.id];
            return (
              <button
                key={n.id}
                className={
                  "nav-item" + (route === n.id ? " active" : "")
                }
                onClick={() => setRoute(n.id)}
              >
                <n.icon size={19} />
                <span>{n.label}</span>
                {badge ? <span className="nav-badge">{badge}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="side-spacer" />
        <div className="side-card">
          <div className="side-focus-label">Current focus</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              marginTop: 4,
              letterSpacing: "-0.01em",
            }}
          >
            {isPrimary ? "Primary · Q1–Q2" : "Secondary · Q3–Q4"}
          </div>
          <div className="side-focus-band">
            <div
              className={"fb-seg" + (isPrimary ? " on" : "")}
            />
            <div
              className={"fb-seg" + (isPrimary ? " on" : "")}
            />
            <div
              className={"fb-seg" + (!isPrimary ? " on" : "")}
            />
            <div
              className={"fb-seg" + (!isPrimary ? " on" : "")}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              marginTop: 8,
            }}
          >
            {halfDaysLeft} days left in the half
          </div>
        </div>
        <div className="user-row">
          <div className="avatar">EL</div>
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Emmanuel Lahai
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              Send Me Ltd
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-title">{TITLES[route][0]}</div>
            <div className="page-sub">{TITLES[route][1]}</div>
          </div>
          <div className="top-actions">
            {route === "finance" ? (
              <>
                <button
                  className="pill"
                  onClick={() => setModal({ kind: "expense" })}
                  style={{
                    color: "var(--st-over)",
                    borderColor: "var(--st-over)",
                  }}
                >
                  Log expense
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setModal({ kind: "income" })}
                >
                  <IconWallet size={16} />
                  Log income
                </button>
              </>
            ) : (
              <button
                className="btn-primary"
                onClick={() => setModal({ kind: "goal" })}
              >
                <IconPlus size={16} />
                New goal
              </button>
            )}
          </div>
        </div>
        <div key={route}>{screen}</div>
      </main>

      {modal?.kind === "goal" ? (
        <CreateGoalModal
          today={today}
          pending={pending}
          onClose={() => setModal(null)}
          onCreate={createGoal}
        />
      ) : null}
      {modal?.kind === "edit-goal" ? (
        <CreateGoalModal
          today={today}
          pending={pending}
          editing={modal.goal}
          sources={sources}
          onClose={() => setModal(null)}
          onCreate={createGoal}
          onUpdate={updateGoal}
        />
      ) : null}
      {modal?.kind === "income" ? (
        <LogIncomeModal
          sources={sources}
          goals={goals}
          today={today}
          pending={pending}
          onClose={() => setModal(null)}
          onSubmit={logIncome}
        />
      ) : null}
      {modal?.kind === "expense" ? (
        <LogExpenseModal
          today={today}
          pending={pending}
          onClose={() => setModal(null)}
          onSubmit={logExpense}
        />
      ) : null}
      {modal?.kind === "view-all" ? (
        <ViewAllTransactionsModal
          transactions={transactions}
          sources={sources}
          onClose={() => setModal(null)}
          onDelete={(id) =>
            requestConfirm({
              title: "Delete transaction?",
              message:
                "This entry will be removed. If it's income, the source balance and any linked goal funding will be reversed.",
              confirmLabel: "Delete",
              danger: true,
              onConfirm: () => deleteTransaction(id),
            })
          }
        />
      ) : null}
      {modal?.kind === "edit-task" ? (
        <EditTaskModal
          task={modal.task}
          pending={pending}
          onClose={() => setModal(null)}
          onSave={saveTask}
        />
      ) : null}

      <ConfirmDialog
        request={confirmReq}
        onClose={() => setConfirmReq(null)}
      />

      {toast ? (
        <button
          onClick={() => setToast(null)}
          style={{
            position: "fixed",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "12px 20px",
            borderRadius: 999,
            boxShadow: "var(--sh-pop)",
            fontSize: 13.5,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 9,
            animation: "pop 0.3s var(--ease) both",
            border: "none",
            cursor: "pointer",
          }}
          title="Dismiss"
        >
          <span style={{ color: "var(--st-done)", display: "flex" }}>
            <IconCheck size={16} w={2.4} />
          </span>
          {toast}
        </button>
      ) : null}
    </div>
  );
}
