"use client";

import { useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  CATEGORY,
  STATUS,
  deriveGoalStatus,
  fmtDate,
  fmtMoney,
  parseD,
  type Goal,
  type IncomeSource,
  type Task,
} from "@/app/lib/data";
import { CatChip, ProgressBar, Ring, StatusChip } from "./shared";
import { IconCal, IconCheck, IconPlus } from "./icons";
import { GoalDrawer } from "./goal-drawer";
import type { ConfirmRequest } from "./confirm-dialog";

interface Props {
  goals: Goal[];
  tasks: Task[];
  sources: IncomeSource[];
  today: string;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (
    goalId: string,
    title: string,
    importance: "Important" | "Not Important",
    urgency: "Urgent" | "Not Urgent",
    due: string,
  ) => void;
  onEditGoal: (g: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onMarkGoalCompleted: (g: Goal, completed: boolean) => void;
  onConfirm: (req: ConfirmRequest) => void;
  onNewGoal: () => void;
}

const FILTERS = ["All", "Primary", "Secondary"] as const;
type Filter = (typeof FILTERS)[number];

export function GoalsScreen({
  goals,
  tasks,
  sources,
  today,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onEditGoal,
  onDeleteGoal,
  onMarkGoalCompleted,
  onConfirm,
  onNewGoal,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  const openGoal = goals.find((g) => g.id === openId);

  const shown = goals
    .filter((g) => filter === "All" || g.focus_period === filter)
    .sort(
      (a, b) =>
        parseD(a.target_date).getTime() - parseD(b.target_date).getTime(),
    );

  function goalCard(g: Goal) {
    const gTasks = tasks.filter((t) => t.parent_goal === g.id);
    const done = gTasks.filter((t) => t.status === "Done").length;
    const st = deriveGoalStatus(g, today);
    const stMeta = STATUS[st];
    const pct = g.financial_target
      ? g.financial_current / g.financial_target
      : gTasks.length
        ? done / gTasks.length
        : 0;
    const cat = CATEGORY[g.category];

    return (
      <div
        key={g.id}
        className="card"
        onClick={() => setOpenId(g.id)}
        onMouseEnter={(e: ReactMouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.boxShadow = "var(--sh-md)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e: ReactMouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.boxShadow = "var(--sh-sm)";
          e.currentTarget.style.transform = "none";
        }}
        style={{
          padding: 20,
          cursor: "pointer",
          transition: "box-shadow 0.16s, transform 0.16s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: cat.color,
          }}
        />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ position: "relative", flex: "0 0 auto" }}>
            <Ring value={pct} size={58} stroke={6} color={stMeta.color} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                className="mono tnum"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: stMeta.color,
                }}
              >
                {Math.round(pct * 100)}%
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                gap: 7,
                marginBottom: 7,
                flexWrap: "wrap",
              }}
            >
              <CatChip category={g.category} />
              <StatusChip status={st} />
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {g.title}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-3)",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <IconCal size={13} />
              Due {fmtDate(g.target_date, "long")}
            </div>
          </div>
        </div>
        {g.financial_target ? (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <span
                className="mono tnum"
                style={{ fontSize: 15, fontWeight: 700 }}
              >
                {fmtMoney(g.financial_current)}
              </span>
              <span
                className="mono tnum"
                style={{ fontSize: 12, color: "var(--ink-3)" }}
              >
                of {fmtMoney(g.financial_target)}
              </span>
            </div>
            <ProgressBar value={pct} h={8} color={stMeta.color} />
          </div>
        ) : null}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-2)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IconCheck size={13} />
            {done} / {gTasks.length} tasks done
          </span>
          <span
            className="chip"
            style={{
              background:
                g.focus_period === "Primary"
                  ? "var(--brand-wash)"
                  : "var(--surface-2)",
              color:
                g.focus_period === "Primary"
                  ? "var(--brand-ink)"
                  : "var(--ink-2)",
            }}
          >
            {g.focus_period === "Primary"
              ? "Primary · Q1–Q2"
              : "Secondary · Q3–Q4"}
          </span>
        </div>
      </div>
    );
  }

  const counts = { active: 0, atrisk: 0, done: 0 };
  goals.forEach((g) => {
    const st = deriveGoalStatus(g, today);
    if (st === "Completed") counts.done++;
    else if (st === "At Risk" || st === "Overdue") counts.atrisk++;
    else counts.active++;
  });

  function summaryStat(n: number, label: string, color: string) {
    return (
      <div
        className="card"
        style={{
          padding: "11px 18px",
          display: "flex",
          alignItems: "center",
          gap: 11,
          boxShadow: "none",
        }}
      >
        <span
          className="mono tnum"
          style={{ fontSize: 24, fontWeight: 700, color }}
        >
          {n}
        </span>
        <span
          style={{
            fontSize: 12.5,
            color: "var(--ink-2)",
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="content screen-enter">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          {summaryStat(counts.active, "In progress", "var(--st-track)")}
          {summaryStat(counts.atrisk, "Need attention", "var(--st-risk)")}
          {summaryStat(counts.done, "Completed", "var(--st-done)")}
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            background: "var(--surface-2)",
            borderRadius: 999,
            padding: 3,
            border: "1px solid var(--line)",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                border: "none",
                background:
                  filter === f ? "var(--surface)" : "transparent",
                color: filter === f ? "var(--ink)" : "var(--ink-2)",
                fontWeight: 700,
                fontSize: 12.5,
                padding: "6px 15px",
                borderRadius: 999,
                boxShadow: filter === f ? "var(--sh-sm)" : "none",
              }}
            >
              {f === "All" ? "All goals" : f + " focus"}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "48px 40px",
            textAlign: "center",
            maxWidth: 460,
            margin: "20px auto",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            {goals.length === 0
              ? "No goals yet"
              : `No ${filter.toLowerCase()} focus goals`}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              lineHeight: 1.5,
              marginBottom: 18,
            }}
          >
            {goals.length === 0
              ? "Create your first goal to start tracking."
              : "Try a different filter or add a new goal in this focus period."}
          </div>
          <button className="btn-primary" onClick={onNewGoal}>
            <IconPlus size={15} />
            New goal
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: 18,
          }}
        >
          {shown.map(goalCard)}
        </div>
      )}
      {openGoal ? (
        <GoalDrawer
          goal={openGoal}
          tasks={tasks}
          sources={sources}
          today={today}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
          onEditGoal={onEditGoal}
          onDeleteGoal={(id) => {
            onDeleteGoal(id);
            setOpenId(null);
          }}
          onMarkGoalCompleted={onMarkGoalCompleted}
          onConfirm={onConfirm}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );
}
