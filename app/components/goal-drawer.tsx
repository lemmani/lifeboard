"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import {
  STATUS,
  SOURCE_CAT,
  deriveGoalStatus,
  fmtDate,
  fmtMoney,
  type Goal,
  type IncomeSource,
  type Task,
} from "@/app/lib/data";
import { CatChip, ProgressBar, StatusChip } from "./shared";
import type { ConfirmRequest } from "./confirm-dialog";
import { IconCheck, IconClose, IconPlus } from "./icons";

interface Props {
  goal: Goal;
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
  onClose: () => void;
}

export function GoalDrawer({
  goal: g,
  tasks: allTasks,
  sources,
  today,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onEditGoal,
  onDeleteGoal,
  onMarkGoalCompleted,
  onConfirm,
  onClose,
}: Props) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskImp, setNewTaskImp] = useState<"Important" | "Not Important">(
    "Important",
  );
  const [newTaskUrg, setNewTaskUrg] = useState<"Urgent" | "Not Urgent">(
    "Urgent",
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const tasks = allTasks.filter((t) => t.parent_goal === g.id);
  const done = tasks.filter((t) => t.status === "Done").length;
  const st = deriveGoalStatus(g, today);
  const stMeta = STATUS[st];
  const pct = g.financial_target
    ? g.financial_current / g.financial_target
    : done / Math.max(1, tasks.length);
  const linkedSources = sources.filter(
    (s) => (s.linked_goals || []).indexOf(g.id) >= 0,
  );

  function urgFlag(t: Task) {
    const col =
      t.importance === "Important" ? "var(--st-over)" : "var(--ink-3)";
    const lab =
      (t.importance === "Important" ? "Imp" : "—") +
      " · " +
      (t.urgency === "Urgent" ? "Urg" : "—");
    return (
      <span
        className="mono"
        style={{ fontSize: 10, color: col, fontWeight: 700 }}
      >
        {lab}
      </span>
    );
  }

  function stat(label: string, val: string) {
    return (
      <div
        style={{
          flex: 1,
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "10px 12px",
        }}
      >
        <div className="eyebrow" style={{ fontSize: 10 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{val}</div>
      </div>
    );
  }

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        justifyContent: "flex-end",
        background: "oklch(0.3 0.02 60 / 0.28)",
        animation: "overlayIn 0.2s ease both",
      }}
    >
      <div
        onMouseDown={(e: MouseEvent) => e.stopPropagation()}
        className="scroll"
        style={{
          width: 430,
          maxWidth: "94vw",
          height: "100%",
          background: "var(--surface)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "var(--sh-lg)",
          overflowY: "auto",
          animation: "drawerIn 0.3s var(--ease) both",
        }}
      >
        <div
          style={{
            padding: "22px 24px 18px",
            borderBottom: "1px solid var(--line)",
            position: "sticky",
            top: 0,
            background: "var(--surface)",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <CatChip category={g.category} />
                <StatusChip status={st} />
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                {g.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-2)",
                  marginTop: 6,
                }}
              >
                {g.note}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {st === "Completed" ? (
                <button
                  className="pill ghost"
                  onClick={() => onMarkGoalCompleted(g, false)}
                  title="Reopen this goal"
                  style={{ padding: "6px 10px", fontSize: 12 }}
                >
                  Reopen
                </button>
              ) : (
                <button
                  className="pill"
                  onClick={() => onMarkGoalCompleted(g, true)}
                  title="Mark goal complete"
                  style={{
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "var(--st-done)",
                    borderColor: "var(--st-done)",
                  }}
                >
                  <IconCheck size={13} w={2.5} />
                  Done
                </button>
              )}
              <button
                className="pill ghost"
                onClick={() => onEditGoal(g)}
                title="Edit goal"
                style={{ padding: "6px 10px", fontSize: 12 }}
              >
                Edit
              </button>
              <button
                className="pill ghost"
                onClick={() =>
                  onConfirm({
                    title: `Delete "${g.title}"?`,
                    message:
                      "This goal and all its tasks will be removed. This cannot be undone.",
                    confirmLabel: "Delete goal",
                    danger: true,
                    onConfirm: () => onDeleteGoal(g.id),
                  })
                }
                title="Delete goal"
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  color: "var(--st-over)",
                }}
              >
                Delete
              </button>
              <button
                className="pill ghost"
                onClick={onClose}
                style={{ padding: 8, borderRadius: 10 }}
              >
                <IconClose size={18} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px 40px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {stat("Start", fmtDate(g.start_date, "long"))}
            {stat("Target", fmtDate(g.target_date, "long"))}
            {stat(
              "Focus",
              g.focus_period === "Primary" ? "Q1–Q2" : "Q3–Q4",
            )}
          </div>

          {g.financial_target ? (
            <div
              className="card"
              style={{
                padding: 16,
                marginBottom: 20,
                boxShadow: "none",
                background: "var(--bg-2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 10,
                }}
              >
                <span className="eyebrow">Funding progress</span>
                <span
                  className="mono tnum"
                  style={{ fontSize: 12, fontWeight: 700, color: stMeta.color }}
                >
                  {Math.round(pct * 100)}%
                </span>
              </div>
              <ProgressBar value={pct} h={10} color={stMeta.color} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <span
                  className="mono tnum"
                  style={{ fontSize: 16, fontWeight: 700 }}
                >
                  {fmtMoney(g.financial_current)}
                </span>
                <span
                  className="mono tnum"
                  style={{ fontSize: 13, color: "var(--ink-3)" }}
                >
                  of {fmtMoney(g.financial_target)}
                </span>
              </div>
            </div>
          ) : null}

          {linkedSources.length ? (
            <div style={{ marginBottom: 22 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Funded by
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {linkedSources.map((s) => (
                  <span
                    key={s.id}
                    className="chip"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--ink-2)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span
                      className="dot"
                      style={{ background: SOURCE_CAT[s.category] }}
                    />
                    {s.source_name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div className="eyebrow">Tasks</div>
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--ink-3)" }}
            >
              {done} / {tasks.length} done
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map((t) => {
              const isDone = t.status === "Done";
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "11px 13px",
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    opacity: isDone ? 0.55 : 1,
                  }}
                >
                  <button
                    onClick={() => onToggleTask(t.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      border:
                        "2px solid " +
                        (isDone ? "var(--st-done)" : "var(--line-2)"),
                      background: isDone ? "var(--st-done)" : "transparent",
                      color: "#fff",
                      transition: "all 0.15s",
                    }}
                  >
                    {isDone ? <IconCheck size={13} w={3} /> : null}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {t.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 3,
                        alignItems: "center",
                      }}
                    >
                      {urgFlag(t)}
                      <span
                        style={{ fontSize: 11, color: "var(--ink-3)" }}
                      >
                        Due {fmtDate(t.due_date)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onConfirm({
                        title: `Delete task?`,
                        message: `"${t.title}" will be removed.`,
                        confirmLabel: "Delete",
                        danger: true,
                        onConfirm: () => onDeleteTask(t.id),
                      })
                    }
                    title="Delete task"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--ink-3)",
                      display: "flex",
                      cursor: "pointer",
                      padding: 4,
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--st-over)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--ink-3)";
                    }}
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              );
            })}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const title = newTaskTitle.trim();
                if (!title) return;
                onAddTask(
                  g.id,
                  title,
                  newTaskImp,
                  newTaskUrg,
                  g.target_date,
                );
                setNewTaskTitle("");
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
                padding: "11px 13px",
                background: "var(--bg-2)",
                border: "1.5px dashed var(--line-2)",
                borderRadius: 12,
              }}
            >
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a task to this goal…"
                style={
                  {
                    border: "none",
                    background: "transparent",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 13.5,
                    fontWeight: 600,
                    outline: "none",
                    padding: "4px 0",
                  } as CSSProperties
                }
              />
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <PickerChip
                  active={newTaskImp === "Important"}
                  onClick={() =>
                    setNewTaskImp(
                      newTaskImp === "Important"
                        ? "Not Important"
                        : "Important",
                    )
                  }
                >
                  {newTaskImp === "Important" ? "Important" : "Not important"}
                </PickerChip>
                <PickerChip
                  active={newTaskUrg === "Urgent"}
                  onClick={() =>
                    setNewTaskUrg(
                      newTaskUrg === "Urgent" ? "Not Urgent" : "Urgent",
                    )
                  }
                >
                  {newTaskUrg === "Urgent" ? "Urgent" : "Not urgent"}
                </PickerChip>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="btn-primary"
                  style={{
                    marginLeft: "auto",
                    padding: "6px 12px",
                    fontSize: 12.5,
                    opacity: newTaskTitle.trim() ? 1 : 0.5,
                    cursor: newTaskTitle.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  <IconPlus size={13} />
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function PickerChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1.5px solid " + (active ? "var(--brand)" : "var(--line-2)"),
        background: active ? "var(--brand-wash)" : "var(--surface)",
        color: active ? "var(--brand-ink)" : "var(--ink-2)",
        fontWeight: 700,
        fontSize: 11.5,
        padding: "5px 11px",
        borderRadius: 999,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
