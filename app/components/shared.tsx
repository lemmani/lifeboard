"use client";

import { useEffect, type CSSProperties, type ReactNode, type MouseEvent } from "react";
import { STATUS, CATEGORY, type GoalStatus, type CategoryKey } from "@/app/lib/data";

export function Ring({
  value,
  size = 46,
  stroke = 5,
  color = "var(--brand)",
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const sw = stroke;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--surface-3)"
        strokeWidth={sw}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: "stroke-dashoffset 0.8s var(--ease)" }}
      />
    </svg>
  );
}

export function ProgressBar({
  value,
  h = 8,
  color = "var(--brand)",
}: {
  value: number;
  h?: number;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div
      style={{
        height: h,
        background: "var(--surface-3)",
        borderRadius: 999,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: (pct * 100).toFixed(1) + "%",
          background: color,
          borderRadius: 999,
          transition: "width 0.8s var(--ease)",
        }}
      />
    </div>
  );
}

export function StatusChip({ status }: { status: GoalStatus }) {
  const st = STATUS[status] || STATUS["In Progress"];
  return (
    <span
      className="chip"
      style={{ background: st.wash, color: st.color }}
    >
      <span className="dot" style={{ background: st.color }} />
      {st.label}
    </span>
  );
}

export function CatChip({ category }: { category: CategoryKey }) {
  const c = CATEGORY[category];
  return (
    <span className="chip" style={{ background: c.wash, color: c.color }}>
      {c.label}
    </span>
  );
}

export function Modal({
  onClose,
  width = 520,
  children,
}: {
  onClose: () => void;
  width?: number;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        background: "oklch(0.3 0.02 60 / 0.34)",
        backdropFilter: "blur(3px)",
        animation: "overlayIn 0.2s ease both",
        padding: 24,
      }}
    >
      <div
        onMouseDown={(e: MouseEvent) => e.stopPropagation()}
        className="card"
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow: "var(--sh-pop)",
          animation: "pop 0.26s var(--ease) both",
          display: "flex",
          flexDirection: "column",
        } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
