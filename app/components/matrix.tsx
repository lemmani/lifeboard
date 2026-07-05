"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  CATEGORY,
  fmtDate,
  parseD,
  type Goal,
  type Importance,
  type Task,
  type Urgency,
} from "@/app/lib/data";
import { IconCheck, IconChevD, IconClose, IconDrag, IconPlus } from "./icons";
import type { ConfirmRequest } from "./confirm-dialog";

const QUADS = [
  {
    id: "q1",
    imp: "Important" as Importance,
    urg: "Urgent" as Urgency,
    tag: "Q1",
    title: "Do First",
    sub: "Important · Urgent",
    color: "var(--st-over)",
    wash: "var(--st-over-wash)",
    action: "Crisis tasks, hard deadlines, critical blockers",
  },
  {
    id: "q2",
    imp: "Important" as Importance,
    urg: "Not Urgent" as Urgency,
    tag: "Q2",
    title: "Schedule",
    sub: "Important · Not Urgent",
    color: "var(--st-track)",
    wash: "var(--st-track-wash)",
    action: "Strategic work, relationships, growth",
  },
  {
    id: "q3",
    imp: "Not Important" as Importance,
    urg: "Urgent" as Urgency,
    tag: "Q3",
    title: "Delegate",
    sub: "Not Important · Urgent",
    color: "var(--st-risk)",
    wash: "var(--st-risk-wash)",
    action: "Interruptions, some meetings, routine requests",
  },
  {
    id: "q4",
    imp: "Not Important" as Importance,
    urg: "Not Urgent" as Urgency,
    tag: "Q4",
    title: "Eliminate",
    sub: "Not Important · Not Urgent",
    color: "var(--ink-3)",
    wash: "var(--surface-2)",
    action: "Time-wasters, distractions, low-value habits",
  },
];

interface Props {
  goals: Goal[];
  tasks: Task[];
  today: string;
  onToggleTask: (id: string) => void;
  onReclassify: (id: string, imp: Importance, urg: Urgency) => void;
  onDeleteTask: (id: string) => void;
  onConfirm: (req: ConfirmRequest) => void;
  onEditTask: (t: Task) => void;
  onNewGoal: () => void;
}

export function Matrix({
  goals,
  tasks,
  today,
  onToggleTask,
  onReclassify,
  onDeleteTask,
  onConfirm,
  onEditTask,
  onNewGoal,
}: Props) {
  const [goalFilter, setGoalFilter] = useState("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overQ, setOverQ] = useState<string | null>(null);
  const [completing, setCompleting] = useState<Record<string, boolean>>({});
  const completeTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(
    () => () => {
      completeTimers.current.forEach((t) => clearTimeout(t));
    },
    [],
  );

  function goalName(id: string) {
    const g = goals.find((x) => x.id === id);
    return g ? g.title : "";
  }
  function goalColor(id: string) {
    const g = goals.find((x) => x.id === id);
    return g ? CATEGORY[g.category].color : "var(--ink-3)";
  }

  const active = tasks
    .filter((t) => t.status !== "Done")
    .filter((t) => goalFilter === "all" || t.parent_goal === goalFilter);

  function quadTasks(q: (typeof QUADS)[number]) {
    return active.filter(
      (t) => t.importance === q.imp && t.urgency === q.urg,
    );
  }

  function handleComplete(id: string) {
    setCompleting((c) => ({ ...c, [id]: true }));
    const timer = setTimeout(() => {
      completeTimers.current.delete(timer);
      onToggleTask(id);
      setCompleting((c) => {
        const n = { ...c };
        delete n[id];
        return n;
      });
    }, 460);
    completeTimers.current.add(timer);
  }

  function onDrop(q: (typeof QUADS)[number]) {
    if (dragId) onReclassify(dragId, q.imp, q.urg);
    setDragId(null);
    setOverQ(null);
  }

  function taskCard(t: Task) {
    const isComp = completing[t.id];
    const overdue = parseD(t.due_date) < parseD(today);
    return (
      <div
        key={t.id}
        draggable
        onDragStart={(e) => {
          setDragId(t.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => {
          setDragId(null);
          setOverQ(null);
        }}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "11px 12px",
          boxShadow: "var(--sh-sm)",
          cursor: "grab",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          opacity: isComp ? 0 : dragId === t.id ? 0.4 : 1,
          transform: isComp ? "scale(0.8) translateX(20px)" : "none",
          transition:
            "opacity 0.42s var(--ease), transform 0.42s var(--ease)",
        }}
      >
        <button
          onClick={() => handleComplete(t.id)}
          title="Mark complete"
          style={{
            width: 21,
            height: 21,
            borderRadius: 7,
            flex: "0 0 auto",
            marginTop: 1,
            display: "grid",
            placeItems: "center",
            border: "2px solid var(--line-2)",
            background: "transparent",
            color: "var(--st-done)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e: ReactMouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = "var(--st-done)";
            e.currentTarget.style.background = "var(--st-done-wash)";
          }}
          onMouseLeave={(e: ReactMouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = "var(--line-2)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {isComp ? <IconCheck size={13} w={3} /> : null}
        </button>
        <div
          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            onEditTask(t);
          }}
          title="Edit task"
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--ink-2)",
                fontWeight: 600,
              }}
            >
              <span
                className="dot"
                style={{ background: goalColor(t.parent_goal) }}
              />
              {goalName(t.parent_goal)}
            </span>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                color: overdue ? "var(--st-over)" : "var(--ink-3)",
                fontWeight: 700,
              }}
            >
              Due {fmtDate(t.due_date)}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConfirm({
              title: "Delete task?",
              message: `"${t.title}" will be removed.`,
              confirmLabel: "Delete",
              danger: true,
              onConfirm: () => onDeleteTask(t.id),
            });
          }}
          title="Delete task"
          style={{
            border: "none",
            background: "transparent",
            color: "var(--ink-3)",
            display: "flex",
            cursor: "pointer",
            padding: 0,
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
        <span
          style={{ color: "var(--ink-3)", display: "flex", cursor: "grab" }}
        >
          <IconDrag size={16} />
        </span>
      </div>
    );
  }

  function quadrant(q: (typeof QUADS)[number]) {
    const ts = quadTasks(q);
    const isOver = overQ === q.id;
    return (
      <div
        key={q.id}
        onDragOver={(e) => {
          e.preventDefault();
          if (overQ !== q.id) setOverQ(q.id);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setOverQ(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(q);
        }}
        className="card"
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          minHeight: 250,
          background: isOver ? q.wash : "var(--surface)",
          borderColor: isOver ? q.color : "var(--line)",
          outline: isOver ? "2px dashed " + q.color : "none",
          outlineOffset: -2,
          transition: "background 0.15s, border-color 0.15s",
        } as CSSProperties}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              background: q.color,
              padding: "3px 8px",
              borderRadius: 7,
            }}
          >
            {q.tag}
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "-0.01em",
              }}
            >
              {q.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                fontWeight: 600,
              }}
            >
              {q.sub}
            </div>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: q.color,
              background: q.wash,
              minWidth: 26,
              height: 26,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
            }}
          >
            {ts.length}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            flex: 1,
          }}
        >
          {ts.length ? (
            ts.map(taskCard)
          ) : (
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                color: "var(--ink-3)",
                fontSize: 12.5,
                textAlign: "center",
                padding: 20,
                border: "1.5px dashed var(--line-2)",
                borderRadius: 12,
              }}
            >
              {q.action}
            </div>
          )}
        </div>
      </div>
    );
  }

  function axisHead(label: string) {
    return (
      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </div>
    );
  }

  if (tasks.filter((t) => t.status !== "Done").length === 0) {
    return (
      <div
        className="content screen-enter"
        style={{ display: "grid", placeItems: "center", minHeight: 480 }}
      >
        <div
          className="card"
          style={{
            padding: "48px 40px",
            textAlign: "center",
            maxWidth: 460,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Inbox zero
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--ink-2)",
              lineHeight: 1.55,
              marginBottom: 20,
            }}
          >
            {goals.length === 0
              ? "Create a goal to start adding tasks here."
              : "All tasks are done. Open a goal to plan the next ones."}
          </div>
          <button className="btn-primary" onClick={onNewGoal}>
            <IconPlus size={15} />
            {goals.length === 0 ? "Create a goal" : "Add a goal"}
          </button>
        </div>
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
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-2)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <IconDrag size={15} />
          Drag a card between quadrants to reclassify · tap the circle to
          complete
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <span
            style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}
          >
            Filter
          </span>
          <div style={{ position: "relative" }}>
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              style={{
                appearance: "none",
                border: "1px solid var(--line-2)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 32px 8px 13px",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              <option value="all">All goals</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <span
              style={{
                position: "absolute",
                right: 11,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "var(--ink-3)",
              }}
            >
              <IconChevD size={15} />
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "26px 1fr",
          gap: 12,
        }}
      >
        <div />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            paddingLeft: 2,
            marginBottom: 4,
          }}
        >
          {axisHead("Urgent")}
          {axisHead("Not Urgent")}
        </div>
        <div style={{ display: "grid", alignItems: "stretch" }}>
          <div
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            Important   ·   Not Important
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 12,
          }}
        >
          {QUADS.map(quadrant)}
        </div>
      </div>
    </div>
  );
}
