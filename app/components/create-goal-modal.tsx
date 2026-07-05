"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  SOURCE_CAT,
  fmtDate,
  fmtMoney,
  type CategoryKey,
  type FocusPeriod,
  type Goal,
  type Importance,
  type IncomeSource,
  type Task,
  type Urgency,
} from "@/app/lib/data";
import { Modal } from "./shared";
import {
  IconBolt,
  IconCheck,
  IconChevL,
  IconChevR,
  IconClose,
  IconGoals,
  IconPlus,
  IconWallet,
} from "./icons";

interface Props {
  today: string;
  pending?: boolean;
  editing?: Goal;
  sources?: IncomeSource[];
  onClose: () => void;
  onCreate: (goal: Goal, tasks: Task[]) => void;
  onUpdate?: (goal: Goal, fundingSourceIds?: string[]) => void;
}

const STEPS = ["Basics", "Targets", "Tasks"];
const EDIT_STEPS = ["Basics", "Targets", "Funding"];

export function CreateGoalModal({
  today,
  pending = false,
  editing,
  sources = [],
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const isEdit = !!editing;
  const [step, setStep] = useState(0);
  const initialFunding =
    isEdit && editing
      ? sources
          .filter((s) =>
            (s.linked_goals || []).indexOf(editing.id) >= 0,
          )
          .map((s) => s.id)
      : [];
  const [fundingIds, setFundingIds] = useState<string[]>(initialFunding);
  const [data, setData] = useState({
    title: editing?.title ?? "",
    category: (editing?.category ?? "Financial") as CategoryKey,
    start_date: editing?.start_date ?? today,
    target_date:
      editing?.target_date ?? `${new Date().getFullYear()}-12-31`,
    financial_target: editing
      ? String(editing.financial_target || "")
      : "",
    focus_period: (editing?.focus_period ?? "Primary") as FocusPeriod,
  });
  const [newTasks, setNewTasks] = useState<
    Array<{
      id: string;
      title: string;
      importance: Importance;
      urgency: Urgency;
      due_date: string;
      status: "To Do";
    }>
  >([]);
  const [draft, setDraft] = useState<{
    title: string;
    importance: Importance;
    urgency: Urgency;
  }>({
    title: "",
    importance: "Important",
    urgency: "Urgent",
  });

  function upd<K extends keyof typeof data>(k: K, v: (typeof data)[K]) {
    setData({ ...data, [k]: v });
  }
  const canNext = step === 0 ? data.title.trim().length > 0 : true;

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

  function segGroup<T extends string>(
    value: T,
    options: { v: T; l: string }[],
    onPick: (v: T) => void,
  ) {
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((o) => {
          const on = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onPick(o.v)}
              style={{
                border:
                  "1.5px solid " +
                  (on ? "var(--brand)" : "var(--line-2)"),
                background: on ? "var(--brand-wash)" : "var(--surface)",
                color: on ? "var(--brand-ink)" : "var(--ink-2)",
                fontWeight: 700,
                fontSize: 13,
                padding: "8px 14px",
                borderRadius: 10,
              }}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    );
  }

  function addTask() {
    if (!draft.title.trim()) return;
    setNewTasks([
      ...newTasks,
      {
        id: "nt" + Date.now(),
        title: draft.title,
        importance: draft.importance,
        urgency: draft.urgency,
        due_date: data.target_date,
        status: "To Do",
      },
    ]);
    setDraft({
      title: "",
      importance: draft.importance,
      urgency: draft.urgency,
    });
  }

  function submit() {
    if (isEdit && editing && onUpdate) {
      onUpdate(
        {
          ...editing,
          title: data.title.trim(),
          category: data.category,
          start_date: data.start_date,
          target_date: data.target_date,
          financial_target: parseFloat(data.financial_target) || 0,
          focus_period: data.focus_period,
        },
        fundingIds,
      );
      return;
    }
    const g: Goal = {
      id: "g" + Date.now(),
      title: data.title.trim(),
      category: data.category,
      start_date: data.start_date,
      target_date: data.target_date,
      financial_target: parseFloat(data.financial_target) || 0,
      financial_current: 0,
      focus_period: data.focus_period,
      status: "Not Started",
      note: "Newly created goal.",
    };
    const ts: Task[] = newTasks.map((t) => ({
      id: t.id,
      title: t.title,
      parent_goal: g.id,
      importance: t.importance,
      urgency: t.urgency,
      due_date: t.due_date,
      status: "To Do",
    }));
    onCreate(g, ts);
  }

  let body: ReactNode;
  if (step === 0) {
    body = (
      <div>
        {field(
          "Goal title",
          <input
            autoFocus
            value={data.title}
            onChange={(e) => upd("title", e.target.value)}
            placeholder="e.g. Launch Kala in Q3"
            style={inputStyle}
          />,
        )}
        {field(
          "Category",
          segGroup<CategoryKey>(
            data.category,
            [
              { v: "Financial", l: "Financial" },
              { v: "Career", l: "Career" },
              { v: "Education", l: "Education" },
              { v: "Personal", l: "Personal" },
              { v: "Health", l: "Health" },
            ],
            (v) => upd("category", v),
          ),
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            {field(
              "Start date",
              <input
                type="date"
                value={data.start_date}
                onChange={(e) => upd("start_date", e.target.value)}
                style={inputStyle}
                className="mono"
              />,
            )}
          </div>
          <div style={{ flex: 1 }}>
            {field(
              "Target date",
              <input
                type="date"
                value={data.target_date}
                onChange={(e) => upd("target_date", e.target.value)}
                style={inputStyle}
                className="mono"
              />,
            )}
          </div>
        </div>
      </div>
    );
  } else if (step === 1) {
    body = (
      <div>
        {field(
          "Financial target (optional)",
          <div style={{ position: "relative" }}>
            <span
              className="mono"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-3)",
                fontWeight: 700,
              }}
            >
              $
            </span>
            <input
              type="number"
              value={data.financial_target}
              onChange={(e) => upd("financial_target", e.target.value)}
              placeholder="0"
              className="mono tnum"
              style={{ ...inputStyle, paddingLeft: 24 }}
            />
          </div>,
        )}
        {field(
          "Focus period",
          segGroup<FocusPeriod>(
            data.focus_period,
            [
              { v: "Primary", l: "Primary · Q1–Q2" },
              { v: "Secondary", l: "Secondary · Q3–Q4" },
            ],
            (v) => upd("focus_period", v),
          ),
        )}
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-2)",
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: 11,
            padding: "12px 14px",
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
          }}
        >
          <IconBolt size={14} style={{ marginTop: 1, flex: "0 0 auto" }} />
          The goal will appear on the timeline from {fmtDate(data.start_date)} to{" "}
          {fmtDate(data.target_date)}, inside the{" "}
          {data.focus_period === "Primary"
            ? "Primary (Q1–Q2)"
            : "Secondary (Q3–Q4)"}{" "}
          focus band.
        </div>
      </div>
    );
  } else if (isEdit) {
    body = (
      <div>
        <div
          className="eyebrow"
          style={{ marginBottom: 10 }}
        >
          Linked income sources
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {sources.length === 0 ? (
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-3)",
                textAlign: "center",
                padding: 16,
                border: "1.5px dashed var(--line-2)",
                borderRadius: 11,
              }}
            >
              No income sources yet.
            </div>
          ) : (
            sources.map((s) => {
              const on = fundingIds.indexOf(s.id) >= 0;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() =>
                    setFundingIds(
                      on
                        ? fundingIds.filter((id) => id !== s.id)
                        : [...fundingIds, s.id],
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 13px",
                    background: on ? "var(--brand-wash)" : "var(--surface)",
                    border:
                      "1.5px solid " +
                      (on ? "var(--brand)" : "var(--line)"),
                    borderRadius: 12,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      border:
                        "2px solid " +
                        (on ? "var(--brand)" : "var(--line-2)"),
                      background: on ? "var(--brand)" : "transparent",
                      color: "#fff",
                    }}
                  >
                    {on ? <IconCheck size={11} w={3} /> : null}
                  </span>
                  <span
                    className="dot"
                    style={{ background: SOURCE_CAT[s.category] }}
                  />
                  <span style={{ flex: 1 }}>
                    <span
                      style={{ fontSize: 13.5, fontWeight: 700 }}
                    >
                      {s.source_name}
                    </span>
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        color: "var(--ink-3)",
                      }}
                    >
                      {s.category}
                    </span>
                  </span>
                  <span
                    className="mono tnum"
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-3)",
                      fontWeight: 700,
                    }}
                  >
                    {fmtMoney(s.actual_ytd, { compact: true })}
                    {" / "}
                    {fmtMoney(s.projected_annual, { compact: true })}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-2)",
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: 11,
            padding: "10px 12px",
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
          }}
        >
          <IconWallet size={14} style={{ marginTop: 1, flex: "0 0 auto" }} />
          Future income from these sources is split evenly across linked goals.
        </div>
      </div>
    );
  } else {
    body = (
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {newTasks.length ? (
            newTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}
                >
                  {t.title}
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ink-3)",
                  }}
                >
                  {(t.importance === "Important" ? "Imp" : "—") +
                    "·" +
                    (t.urgency === "Urgent" ? "Urg" : "—")}
                </span>
                <button
                  className="pill ghost"
                  style={{ padding: 5, borderRadius: 8 }}
                  onClick={() =>
                    setNewTasks(newTasks.filter((x) => x.id !== t.id))
                  }
                >
                  <IconClose size={14} />
                </button>
              </div>
            ))
          ) : (
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-3)",
                textAlign: "center",
                padding: 16,
                border: "1.5px dashed var(--line-2)",
                borderRadius: 11,
              }}
            >
              Add a few tasks to break this goal into action
            </div>
          )}
        </div>
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 13,
          }}
        >
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
            placeholder="New task…"
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {segGroup<Importance>(
              draft.importance,
              [
                { v: "Important", l: "Important" },
                { v: "Not Important", l: "Not important" },
              ],
              (v) => setDraft({ ...draft, importance: v }),
            )}
            {segGroup<Urgency>(
              draft.urgency,
              [
                { v: "Urgent", l: "Urgent" },
                { v: "Not Urgent", l: "Not urgent" },
              ],
              (v) => setDraft({ ...draft, urgency: v }),
            )}
            <button
              className="btn-primary"
              style={{ marginLeft: "auto" }}
              onClick={addTask}
            >
              <IconPlus size={15} />
              Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal onClose={onClose} width={540}>
      <div style={{ padding: "20px 24px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: "var(--brand-wash)",
              color: "var(--brand)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <IconGoals size={20} />
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              {isEdit ? "Edit goal" : "New goal"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
              {`Step ${step + 1} of 3 · ${(isEdit ? EDIT_STEPS : STEPS)[step]}`}
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
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {(isEdit ? EDIT_STEPS : STEPS).map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 999,
                background:
                  i <= step ? "var(--brand)" : "var(--surface-3)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
      </div>
      <div
        className="scroll"
        style={{ padding: "4px 24px 8px", overflowY: "auto" }}
      >
        {body}
      </div>
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          gap: 10,
          background: "var(--bg-2)",
        }}
      >
        {step > 0 ? (
          <button className="pill" onClick={() => setStep(step - 1)}>
            <IconChevL size={15} />
            Back
          </button>
        ) : null}
        <div style={{ flex: 1 }} />
        {step < 2 ? (
          <button
            className="btn-primary"
            disabled={!canNext}
            style={{
              opacity: canNext ? 1 : 0.5,
              cursor: canNext ? "pointer" : "not-allowed",
            }}
            onClick={() => {
              if (canNext) setStep(step + 1);
            }}
          >
            Continue
            <IconChevR size={15} />
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={submit}
            disabled={pending}
            style={{
              opacity: pending ? 0.6 : 1,
              cursor: pending ? "wait" : "pointer",
            }}
          >
            <IconCheck size={16} />
            {pending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create goal"}
          </button>
        )}
      </div>
    </Modal>
  );
}
