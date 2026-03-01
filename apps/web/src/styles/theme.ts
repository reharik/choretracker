import { DefaultTheme } from "styled-components";

export const theme: DefaultTheme = {
  colors: {
    bg: "#0f1115",
    panel: "#151922",
    border: "#232a36",
    text: "#e7ebf3",
    subtext: "#a8b3c7",
    accent: "#7c9cff",
    accentHover: "#6a8dff",
    danger: "#ff6b6b",
    ok: "#3ddc97",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.25)",
    md: "0 6px 18px rgba(0,0,0,0.25)",
  },
  font: {
    mono: `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
    body: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"`,
  },
  spacing: (n: number) => `${n * 8}px`,
};

export type AppTheme = typeof theme;
