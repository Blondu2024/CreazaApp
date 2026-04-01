/**
 * Runtime adapter — Lifo browser sandbox replaces E2B / WebContainers
 *
 * Lifo runs entirely in the browser: no server, no cloud sandbox, no license fees.
 * MIT licensed, free at any scale, sub-ms latency.
 *
 * This module exports the same interface as before (webcontainer, webcontainerContext)
 * so all other files continue to work unchanged.
 */
import { WORK_DIR_NAME } from '~/utils/constants';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data.webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

// Export as 'any' since LifoSandboxAdapter mimics WebContainer but isn't the exact TS type
export let webcontainer: Promise<any> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { LifoSandboxAdapter } = await import('~/lib/lifo/sandbox');

        return LifoSandboxAdapter.boot({
          workdirName: WORK_DIR_NAME,
        });
      })
      .then(async (sandbox) => {
        webcontainerContext.loaded = true;

        // workbenchStore loaded for side effects
        void import('~/lib/stores/workbench');

        sandbox.on('server-ready', (port: number, url: string) => {
          console.log(`[Lifo] Preview available at port ${port}: ${url}`);
        });

        console.log('[Lifo] Sandbox ready, workdir:', sandbox.workdir);

        return sandbox;
      })
      .catch((error) => {
        console.error('[Lifo] Failed to create sandbox:', error);
        throw error;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
