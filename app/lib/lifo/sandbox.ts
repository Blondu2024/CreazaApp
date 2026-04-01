/**
 * Lifo Sandbox Adapter — browser-native runtime replacing E2B + WebContainers
 *
 * Lifo runs entirely in the browser (no server, no cloud sandbox).
 * MIT licensed, free at any scale, sub-ms latency.
 *
 * This module provides the same interface as the previous E2B/WebContainer adapter
 * so all other files continue to work unchanged.
 */
import { Sandbox, type SandboxFs } from '@lifo-sh/core';

const WORK_DIR = '/home/user/project';

type EventCallback = (...args: any[]) => void;

/**
 * Interactive shell process — emulates JSH OSC codes for BoltShell compatibility.
 *
 * BoltShell (app/utils/shell.ts) expects:
 *  - OSC 654 "interactive" on startup
 *  - OSC 654 "prompt" before each command
 *  - OSC 654 "exitCode=N" after each command
 *
 * This adapter translates between BoltShell's expectations and Lifo's commands.run().
 */
class LifoInteractiveShell {
  output: ReadableStream<string>;
  input: WritableStream<string>;
  exit: Promise<number>;

  private _outputController!: ReadableStreamDefaultController<string>;
  private _sandbox: Sandbox;
  private _cwd: string;
  private _inputBuffer = '';
  private _executing = false;
  private _currentAbort: AbortController | null = null;

  constructor(sandbox: Sandbox, cwd: string) {
    this._sandbox = sandbox;
    this._cwd = cwd;

    this.output = new ReadableStream<string>({
      start: (controller) => {
        this._outputController = controller;
      },
    });

    /*
     * IMPORTANT: input handler must NOT return a Promise that blocks.
     * If it did, WritableStream would block further writes (including Ctrl+C)
     * while a long command (npm install) runs. We use synchronous returns
     * and fire-and-forget for command execution.
     */
    this.input = new WritableStream<string>({
      write: (chunk) => {
        this._handleInput(chunk);
      },
    });

    // Shell never exits unless killed
    this.exit = new Promise<number>(() => {});

    // Emit interactive OSC after microtask so stream consumers can attach
    queueMicrotask(() => {
      this._outputController.enqueue('\x1b]654;interactive\x07');
      this._emitPrompt();
    });
  }

  private _emitPrompt() {
    this._outputController.enqueue('\r\n\x1b[32m❯\x1b[0m ');
    this._outputController.enqueue('\x1b]654;prompt\x07');
  }

  private _handleInput(data: string) {
    // Ctrl+C — interrupt running command
    if (data.includes('\x03')) {
      this._inputBuffer = '';

      if (this._currentAbort) {
        this._currentAbort.abort();
        this._currentAbort = null;
      }

      if (!this._executing) {
        this._outputController.enqueue('^C\r\n');
        this._emitPrompt();
      }

      return;
    }

    // Don't accept input while a command is executing
    if (this._executing) {
      return;
    }

    this._inputBuffer += data;

    // Command submitted (newline)
    if (data.includes('\n') || data.includes('\r')) {
      const command = this._inputBuffer.replace(/[\r\n]+$/, '').trim();
      this._inputBuffer = '';
      this._outputController.enqueue('\r\n');

      if (command) {
        // Fire-and-forget — don't block the WritableStream
        this._executeCommand(command);
      } else {
        this._emitPrompt();
      }

      return;
    }

    // Echo typed characters
    this._outputController.enqueue(data);
  }

  private async _executeCommand(command: string) {
    this._executing = true;
    this._currentAbort = new AbortController();

    try {
      const result = await this._sandbox.commands.run(command, {
        cwd: this._cwd,
        signal: this._currentAbort.signal,
        onStdout: (d: string) => this._outputController.enqueue(d),
        onStderr: (d: string) => this._outputController.enqueue(d),
      });

      // Update cwd if cd was used
      this._cwd = this._sandbox.cwd;

      this._outputController.enqueue(`\x1b]654;exitCode=${result.exitCode}\x07`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this._outputController.enqueue(`\x1b[31mError: ${msg}\x1b[0m\r\n`);
      this._outputController.enqueue('\x1b]654;exitCode=1\x07');
    } finally {
      this._executing = false;
      this._currentAbort = null;
      this._emitPrompt();
    }
  }

  kill() {
    // no-op
  }

  resize(_dimensions: { cols: number; rows: number }) {
    // no-op
  }
}

/**
 * Non-interactive process adapter — wraps a single commands.run() call
 * with ReadableStream/WritableStream interface.
 */
class LifoProcessAdapter {
  output: ReadableStream<string>;
  input: WritableStream<string>;
  exit: Promise<number>;

  private _exitResolve!: (code: number) => void;
  private _abortController: AbortController;

  constructor(sandbox: Sandbox, command: string, cwd: string) {
    this._abortController = new AbortController();

    this.exit = new Promise<number>((resolve) => {
      this._exitResolve = resolve;
    });

    let outputController: ReadableStreamDefaultController<string> | undefined;

    this.output = new ReadableStream<string>({
      start(controller) {
        outputController = controller;
      },
    });

    this.input = new WritableStream<string>({
      write: async () => {
        // stdin not used for non-interactive commands
      },
    });

    // Execute async
    sandbox.commands
      .run(command, {
        cwd,
        signal: this._abortController.signal,
        onStdout: (data: string) => outputController?.enqueue(data),
        onStderr: (data: string) => outputController?.enqueue(data),
      })
      .then((result) => {
        this._exitResolve(result.exitCode);
        outputController?.close();
      })
      .catch(() => {
        this._exitResolve(1);
        outputController?.close();
      });
  }

  kill() {
    this._abortController.abort();
  }

  resize(_dimensions: { cols: number; rows: number }) {
    // no-op
  }
}

/**
 * Filesystem adapter — wraps Lifo's SandboxFs with path resolution.
 */
class LifoFilesystem {
  private _fs: SandboxFs;
  private _workdir: string;

  constructor(fs: SandboxFs, workdir: string) {
    this._fs = fs;
    this._workdir = workdir;
  }

  async readFile(path: string, _encoding?: string): Promise<string> {
    return this._fs.readFile(this._resolve(path));
  }

  async writeFile(path: string, content: string | Uint8Array): Promise<void> {
    await this._fs.writeFile(this._resolve(path), content);
  }

  async readdir(path: string, options?: { withFileTypes?: boolean }): Promise<any[]> {
    const entries = await this._fs.readdir(this._resolve(path));

    if (options?.withFileTypes) {
      return entries.map((e) => ({
        name: e.name,
        isFile: () => e.type === 'file',
        isDirectory: () => e.type === 'directory',
      }));
    }

    return entries.map((e) => e.name);
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await this._fs.mkdir(this._resolve(path), options);
  }

  async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    try {
      await this._fs.rm(this._resolve(path), { recursive: options?.recursive });
    } catch (e) {
      if (!options?.force) {
        throw e;
      }
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await this._fs.rename(this._resolve(oldPath), this._resolve(newPath));
  }

  watch(_path: string, _options: any, _callback: any) {
    return { close: () => {} };
  }

  private _resolve(path: string): string {
    return path.startsWith('/') ? path : `${this._workdir}/${path}`;
  }
}

/**
 * Main Lifo adapter — runs entirely in browser, matches WebContainer interface.
 *
 * Drop-in replacement for E2BSandboxAdapter. All other files in the app
 * import from ~/lib/webcontainer and use this through the adapter pattern.
 */
export class LifoSandboxAdapter {
  private _sandbox: Sandbox;
  private _listeners: Map<string, EventCallback[]> = new Map();
  private _portPollInterval: ReturnType<typeof setInterval> | null = null;

  fs: LifoFilesystem;
  workdir: string;

  constructor(sandbox: Sandbox, workdir: string) {
    this._sandbox = sandbox;
    this.workdir = workdir;
    this.fs = new LifoFilesystem(sandbox.fs, workdir);
  }

  static async boot(options?: { workdirName?: string }): Promise<LifoSandboxAdapter> {
    console.log('[Lifo] Creating browser sandbox...');

    const workdir = options?.workdirName ? `/home/user/${options.workdirName}` : WORK_DIR;

    const sandbox = await Sandbox.create({
      persist: true,
      cwd: workdir,
    });

    // Ensure working directory exists
    try {
      await sandbox.fs.mkdir(workdir, { recursive: true });
    } catch {
      // may already exist
    }

    console.log(`[Lifo] Sandbox ready, workdir: ${workdir}`);

    return new LifoSandboxAdapter(sandbox, workdir);
  }

  /**
   * Spawn a process. Returns a WebContainer-compatible process object.
   *
   * - Shell spawns (/bin/jsh, /bin/sh, /bin/bash) → interactive shell with OSC emulation
   * - Other commands → non-interactive command execution
   */
  async spawn(command: string, args?: string[], options?: any): Promise<any> {
    const isShell = command === '/bin/jsh' || command === '/bin/sh' || command === '/bin/bash';

    if (isShell) {
      return new LifoInteractiveShell(this._sandbox, this.workdir);
    }

    const fullCmd = args ? `${command} ${args.join(' ')}` : command;
    const cwd = options?.cwd || this.workdir;

    return new LifoProcessAdapter(this._sandbox, fullCmd, cwd);
  }

  on(event: string, callback: EventCallback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }

    this._listeners.get(event)!.push(callback);

    if (event === 'server-ready') {
      this._startPortDetection();
    }
  }

  off(event: string, callback: EventCallback) {
    const listeners = this._listeners.get(event);

    if (listeners) {
      const idx = listeners.indexOf(callback);

      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
    }
  }

  private _startPortDetection() {
    if (this._portPollInterval) {
      return;
    }

    const knownPorts = new Set<number>();
    const commonPorts = [3000, 3001, 4173, 5173, 8080, 8000];

    const check = async () => {
      for (const port of commonPorts) {
        if (knownPorts.has(port)) {
          continue;
        }

        try {
          const result = await this._sandbox.commands.run(`netstat -tlnp 2>/dev/null | grep :${port} || true`, {
            timeout: 2000,
          });

          if (result.exitCode === 0 && result.stdout.includes(`:${port}`)) {
            knownPorts.add(port);

            const url = `http://localhost:${port}`;
            const listeners = this._listeners.get('server-ready') || [];

            for (const cb of listeners) {
              cb(port, url);
            }
          }
        } catch {
          // ignore poll errors
        }
      }
    };

    this._portPollInterval = setInterval(check, 2000);

    // Auto-stop after 10 minutes
    setTimeout(
      () => {
        if (this._portPollInterval) {
          clearInterval(this._portPollInterval);
          this._portPollInterval = null;
        }
      },
      10 * 60 * 1000,
    );

    check();
  }

  getPreviewUrl(port: number): string {
    return `http://localhost:${port}`;
  }

  async setPreviewScript(_script: string) {
    // no-op for Lifo
  }

  async teardown() {
    if (this._portPollInterval) {
      clearInterval(this._portPollInterval);
    }

    this._sandbox.destroy();
  }

  get sandboxId(): string {
    return 'lifo-browser';
  }

  /**
   * WebContainer internal API compatibility shim.
   * Provides watchPaths and textSearch used by FilesStore and Search component.
   */
  get internal() {
    const sandbox = this._sandbox;
    const workdir = this.workdir;

    return {
      watchPaths(
        _options: { include: string[]; exclude: string[]; includeContent?: boolean },
        _callback: (events: any[]) => void,
      ) {
        /*
         * Lifo VFS doesn't expose a watch API yet — no-op for now.
         * File changes made through the adapter are already tracked by the stores.
         */
      },

      async textSearch(query: string, _options: any, _progressCallback: (results: any) => void) {
        // Basic text search via grep
        try {
          const result = await sandbox.commands.run(`grep -rn "${query}" ${workdir} --include='*.*' || true`, {
            timeout: 10000,
          });

          return { results: result.stdout };
        } catch {
          return { results: '' };
        }
      },
    };
  }
}
