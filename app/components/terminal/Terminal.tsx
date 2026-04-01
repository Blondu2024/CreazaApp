"use client";

import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  logs: string[];
}

export function Terminal({ logs }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new XTerminal({
      theme: {
        background: "#0a0a0f",
        foreground: "#94a3b8",
        cursor: "#6366f1",
        cursorAccent: "#0a0a0f",
        selectionBackground: "rgba(99, 102, 241, 0.2)",
      },
      fontSize: 12,
      fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
      cursorBlink: true,
      convertEol: true,
      disableStdin: true,
      lineHeight: 1.4,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    setTimeout(() => fitAddon.fit(), 50);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    const observer = new ResizeObserver(() => fitAddon.fit());
    observer.observe(terminalRef.current);

    return () => { observer.disconnect(); xterm.dispose(); };
  }, []);

  useEffect(() => {
    const xterm = xtermRef.current;
    if (!xterm || logs.length === 0) return;
    const last = logs[logs.length - 1];

    // Color code log lines
    if (last.startsWith("[OK]")) {
      xterm.writeln(`\x1b[32m${last}\x1b[0m`);
    } else if (last.startsWith("[ERR]")) {
      xterm.writeln(`\x1b[31m${last}\x1b[0m`);
    } else if (last.startsWith("[AI]")) {
      xterm.writeln(`\x1b[35m${last}\x1b[0m`);
    } else if (last.startsWith("[E2B]")) {
      xterm.writeln(`\x1b[36m${last}\x1b[0m`);
    } else {
      xterm.writeln(last);
    }
  }, [logs]);

  return <div ref={terminalRef} className="h-full w-full bg-[#0a0a0f]" />;
}
