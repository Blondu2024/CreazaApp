/**
 * E2B Sandbox Client — browser-side client that talks to our server-side E2B API
 *
 * E2B SDK needs Node.js (can't run in browser). So:
 * - Server: app/routes/api.e2b.ts handles E2B SDK calls
 * - Client: this file provides the WebContainer-compatible interface
 *
 * All other files import from ~/lib/webcontainer and use the same API.
 */

const WORK_DIR = '/home/user/project';

type EventCallback = (...args: any[]) => void;

/**
 * Process adapter for browser-side
 */
class E2BProcessAdapter {
  private _outputCallbacks: ((data: string) => void)[] = [];
  private _exitResolve!: (code: number) => void;
  private _processId: string;
  private _sandboxId: string;

  output: ReadableStream<string>;
  input: WritableStream<string>;
  exit: Promise<number>;

  constructor(sandboxId: string, processId: string, initialOutput?: string) {
    this._sandboxId = sandboxId;
    this._processId = processId;

    this.exit = new Promise<number>((resolve) => {
      this._exitResolve = resolve;
    });

    let outputController: ReadableStreamDefaultController<string> | undefined;
    this.output = new ReadableStream<string>({
      start(controller) {
        outputController = controller;
      },
    });

    // Queue initial output after microtask (controller assigned in start())
    if (initialOutput) {
      queueMicrotask(() => outputController?.enqueue(initialOutput));
    }

    this.input = new WritableStream<string>({
      write: async (chunk) => {
        await e2bFetch('/api/e2b', 'POST', {
          action: 'stdin',
          sandboxId: this._sandboxId,
          processId: this._processId,
          data: chunk,
        });
      },
    });

    // Poll for output and exit
    this._pollProcess(outputController ?? null);
  }

  private async _pollProcess(controller: ReadableStreamDefaultController<string> | null) {
    const poll = async () => {
      try {
        const result = await e2bFetch('/api/e2b', 'POST', {
          action: 'process-status',
          sandboxId: this._sandboxId,
          processId: this._processId,
        });

        if (result.output) {
          controller?.enqueue(result.output);
        }

        if (result.done) {
          this._exitResolve(result.exitCode ?? 0);
          controller?.close();

          return;
        }

        setTimeout(poll, 500);
      } catch {
        this._exitResolve(1);
        controller?.close();
      }
    };

    poll();
  }

  kill() {
    e2bFetch('/api/e2b', 'POST', {
      action: 'kill-process',
      sandboxId: this._sandboxId,
      processId: this._processId,
    });
  }

  resize(_dimensions: { cols: number; rows: number }) {
    // noop for now
  }
}

/**
 * Filesystem adapter — calls server-side E2B API
 */
class E2BFilesystem {
  private _sandboxId: string;

  constructor(sandboxId: string) {
    this._sandboxId = sandboxId;
  }

  async readFile(path: string, _encoding?: string): Promise<string> {
    const result = await e2bFetch('/api/e2b', 'POST', {
      action: 'read-file',
      sandboxId: this._sandboxId,
      path: this._resolve(path),
    });
    return result.content;
  }

  async writeFile(path: string, content: string | Uint8Array): Promise<void> {
    const strContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
    await e2bFetch('/api/e2b', 'POST', {
      action: 'write-file',
      sandboxId: this._sandboxId,
      path: this._resolve(path),
      content: strContent,
    });
  }

  async readdir(path: string, options?: { withFileTypes?: boolean }): Promise<any[]> {
    const result = await e2bFetch('/api/e2b', 'POST', {
      action: 'list-dir',
      sandboxId: this._sandboxId,
      path: this._resolve(path),
      withFileTypes: options?.withFileTypes,
    });

    if (options?.withFileTypes) {
      return (result.entries || []).map((e: any) => ({
        name: e.name,
        isFile: () => e.type === 'file',
        isDirectory: () => e.type === 'dir' || e.type === 'directory',
      }));
    }

    return (result.entries || []).map((e: any) => e.name || e);
  }

  async mkdir(path: string, _options?: { recursive?: boolean }): Promise<void> {
    await e2bFetch('/api/e2b', 'POST', {
      action: 'mkdir',
      sandboxId: this._sandboxId,
      path: this._resolve(path),
    });
  }

  async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    try {
      await e2bFetch('/api/e2b', 'POST', {
        action: 'remove',
        sandboxId: this._sandboxId,
        path: this._resolve(path),
      });
    } catch (e) {
      if (!options?.force) {
        throw e;
      }
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const content = await this.readFile(oldPath);
    await this.writeFile(newPath, content);
    await this.rm(oldPath);
  }

  watch(_path: string, _options: any, _callback: any) {
    return { close: () => {} };
  }

  private _resolve(path: string): string {
    return path.startsWith('/') ? path : `${WORK_DIR}/${path}`;
  }
}

/**
 * Main E2B adapter — browser-side, matches WebContainer interface
 */
export class E2BSandboxAdapter {
  private _sandboxId: string;
  private _listeners: Map<string, EventCallback[]> = new Map();
  private _pollInterval: ReturnType<typeof setInterval> | null = null;

  fs: E2BFilesystem;
  workdir: string = WORK_DIR;

  constructor(sandboxId: string, workdir?: string) {
    this._sandboxId = sandboxId;
    this.workdir = workdir || WORK_DIR;
    this.fs = new E2BFilesystem(sandboxId);
  }

  static async boot(options?: { workdirName?: string }): Promise<E2BSandboxAdapter> {
    console.log('[E2B] Creating sandbox via server API...');

    const result = await e2bFetch('/api/e2b', 'POST', {
      action: 'create-sandbox',
      workdirName: options?.workdirName,
    });

    if (!result.sandboxId) {
      throw new Error('Failed to create E2B sandbox');
    }

    console.log(`[E2B] Sandbox created: ${result.sandboxId}`);

    const workdir = options?.workdirName ? `/home/user/${options.workdirName}` : WORK_DIR;
    const adapter = new E2BSandboxAdapter(result.sandboxId, workdir);

    return adapter;
  }

  async spawn(command: string, args?: string[], options?: any): Promise<E2BProcessAdapter> {
    const fullCmd = args ? `${command} ${args.join(' ')}` : command;
    const cwd = options?.cwd || this.workdir;

    const result = await e2bFetch('/api/e2b', 'POST', {
      action: 'spawn',
      sandboxId: this._sandboxId,
      command: fullCmd,
      cwd,
    });

    return new E2BProcessAdapter(this._sandboxId, result.processId, result.output);
  }

  on(event: string, callback: EventCallback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }

    this._listeners.get(event)!.push(callback);

    if (event === 'server-ready') {
      this._startPortPolling();
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

  private async _startPortPolling() {
    const knownPorts = new Set<number>();

    const check = async () => {
      try {
        const result = await e2bFetch('/api/e2b', 'POST', {
          action: 'get-ports',
          sandboxId: this._sandboxId,
        });

        for (const port of result.ports || []) {
          if (!knownPorts.has(port.port)) {
            knownPorts.add(port.port);

            const listeners = this._listeners.get('server-ready') || [];

            for (const cb of listeners) {
              cb(port.port, port.url);
            }
          }
        }
      } catch {
        // ignore poll errors
      }
    };

    this._pollInterval = setInterval(check, 2000);
    setTimeout(
      () => {
        if (this._pollInterval) {
          clearInterval(this._pollInterval);
        }
      },
      10 * 60 * 1000,
    );

    check();
  }

  getPreviewUrl(_port: number): string {
    // Will be populated by port polling
    return '';
  }

  async setPreviewScript(_script: string) {
    // noop for E2B
  }

  async teardown() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
    }

    await e2bFetch('/api/e2b', 'POST', {
      action: 'kill-sandbox',
      sandboxId: this._sandboxId,
    });
  }

  get sandboxId(): string {
    return this._sandboxId;
  }
}

/**
 * Helper: fetch our server-side E2B API
 */
async function e2bFetch(url: string, method: string, body: any): Promise<any> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`E2B API error: ${response.status} ${text}`);
  }

  return response.json();
}
