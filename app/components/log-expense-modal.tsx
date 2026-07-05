"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  EXPENSE_CATEGORIES,
  fmtMoney,
  type ExpenseCategory,
} from "@/app/lib/data";
import { Modal } from "./shared";
import {
  IconArrowDn,
  IconCheck,
  IconChevD,
  IconClose,
} from "./icons";

export interface LogExpensePayload {
  category: ExpenseCategory;
  amount: number;
  date: string;
  note: string;
}

interface Props {
  today: string;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (p: LogExpensePayload) => void;
}

export function LogExpenseModal({
  today,
  pending = false,
  onClose,
  onSubmit,
}: Props) {
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [amt, setAmt] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const amount = parseFloat(amt) || 0;
  const valid = amount > 0;

  const inputStyle: CSSProperties = {
    width: "100%",
    border: "1px solid var(--line-2)",
    background: "var(--surface)",
    color: "var(--ink)",
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 600,
    padding: "11px 13px",
    borderRadius: 11,
    outline: "none",
  };

  function field(label: string, child: ReactNode) {
    return (
      <div style={{ marginBottom: 16 }}>
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

  return (
    <Modal onClose={onClose} width={460}>
      <div
        style={{
          padding: "22px 24px 16px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          gap: 11,
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: "var(--st-over-wash)",
            color: "var(--st-over)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <IconArrowDn size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Log expense
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
            Tracks monthly + YTD spending
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
      <div style={{ padding: 24 }}>
        {field(
          "Category",
          <div style={{ position: "relative" }}>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ExpenseCategory)
              }
              style={{
                ...inputStyle,
                appearance: "none",
                paddingRight: 36,
                cursor: "pointer",
              }}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "var(--ink-3)",
              }}
            >
              <IconChevD size={16} />
            </span>
          </div>,
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            {field(
              "Amount (USD)",
              <div style={{ position: "relative" }}>
                <span
                  className="mono"
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ink-3)",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  placeholder="0"
                  autoFocus
                  style={{ ...inputStyle, paddingLeft: 26 }}
                  className="mono tnum"
                />
              </div>,
            )}
          </div>
          <div style={{ flex: 1 }}>
            {field(
              "Date",
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
                className="mono"
              />,
            )}
          </div>
        </div>
        {field(
          "Note (optional)",
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. June rent"
            style={inputStyle}
          />,
        )}
      </div>
      <div
        style={{
          padding: "16px 24px",
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
            background: "var(--st-over)",
            opacity: !valid || pending ? 0.6 : 1,
            cursor: pending ? "wait" : valid ? "pointer" : "not-allowed",
          }}
          onClick={() => {
            if (valid && !pending)
              onSubmit({
                category,
                amount,
                date,
                note: note || `${category} expense`,
              });
          }}
        >
          <IconCheck size={16} />
          {pending ? "Saving…" : `Log ${fmtMoney(amount)}`}
        </button>
      </div>
    </Modal>
  );
}
