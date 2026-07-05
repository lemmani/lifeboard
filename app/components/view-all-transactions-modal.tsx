"use client";

import { useState } from "react";
import {
  EXPENSE_CAT_COLOR,
  SOURCE_CAT,
  fmtDate,
  fmtMoney,
  parseD,
  type ExpenseCategory,
  type IncomeSource,
  type Transaction,
} from "@/app/lib/data";
import { Modal } from "./shared";
import { IconClose } from "./icons";

interface Props {
  transactions: Transaction[];
  sources: IncomeSource[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

type Filter = "all" | "income" | "expense";

export function ViewAllTransactionsModal({
  transactions,
  sources,
  onClose,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const items = transactions
    .filter((x) => (filter === "all" ? true : x.kind === filter))
    .slice()
    .sort((a, b) => parseD(b.date).getTime() - parseD(a.date).getTime());

  return (
    <Modal onClose={onClose} width={620}>
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
            All transactions
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
            {items.length} entr{items.length === 1 ? "y" : "ies"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            background: "var(--surface-2)",
            borderRadius: 999,
            padding: 3,
            border: "1px solid var(--line)",
          }}
        >
          {(["all", "income", "expense"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                border: "none",
                background:
                  filter === f ? "var(--surface)" : "transparent",
                color: filter === f ? "var(--ink)" : "var(--ink-2)",
                fontWeight: 700,
                fontSize: 12,
                padding: "5px 13px",
                borderRadius: 999,
                boxShadow: filter === f ? "var(--sh-sm)" : "none",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          className="pill ghost"
          onClick={onClose}
          style={{ padding: 8, borderRadius: 10 }}
        >
          <IconClose size={18} />
        </button>
      </div>
      <div
        className="scroll"
        style={{
          padding: "8px 24px 16px",
          overflowY: "auto",
          maxHeight: "60vh",
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              padding: "30px 0",
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 13,
            }}
          >
            No {filter === "all" ? "" : filter + " "}transactions yet.
          </div>
        ) : (
          items.map((x, i) => {
            const isExpense = x.kind === "expense";
            const sourceObj = !isExpense
              ? sources.find((s) => s.id === x.source)
              : undefined;
            const dotColor = isExpense
              ? EXPENSE_CAT_COLOR[x.source as ExpenseCategory] ??
                "var(--ink-3)"
              : sourceObj
                ? SOURCE_CAT[sourceObj.category]
                : "var(--ink-3)";
            const label = isExpense
              ? x.source
              : sourceObj
                ? sourceObj.source_name
                : x.source;
            return (
              <div
                key={x.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 0",
                  borderTop: i ? "1px solid var(--line)" : "none",
                }}
              >
                <span
                  className="dot"
                  style={{
                    background: dotColor,
                    width: 9,
                    height: 9,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: "var(--ink-3)" }}
                  >
                    {x.note}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 110 }}>
                  <div
                    className="mono tnum"
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: isExpense
                        ? "var(--st-over)"
                        : "var(--st-done)",
                    }}
                  >
                    {isExpense ? "−" : "+"}
                    {fmtMoney(x.amount)}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 10.5, color: "var(--ink-3)" }}
                  >
                    {fmtDate(x.date, "long")}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(x.id)}
                  title="Delete"
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
          })
        )}
      </div>
    </Modal>
  );
}
