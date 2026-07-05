"use client";

import { useEffect } from "react";
import { Modal } from "./shared";
import { IconCheck } from "./icons";

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface Props {
  request: ConfirmRequest | null;
  onClose: () => void;
}

export function ConfirmDialog({ request, onClose }: Props) {
  useEffect(() => {
    if (!request) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        request!.onConfirm();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [request, onClose]);

  if (!request) return null;
  const danger = request.danger ?? true;
  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ padding: "22px 24px 12px" }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          {request.title}
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--ink-2)",
            lineHeight: 1.5,
          }}
        >
          {request.message}
        </div>
      </div>
      <div
        style={{
          padding: "14px 22px 18px",
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          background: "var(--bg-2)",
          borderTop: "1px solid var(--line)",
        }}
      >
        <button className="pill" onClick={onClose} autoFocus>
          Cancel
        </button>
        <button
          className="btn-primary"
          style={
            danger
              ? {
                  background: "var(--st-over)",
                }
              : undefined
          }
          onClick={() => {
            request.onConfirm();
            onClose();
          }}
        >
          <IconCheck size={14} />
          {request.confirmLabel ?? "Confirm"}
        </button>
      </div>
    </Modal>
  );
}
