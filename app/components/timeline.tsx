"use client";

import { useEffect, useRef, useState, type WheelEvent } from "react";
import {
  CATEGORY,
  STATUS,
  daysBetween,
  deriveGoalStatus,
  fmtDate,
  fmtMoney,
  parseD,
  type Goal,
  type IncomeSource,
  type Task,
} from "@/app/lib/data";
import { IconBolt, IconCheck, IconPlus } from "./icons";
import { GoalDrawer } from "./goal-drawer";
import type { ConfirmRequest } from "./confirm-dialog";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MON_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function yearDays(year: number) {
  return daysBetween(`${year}-01-01`, `${year + 1}-01-01`);
}

function dayOfYear(year: number, s: string) {
  return daysBetween(`${year}-01-01`, s);
}

function monthOffsets(year: number) {
  const out: number[] = [];
  for (let m = 0; m < 12; m++)
    out.push(
      daysBetween(
        `${year}-01-01`,
        year + "-" + String(m + 1).padStart(2, "0") + "-01",
      ),
    );
  out.push(yearDays(year));
  return out;
}

const ZOOMS: Record<string, number> = { Year: 3.3, Quarter: 7.6, Month: 19 };
const ZK = ["Year", "Quarter", "Month"] as const;
type ZoomKey = (typeof ZK)[number];

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11.5,
        color: "var(--ink-2)",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 14,
          height: 8,
          borderRadius: 3,
          background: color,
        }}
      />
      {label}
    </span>
  );
}

interface Props {
  goals: Goal[];
  tasks: Task[];
  sources: IncomeSource[];
  today: string;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (goalId: string, title: string, importance: "Important" | "Not Important", urgency: "Urgent" | "Not Urgent", due: string) => void;
  onEditGoal: (g: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onMarkGoalCompleted: (g: Goal, completed: boolean) => void;
  onConfirm: (req: ConfirmRequest) => void;
  onNewGoal: () => void;
}

export function Timeline({
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
  const [zoom, setZoom] = useState<ZoomKey>("Year");
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const ppd = ZOOMS[zoom];
  const year = +today.slice(0, 4);
  const daysInYear = yearDays(year);
  const trackW = daysInYear * ppd;
  const ROW_H = 58;
  const showDays = zoom === "Month";
  const HEAD_H = showDays ? 76 : 56;
  const DAY_ROW_H = showDays ? 20 : 0;
  const offs = monthOffsets(year);
  const todayX = dayOfYear(year, today) * ppd;
  const primaryEnd = dayOfYear(year, `${year}-07-01`) * ppd;
  const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = Math.max(0, todayX - el.clientWidth * 0.42);
    }
  }, [zoom, todayX]);

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }

  const openGoal = goals.find((g) => g.id === openId);
  const sortedAll = goals
    .slice()
    .sort(
      (a, b) =>
        parseD(a.start_date).getTime() - parseD(b.start_date).getTime(),
    );
  // Completed goals come out of the gantt and into their own list at the bottom.
  const ordered = sortedAll.filter(
    (g) => deriveGoalStatus(g, today) !== "Completed",
  );
  const completed = sortedAll.filter(
    (g) => deriveGoalStatus(g, today) === "Completed",
  );

  if (sortedAll.length === 0) {
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
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            No goals yet
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--ink-2)",
              lineHeight: 1.55,
              marginBottom: 20,
            }}
          >
            Add your first goal to see it appear on the timeline with a
            target date, funding bar, and linked tasks.
          </div>
          <button className="btn-primary" onClick={onNewGoal}>
            <IconPlus size={15} />
            Create your first goal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-enter">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "18px 30px 14px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow">Fiscal year {today.slice(0, 4)}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
            {ordered.length} goals on the board
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <Legend label="On track" color="var(--st-track)" />
            <Legend label="At risk" color="var(--st-risk)" />
            <Legend label="Overdue" color="var(--st-over)" />
            <Legend label="Done" color="var(--st-done)" />
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
            {ZK.map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                style={{
                  border: "none",
                  background:
                    zoom === z ? "var(--surface)" : "transparent",
                  color: zoom === z ? "var(--ink)" : "var(--ink-2)",
                  fontWeight: 700,
                  fontSize: 12.5,
                  padding: "6px 14px",
                  borderRadius: 999,
                  boxShadow: zoom === z ? "var(--sh-sm)" : "none",
                }}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 30px 40px" }}>
        <div className="card" style={{ display: "flex", overflow: "hidden" }}>
          {/* left label column */}
          <div
            style={{
              width: 244,
              flex: "0 0 244px",
              borderRight: "1px solid var(--line)",
              background: "var(--surface)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                height: HEAD_H,
                borderBottom: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
              }}
            >
              <span className="eyebrow">Goal</span>
            </div>
            {ordered.map((g) => {
              const st = deriveGoalStatus(g, today);
              return (
                <div
                  key={g.id}
                  onClick={() => setOpenId(g.id)}
                  onMouseEnter={() => setHoverId(g.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    height: ROW_H,
                    borderBottom: "1px solid var(--line)",
                    padding: "0 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 3,
                    cursor: "pointer",
                    background:
                      hoverId === g.id ? "var(--surface-2)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      className="dot"
                      style={{
                        background: CATEGORY[g.category].color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.title}
                    </span>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: STATUS[st].color,
                      fontWeight: 700,
                      paddingLeft: 15,
                    }}
                  >
                    {STATUS[st].label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* scroll area */}
          <div
            ref={scrollRef}
            className="scroll"
            onWheel={onWheel}
            style={{
              flex: 1,
              overflowX: "auto",
              overflowY: "hidden",
            }}
          >
            <div
              style={{
                position: "relative",
                width: trackW,
                height: HEAD_H + ordered.length * ROW_H,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: primaryEnd,
                  top: HEAD_H,
                  bottom: 0,
                  background: "var(--brand-wash)",
                  opacity: 0.4,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 8,
                  top: HEAD_H + 6,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--brand-ink)",
                  opacity: 0.7,
                }}
              >
                Primary focus · Q1–Q2
              </div>
              <div
                style={{
                  position: "absolute",
                  left: primaryEnd + 8,
                  top: HEAD_H + 6,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                Secondary focus · Q3–Q4
              </div>

              {/* header */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: trackW,
                  height: HEAD_H,
                  borderBottom: "1px solid var(--line)",
                  background: "var(--surface)",
                }}
              >
                {MONTHS.map((m, i) => {
                  const x = offs[i] * ppd;
                  const w = (offs[i + 1] - offs[i]) * ppd;
                  return (
                    <div
                      key={m}
                      style={{
                        position: "absolute",
                        left: x,
                        width: w,
                        top: 0,
                        height: HEAD_H - DAY_ROW_H,
                        borderLeft: "1px solid var(--line)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        paddingLeft: 10,
                        gap: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        {zoom === "Year" ? MON_ABBR[i] : m}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 9.5, color: "var(--ink-3)" }}
                      >
                        Q{Math.floor(i / 3) + 1}
                      </span>
                    </div>
                  );
                })}
                {showDays
                  ? Array.from({ length: daysInYear }, (_, d) => {
                      const dateMs =
                        parseD(`${year}-01-01`).getTime() + d * 86400000;
                      const dow = new Date(dateMs).getDay();
                      const isWeekend = dow === 0 || dow === 6;
                      return (
                        <div
                          key={d}
                          style={{
                            position: "absolute",
                            left: d * ppd,
                            width: ppd,
                            top: HEAD_H - DAY_ROW_H,
                            height: DAY_ROW_H,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderLeft:
                              d % 7 === 0
                                ? "1px solid var(--line)"
                                : "none",
                            borderTop: "1px solid var(--line)",
                            background: isWeekend
                              ? "var(--surface-2)"
                              : "var(--surface)",
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: isWeekend
                              ? "var(--ink-3)"
                              : "var(--ink-2)",
                            letterSpacing: "0",
                          }}
                        >
                          {DAY_LETTERS[dow]}
                        </div>
                      );
                    })
                  : null}
              </div>

              {/* grid + bars */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: HEAD_H,
                  width: trackW,
                  height: ordered.length * ROW_H,
                }}
              >
                {offs.slice(0, 12).map((o, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: o * ppd,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "var(--line)",
                    }}
                  />
                ))}

                {ordered.map((g, i) => {
                  const x = dayOfYear(year, g.start_date) * ppd;
                  const w = Math.max(
                    daysBetween(g.start_date, g.target_date) * ppd,
                    34,
                  );
                  const st = deriveGoalStatus(g, today);
                  const col = STATUS[st].color;
                  const pct = g.financial_target
                    ? g.financial_current / g.financial_target
                    : g.status === "Completed"
                      ? 1
                      : 0.4;
                  const active = hoverId === g.id || openId === g.id;
                  return (
                    <div
                      key={g.id}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: i * ROW_H,
                        height: ROW_H,
                      }}
                    >
                      <div
                        onClick={() => setOpenId(g.id)}
                        onMouseEnter={() => setHoverId(g.id)}
                        onMouseLeave={() => setHoverId(null)}
                        style={{
                          position: "absolute",
                          left: x,
                          width: w,
                          top: 10,
                          height: ROW_H - 20,
                          borderRadius: 11,
                          cursor: "pointer",
                          overflow: "hidden",
                          background: STATUS[st].wash,
                          border: "1.5px solid " + col,
                          boxShadow: active ? "var(--sh-md)" : "none",
                          transform: active ? "translateY(-1px)" : "none",
                          transition:
                            "box-shadow 0.16s, transform 0.16s",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: pct * 100 + "%",
                            background: col,
                            opacity: 0.22,
                          }}
                        />
                        <div
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            padding: "0 11px",
                            minWidth: 0,
                          }}
                        >
                          {st === "Completed" ? (
                            <span
                              style={{ color: col, display: "flex" }}
                            >
                              <IconCheck size={13} w={3} />
                            </span>
                          ) : (
                            <span
                              className="dot"
                              style={{
                                background: col,
                                width: 8,
                                height: 8,
                              }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "var(--ink)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {g.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* today marker */}
                <div
                  style={{
                    position: "absolute",
                    left: todayX,
                    top: -HEAD_H,
                    bottom: 0,
                    width: 2,
                    background: "var(--brand)",
                    zIndex: 5,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: todayX - 22,
                    top: -HEAD_H + 8,
                    zIndex: 6,
                    background: "var(--brand)",
                    color: "#fff",
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 999,
                    letterSpacing: "0.04em",
                  }}
                >
                  TODAY
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-3)",
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <IconBolt size={13} />
          Scroll inside the timeline to pan · switch Year / Quarter / Month to
          zoom · click any bar for details
        </div>
      </div>

      {completed.length > 0 ? (
        <div style={{ padding: "0 30px 40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <span className="eyebrow">Completed goals</span>
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--ink-3)" }}
            >
              {completed.length}
            </span>
          </div>
          <div
            className="card"
            style={{ padding: "4px 0", overflow: "hidden" }}
          >
            {completed.map((g, i) => {
              const gTasks = tasks.filter(
                (t) => t.parent_goal === g.id,
              );
              const done = gTasks.filter(
                (t) => t.status === "Done",
              ).length;
              return (
                <button
                  key={g.id}
                  onClick={() => setOpenId(g.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 18px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    borderTop: i ? "1px solid var(--line)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      background: "var(--st-done)",
                      color: "#fff",
                    }}
                  >
                    <IconCheck size={14} w={3} />
                  </span>
                  <span
                    className="dot"
                    style={{
                      background: CATEGORY[g.category].color,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: "line-through",
                        textDecorationColor: "var(--ink-3)",
                        color: "var(--ink-2)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.title}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--ink-3)",
                      }}
                    >
                      {CATEGORY[g.category].label} · Target{" "}
                      {fmtDate(g.target_date, "long")}
                      {gTasks.length
                        ? ` · ${done}/${gTasks.length} tasks done`
                        : ""}
                    </span>
                  </div>
                  {g.financial_target ? (
                    <span
                      className="mono tnum"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--st-done)",
                        flex: "0 0 auto",
                      }}
                    >
                      {fmtMoney(g.financial_target, { compact: true })}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

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
