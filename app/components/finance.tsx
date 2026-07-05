"use client";

import type { ReactNode } from "react";
import {
  EXPENSE_CAT_COLOR,
  SAVINGS_GOAL_ID,
  SOURCE_CAT,
  STATUS,
  deriveGoalStatus,
  fmtDate,
  fmtMoney,
  monthLabels,
  monthlyTarget as MONTHLY_TARGET,
  parseD,
  type ExpenseCategory,
  type Goal,
  type IncomeSource,
  type Transaction,
} from "@/app/lib/data";
import { ProgressBar } from "./shared";
import {
  IconArrowDn,
  IconArrowUp,
  IconClose,
  IconExport,
  IconWallet,
} from "./icons";
import type { ConfirmRequest } from "./confirm-dialog";

interface Props {
  goals: Goal[];
  sources: IncomeSource[];
  transactions: Transaction[];
  monthly: Record<string, number[]>;
  today: string;
  onDeleteTransaction: (id: string) => void;
  onConfirm: (req: ConfirmRequest) => void;
  onLogIncome: () => void;
  onLogExpense: () => void;
  onViewAll: () => void;
}

export function Finance({
  goals,
  sources,
  transactions,
  monthly,
  today,
  onDeleteTransaction,
  onConfirm,
  onLogIncome,
  onLogExpense,
  onViewAll,
}: Props) {
  const todayD = parseD(today);
  const curMonthIdx = todayD.getMonth();
  const curYear = todayD.getFullYear();

  const incomeYTD = transactions
    .filter((x) => x.kind === "income")
    .filter((x) => parseD(x.date).getFullYear() === curYear)
    .reduce((a, x) => a + x.amount, 0);
  const incomeMonth = transactions
    .filter((x) => x.kind === "income")
    .filter(
      (x) =>
        parseD(x.date).getMonth() === curMonthIdx &&
        parseD(x.date).getFullYear() === curYear,
    )
    .reduce((a, x) => a + x.amount, 0);
  const expensesYTD = transactions
    .filter((x) => x.kind === "expense")
    .filter((x) => parseD(x.date).getFullYear() === curYear)
    .reduce((a, x) => a + x.amount, 0);
  const expensesMonth = transactions
    .filter((x) => x.kind === "expense")
    .filter(
      (x) =>
        parseD(x.date).getMonth() === curMonthIdx &&
        parseD(x.date).getFullYear() === curYear,
    )
    .reduce((a, x) => a + x.amount, 0);

  const savings = goals.find((g) => g.id === SAVINGS_GOAL_ID);
  const savingsBalance = savings?.financial_current ?? 0;
  const savingsTarget = savings?.financial_target ?? 0;
  const savingsPct = savingsTarget
    ? Math.min(1, savingsBalance / savingsTarget)
    : 0;
  const totalActual = incomeYTD;

  const monthTotals = monthLabels.map((_, mi) =>
    sources.reduce(
      (a, s) => a + ((monthly[s.id] && monthly[s.id][mi]) || 0),
      0,
    ),
  );
  const maxBar =
    Math.max(MONTHLY_TARGET, Math.max(...monthTotals)) * 1.1;
  const CHART_H = 180;

  const catTotals: Record<string, number> = {};
  sources.forEach((s) => {
    catTotals[s.category] = (catTotals[s.category] || 0) + s.actual_ytd;
  });
  const catList = Object.keys(catTotals)
    .filter((k) => catTotals[k] > 0)
    .sort((a, b) => catTotals[b] - catTotals[a]);

  function dualStatCard(
    label: string,
    primaryValue: string,
    primarySub: string,
    secondaryValue: string,
    secondarySub: string,
    color: string,
    icon: ReactNode,
    bottom?: ReactNode,
  ) {
    return (
      <div
        className="card"
        style={{ padding: 18, flex: 1, minWidth: 220 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: color + "22",
              color,
              display: "grid",
              placeItems: "center",
            }}
          >
            {icon}
          </span>
          <span className="eyebrow">{label}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              className="mono tnum"
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                lineHeight: 1.1,
              }}
            >
              {primaryValue}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                marginTop: 3,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {primarySub}
            </div>
          </div>
          <div
            style={{
              width: 1,
              alignSelf: "stretch",
              background: "var(--line)",
            }}
          />
          <div>
            <div
              className="mono tnum"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ink-2)",
                lineHeight: 1.1,
              }}
            >
              {secondaryValue}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                marginTop: 3,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {secondarySub}
            </div>
          </div>
        </div>
        {bottom ? <div style={{ marginTop: 14 }}>{bottom}</div> : null}
      </div>
    );
  }

  const R = 62;
  const SW = 22;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const catSum = catList.reduce((a, k) => a + catTotals[k], 0);
  const donutSegs =
    catSum > 0
      ? catList.map((k) => {
          const frac = catTotals[k] / catSum;
          const seg = {
            k,
            color: SOURCE_CAT[k as keyof typeof SOURCE_CAT],
            len: frac * C,
            off: acc,
            frac,
          };
          acc += frac * C;
          return seg;
        })
      : [];

  function exportCSV() {
    const rows: (string | number)[][] = [
      ["Date", "Kind", "Source", "Amount USD", "Note"],
    ];
    transactions.forEach((x) => {
      const s = sources.find((z) => z.id === x.source);
      rows.push([
        x.date,
        x.kind,
        s ? s.source_name : x.source,
        x.kind === "expense" ? -x.amount : x.amount,
        x.note,
      ]);
    });
    const csv = rows
      .map((r) => r.map((c) => '"' + c + '"').join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lifeboard-transactions.csv";
    a.click();
  }

  return (
    <div className="content screen-enter">
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        {dualStatCard(
          "Savings",
          fmtMoney(savingsBalance, { compact: true }),
          "Balance",
          fmtMoney(savingsTarget, { compact: true }),
          "Target",
          "var(--cat-financial)",
          <IconWallet size={16} />,
          <ProgressBar
            value={savingsPct}
            h={6}
            color="var(--cat-financial)"
          />,
        )}
        {dualStatCard(
          "Income",
          fmtMoney(incomeMonth, { compact: true }),
          "This month",
          fmtMoney(incomeYTD, { compact: true }),
          "YTD",
          "var(--st-done)",
          <IconArrowUp size={16} />,
        )}
        {dualStatCard(
          "Expenses",
          fmtMoney(expensesMonth, { compact: true }),
          "This month",
          fmtMoney(expensesYTD, { compact: true }),
          "YTD",
          "var(--st-over)",
          <IconArrowDn size={16} />,
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 16,
          marginBottom: 18,
          alignItems: "stretch",
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 800 }}>
              Monthly income by source
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: "var(--ink-3)",
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 0,
                  borderTop: "2px dashed var(--brand)",
                }}
              />
              Monthly target {fmtMoney(MONTHLY_TARGET, { compact: true })}
            </span>
          </div>
          <div
            style={{
              position: "relative",
              height: CHART_H,
              marginTop: 18,
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: (MONTHLY_TARGET / maxBar) * CHART_H,
                borderTop: "2px dashed var(--brand)",
                opacity: 0.55,
                zIndex: 2,
              }}
            />
            {monthLabels.map((m, mi) => {
              const future = mi > curMonthIdx;
              return (
                <div
                  key={m}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 30,
                      display: "flex",
                      flexDirection: "column-reverse",
                      borderRadius: "5px 5px 0 0",
                      overflow: "hidden",
                      opacity: future ? 0.32 : 1,
                    }}
                  >
                    {sources.map((s) => {
                      const v = (monthly[s.id] && monthly[s.id][mi]) || 0;
                      if (v <= 0) return null;
                      return (
                        <div
                          key={s.id}
                          title={s.source_name + " · " + fmtMoney(v)}
                          style={{
                            height: (v / maxBar) * CHART_H,
                            background: SOURCE_CAT[s.category],
                            borderTop: "1px solid var(--surface)",
                          }}
                        />
                      );
                    })}
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 9.5,
                      color: "var(--ink-3)",
                      fontWeight: 700,
                    }}
                  >
                    {m}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="card"
          style={{ padding: 20, display: "flex", flexDirection: "column" }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
            By category
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flex: 1,
            }}
          >
            <div style={{ position: "relative", flex: "0 0 auto" }}>
              <svg
                width={158}
                height={158}
                style={{ transform: "rotate(-90deg)" }}
              >
                {donutSegs.map((seg) => (
                  <circle
                    key={seg.k}
                    cx={79}
                    cy={79}
                    r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={SW}
                    strokeDasharray={seg.len + " " + (C - seg.len)}
                    strokeDashoffset={-seg.off}
                  />
                ))}
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                }}
              >
                <div>
                  <div
                    className="mono tnum"
                    style={{ fontSize: 19, fontWeight: 700 }}
                  >
                    {fmtMoney(totalActual, { compact: true })}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-3)",
                      fontWeight: 700,
                    }}
                  >
                    YTD
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              {donutSegs.map((seg) => (
                <div
                  key={seg.k}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    className="dot"
                    style={{
                      background: seg.color,
                      width: 9,
                      height: 9,
                    }}
                  />
                  <span
                    style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}
                  >
                    {seg.k}
                  </span>
                  <span
                    className="mono tnum"
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-3)",
                      fontWeight: 700,
                    }}
                  >
                    {Math.round(seg.frac * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Goal funding</span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 16,
            }}
          >
            {goals
              .filter((g) => g.financial_target)
              .sort(
                (a, b) =>
                  b.financial_current / b.financial_target -
                  a.financial_current / a.financial_target,
              )
              .map((g) => {
                const pct = g.financial_current / g.financial_target;
                const st = deriveGoalStatus(g, today);
                const fund = sources.filter(
                  (s) => (s.linked_goals || []).indexOf(g.id) >= 0,
                );
                return (
                  <div key={g.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 12,
                        marginBottom: 7,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {g.title}
                      </span>
                      <span
                        className="mono tnum"
                        style={{
                          fontSize: 12,
                          color: "var(--ink-2)",
                          fontWeight: 700,
                          flex: "0 0 auto",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtMoney(g.financial_current, { compact: true })} /{" "}
                        {fmtMoney(g.financial_target, { compact: true })}
                      </span>
                    </div>
                    <ProgressBar value={pct} h={8} color={STATUS[st].color} />
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 7,
                        flexWrap: "wrap",
                      }}
                    >
                      {fund.map((s) => (
                        <span
                          key={s.id}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: "var(--ink-3)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span
                            className="dot"
                            style={{
                              background: SOURCE_CAT[s.category],
                              width: 6,
                              height: 6,
                            }}
                          />
                          {s.source_name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div
          className="card"
          style={{ padding: 20, display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 800 }}>
              Recent income
            </span>
            <button
              className="pill ghost"
              onClick={onViewAll}
              style={{ marginLeft: "auto", fontSize: 12 }}
            >
              View all
            </button>
            <button
              className="pill ghost"
              onClick={exportCSV}
              style={{ fontSize: 12 }}
            >
              <IconExport size={14} />
              CSV
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {transactions.filter((x) => x.kind === "income").length === 0 ? (
              <div
                style={{
                  padding: "30px 10px",
                  textAlign: "center",
                  color: "var(--ink-3)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                No income logged yet.
                <div style={{ marginTop: 12 }}>
                  <button className="btn-primary" onClick={onLogIncome}>
                    <IconWallet size={14} />
                    Log your first entry
                  </button>
                </div>
              </div>
            ) : null}
            {transactions
              .filter((x) => x.kind === "income")
              .slice()
              .sort(
                (a, b) =>
                  parseD(b.date).getTime() - parseD(a.date).getTime(),
              )
              .slice(0, 8)
              .map((x, i) => {
                const s = sources.find((z) => z.id === x.source);
                return (
                  <div
                    key={x.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "10px 0",
                      borderTop: i ? "1px solid var(--line)" : "none",
                    }}
                  >
                    <span
                      className="dot"
                      style={{
                        background: s
                          ? SOURCE_CAT[s.category]
                          : "var(--ink-3)",
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
                        {s ? s.source_name : x.source}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--ink-3)",
                        }}
                      >
                        {x.note}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        className="mono tnum"
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "var(--st-done)",
                        }}
                      >
                        +{fmtMoney(x.amount)}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10.5,
                          color: "var(--ink-3)",
                        }}
                      >
                        {fmtDate(x.date)}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onConfirm({
                          title: `Delete ${fmtMoney(x.amount)} entry?`,
                          message:
                            "Linked goal funding will be reduced and the source's YTD total will drop accordingly.",
                          confirmLabel: "Delete",
                          danger: true,
                          onConfirm: () =>
                            onDeleteTransaction(x.id),
                        })
                      }
                      title="Delete transaction"
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
                        e.currentTarget.style.background =
                          "var(--st-over-wash)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--ink-3)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <IconClose size={14} />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
