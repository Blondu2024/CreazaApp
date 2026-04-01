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
        background: "#1a1a2e",
        foreground: "#e0e0e0",
        cursor: "#2563eb",
      },
      fontSize: 13,
      fontFamily: "var(--font-geist-mono), monospace",
      cursorBlink: true,
      convertEol: true,
      disableStdin: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);

    // Small delay to ensure container is sized
    setTimeout(() => fitAddon.fit(), 50);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    const observer = new ResizeObserver(() => {
      fitAddon.fit();
    });
    observer.observe(terminalRef.current);

    return () => {
      observer.disconnect();
      xterm.dispose();
    };
  }, []);

  // Write new logs
  useEffect(() => {
    const xterm = xtermRef.current;
    if (!xterm || logs.length === 0) return;

    const lastLog = logs[logs.length - 1];
    xterm.writeln(lastLog);
  }, [logs]);

  return (
    <div ref={terminalRef} className="h-full w-full" />
  );
}
