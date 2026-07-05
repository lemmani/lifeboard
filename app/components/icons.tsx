import type { CSSProperties, ReactNode } from "react";

interface IconProps {
  size?: number;
  w?: number;
  style?: CSSProperties;
  children?: ReactNode;
}

function Icon({ size = 20, w = 1.9, style, children }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

type P = Omit<IconProps, "children">;

export const IconTimeline = (p: P) => (
  <Icon {...p}>
    <rect x={3} y={4} width={18} height={16} rx={2.5} />
    <path d="M3 9h18" />
    <path d="M7 13h6" />
    <path d="M7 16.5h9" />
  </Icon>
);

export const IconGoals = (p: P) => (
  <Icon {...p}>
    <circle cx={12} cy={12} r={8} />
    <circle cx={12} cy={12} r={3.4} />
  </Icon>
);

export const IconMatrix = (p: P) => (
  <Icon {...p}>
    <rect x={3.5} y={3.5} width={17} height={17} rx={2.5} />
    <path d="M12 3.5v17" />
    <path d="M3.5 12h17" />
  </Icon>
);

export const IconFinance = (p: P) => (
  <Icon {...p}>
    <rect x={3} y={6} width={18} height={13} rx={2.5} />
    <path d="M3 10h18" />
    <circle cx={16.5} cy={14.5} r={1.3} />
  </Icon>
);

export const IconSettings = (p: P) => (
  <Icon {...p}>
    <circle cx={12} cy={12} r={3} />
    <path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 .9 2.9h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1z" />
  </Icon>
);

export const IconPlus = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const IconClose = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </Icon>
);

export const IconCheck = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icon>
);

export const IconChevR = (p: P) => (
  <Icon {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);

export const IconChevL = (p: P) => (
  <Icon {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);

export const IconChevD = (p: P) => (
  <Icon {...p}>
    <path d="M5 9l7 7 7-7" />
  </Icon>
);

export const IconFlag = (p: P) => (
  <Icon {...p}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </Icon>
);

export const IconBolt = (p: P) => (
  <Icon {...p}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
  </Icon>
);

export const IconClock = (p: P) => (
  <Icon {...p}>
    <circle cx={12} cy={12} r={8.5} />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const IconCal = (p: P) => (
  <Icon {...p}>
    <rect x={4} y={5} width={16} height={15} rx={2.5} />
    <path d="M4 9h16" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </Icon>
);

export const IconWallet = (p: P) => (
  <Icon {...p}>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1" />
    <rect x={3} y={7.5} width={18} height={12} rx={2.5} />
    <circle cx={16.5} cy={13.5} r={1.2} />
  </Icon>
);

export const IconDrag = (p: P) => (
  <Icon {...p}>
    <circle cx={9} cy={6} r={1} />
    <circle cx={9} cy={12} r={1} />
    <circle cx={9} cy={18} r={1} />
    <circle cx={15} cy={6} r={1} />
    <circle cx={15} cy={12} r={1} />
    <circle cx={15} cy={18} r={1} />
  </Icon>
);

export const IconArrowUp = (p: P) => (
  <Icon {...p}>
    <path d="M12 19V5" />
    <path d="M6 11l6-6 6 6" />
  </Icon>
);

export const IconArrowDn = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M6 13l6 6 6-6" />
  </Icon>
);

export const IconExport = (p: P) => (
  <Icon {...p}>
    <path d="M12 15V3" />
    <path d="M8 7l4-4 4 4" />
    <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
  </Icon>
);

export const IconBell = (p: P) => (
  <Icon {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Icon>
);

export const IconSearch = (p: P) => (
  <Icon {...p}>
    <circle cx={11} cy={11} r={6.5} />
    <path d="M20 20l-4.5-4.5" />
  </Icon>
);
