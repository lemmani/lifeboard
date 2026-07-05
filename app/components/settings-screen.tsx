"use client";

import { useState, useTransition, type ReactNode } from "react";
import { IconExport } from "./icons";
import type { ConfirmRequest } from "./confirm-dialog";

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        border: "none",
        padding: 3,
        cursor: "pointer",
        background: on ? "var(--brand)" : "var(--surface-3)",
        transition: "background 0.2s",
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          display: "block",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "var(--sh-sm)",
          transform: on ? "translateX(18px)" : "none",
          transition: "transform 0.2s var(--ease)",
        }}
      />
    </button>
  );
}

interface SettingsProps {
  onReset: () => Promise<void>;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onConfirm: (req: ConfirmRequest) => void;
}

export function SettingsScreen({
  onReset,
  onExportJSON,
  onExportCSV,
  onConfirm,
}: SettingsProps) {
  const [notif, setNotif] = useState({
    daily: true,
    focus: true,
    deadlines: true,
    weekly: false,
  });
  const [cur, setCur] = useState("USD");
  const [pending, startTransition] = useTransition();
  const CURR = [
    ["USD", "$ US Dollar"],
    ["GBP", "£ Pound"],
    ["EUR", "€ Euro"],
    ["SLL", "Le Leone"],
  ];

  function row(title: string, sub: string | null, control: ReactNode) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "15px 0",
          borderTop: "1px solid var(--line)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
          {sub ? (
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-2)",
                marginTop: 2,
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
        {control}
      </div>
    );
  }

  function sectionCard(title: string, children: ReactNode) {
    return (
      <div
        className="card"
        style={{ padding: "20px 22px", marginBottom: 16 }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="content screen-enter" style={{ maxWidth: 720 }}>
      <div
        className="card"
        style={{
          padding: 22,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          className="avatar"
          style={{
            width: 58,
            height: 58,
            fontSize: 22,
            background: "var(--brand)",
          }}
        >
          EL
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Emmanuel Francis Lahai
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>
            Send Me Services Limited · Founder
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
            <span
              className="chip"
              style={{
                background: "var(--brand-wash)",
                color: "var(--brand-ink)",
              }}
            >
              Multi-venture
            </span>
            <span
              className="chip"
              style={{
                background: "var(--surface-2)",
                color: "var(--ink-2)",
              }}
            >
              9 income sources
            </span>
          </div>
        </div>
        <button className="pill">Edit profile</button>
      </div>

      {sectionCard(
        "Preferences",
        <div>
          {row(
            "Primary currency",
            "All amounts shown in this currency",
            <div
              style={{
                display: "flex",
                gap: 5,
                background: "var(--surface-2)",
                padding: 3,
                borderRadius: 999,
                border: "1px solid var(--line)",
              }}
            >
              {CURR.map((c) => (
                <button
                  key={c[0]}
                  onClick={() => setCur(c[0])}
                  title={c[1]}
                  style={{
                    border: "none",
                    background:
                      cur === c[0] ? "var(--surface)" : "transparent",
                    color: cur === c[0] ? "var(--ink)" : "var(--ink-2)",
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "6px 11px",
                    borderRadius: 999,
                    boxShadow: cur === c[0] ? "var(--sh-sm)" : "none",
                  }}
                >
                  {c[0]}
                </button>
              ))}
            </div>,
          )}
          {row(
            "Quarterly focus mode",
            "Primary Q1–Q2 · Secondary Q3–Q4. Surfaces the right work at the right time.",
            <Toggle on onChange={() => {}} />,
          )}
          {row(
            "Theme",
            "Warm light theme",
            <span
              className="chip"
              style={{
                background: "var(--surface-2)",
                color: "var(--ink-2)",
              }}
            >
              Warm light
            </span>,
          )}
        </div>,
      )}

      {sectionCard(
        "Notifications",
        <div>
          {row(
            "Daily summary",
            "Morning digest of today's focus-period tasks",
            <Toggle
              on={notif.daily}
              onChange={(v) => setNotif({ ...notif, daily: v })}
            />,
          )}
          {row(
            "Focus-period priority",
            "Prioritise current-focus tasks in reminders",
            <Toggle
              on={notif.focus}
              onChange={(v) => setNotif({ ...notif, focus: v })}
            />,
          )}
          {row(
            "Deadline alerts",
            "Ping me as goal target dates approach",
            <Toggle
              on={notif.deadlines}
              onChange={(v) => setNotif({ ...notif, deadlines: v })}
            />,
          )}
          {row(
            "Weekly finance recap",
            "Sunday income-vs-target summary",
            <Toggle
              on={notif.weekly}
              onChange={(v) => setNotif({ ...notif, weekly: v })}
            />,
          )}
        </div>,
      )}

      {sectionCard(
        "Data & backup",
        <div>
          {row(
            "Export data",
            "Download all goals, tasks & income stored in this browser",
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pill" onClick={onExportJSON}>
                <IconExport size={14} />
                JSON
              </button>
              <button className="pill" onClick={onExportCSV}>
                <IconExport size={14} />
                CSV
              </button>
            </div>,
          )}
          {row(
            "Local storage",
            "Stored in this browser's localStorage. Changes persist between sessions on this device.",
            <span
              className="chip"
              style={{
                background: "var(--st-done-wash)",
                color: "var(--st-done)",
              }}
            >
              <span
                className="dot"
                style={{ background: "var(--st-done)" }}
              />
              localStorage
            </span>,
          )}
          {row(
            "Reset to seed data",
            "Wipes this browser's data and reloads the default roadmap. Cannot be undone.",
            <button
              className="pill"
              disabled={pending}
              style={{
                color: "var(--st-over)",
                borderColor: "var(--st-over)",
                opacity: pending ? 0.5 : 1,
              }}
              onClick={() =>
                onConfirm({
                  title: "Reset all data?",
                  message:
                    "Every goal, task, source, and transaction will be wiped and the 2026 seed will be reloaded. This cannot be undone.",
                  confirmLabel: "Reset",
                  danger: true,
                  onConfirm: () => {
                    startTransition(() => {
                      void onReset();
                    });
                  },
                })
              }
            >
              {pending ? "Resetting…" : "Reset data"}
            </button>,
          )}
        </div>,
      )}

      <div
        style={{
          textAlign: "center",
          fontSize: 11.5,
          color: "var(--ink-3)",
          marginTop: 24,
        }}
      >
        LifeBoard v1.0 · Goals, tasks & finance in one timeline
      </div>
    </div>
  );
}
