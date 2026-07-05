"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type {
  Importance,
  Task,
  TaskStatus,
  Urgency,
} from "@/app/lib/data";
import { Modal } from "./shared";
import { IconCheck, IconClose } from "./icons";

interface Props {
  task: Task;
  pending?: boolean;
  onClose: () => void;
  onSave: (t: Task) => void;
}

export function EditTaskModal({
  task,
  pending = false,
  onClose,
  onSave,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [due, setDue] = useState(task.due_date);
  const [importance, setImportance] = useState<Importance>(
    task.importance,
  );
  const [urgency, setUrgency] = useState<Urgency>(task.urgency);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const valid = title.trim().length > 0;

  const inputStyle: CSSProperties = {
    width: "100%",
    border: "1px solid var(--line-2)",
    background: "var(--surface)",
    color: "var(--ink)",
    fontFamily: "inherit",
    fontSize: 14.5,
    fontWeight: 600,
    padding: "10px 12px",
    borderRadius: 11,
    outline: "none",
  };

  function field(label: string, child: ReactNode) {
    return (
      <div style={{ marginBottom: 15 }}>
        <label
          className="eyebrow"
          style={{ display: "block", marginBottom: 7 }}
        >
          {label}
        </label>
        {child}
      </div>
    );
  }

  function pill<T extends string>(value: T, current: T, set: (v: T) => void, label: string) {
    const on = value === current;
    return (
      <button
        key={label}
        onClick={() => set(value)}
        style={{
          border: "1.5px solid " + (on ? "var(--brand)" : "var(--line-2)"),
          background: on ? "var(--brand-wash)" : "var(--surface)",
          color: on ? "var(--brand-ink)" : "var(--ink-2)",
          fontWeight: 700,
          fontSize: 13,
          padding: "8px 14px",
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <Modal onClose={onClose} width={480}>
      <div
        style={{
          padding: "20px 24px 14px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          gap: 11,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Edit task
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
            Update title, due date, quadrant, or status
          </div>
        </div>
        <button
          className="pill ghost"
          onClick={onClose}
          style={{ padding: 8, borderRadius: 10 }}
        >
          <IconClose size={18} />
        </button>
      </div>
      <div style={{ padding: 22 }}>
        {field(
          "Title",
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            style={inputStyle}
          />,
        )}
        {field(
          "Due date",
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            style={inputStyle}
            className="mono"
          />,
        )}
        {field(
          "Importance",
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {pill<Importance>("Important", importance, setImportance, "Important")}
            {pill<Importance>(
              "Not Important",
              importance,
              setImportance,
              "Not important",
            )}
          </div>,
        )}
        {field(
          "Urgency",
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {pill<Urgency>("Urgent", urgency, setUrgency, "Urgent")}
            {pill<Urgency>("Not Urgent", urgency, setUrgency, "Not urgent")}
          </div>,
        )}
        {field(
          "Status",
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {pill<TaskStatus>("To Do", status, setStatus, "To do")}
            {pill<TaskStatus>("In Progress", status, setStatus, "In progress")}
            {pill<TaskStatus>("Done", status, setStatus, "Done")}
            {pill<TaskStatus>("Blocked", status, setStatus, "Blocked")}
          </div>,
        )}
      </div>
      <div
        style={{
          padding: "14px 22px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          background: "var(--bg-2)",
        }}
      >
        <button className="pill" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-primary"
          disabled={!valid || pending}
          style={{
            opacity: !valid || pending ? 0.6 : 1,
            cursor: pending ? "wait" : valid ? "pointer" : "not-allowed",
          }}
          onClick={() => {
            if (valid && !pending)
              onSave({
                ...task,
                title: title.trim(),
                due_date: due,
                importance,
                urgency,
                status,
              });
          }}
        >
          <IconCheck size={16} />
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}
