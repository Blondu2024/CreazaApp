/**
 * Runtime adapter — E2B Sandbox (cloud) replaces WebContainers (browser)
 *
 * This module exports the same interface as before (webcontainer, webcontainerContext)
 * so all other files continue to work unchanged.
 *
 * E2B runs code on remote sandboxes instead of in-browser WebContainers.
 * Benefits: more reliable, supports full-stack (Python, Node), no npm install failures.
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

// Export as 'any' since E2BSandboxAdapter mimics WebContainer but isn't the exact TS type
export let webcontainer: Promise<any> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { E2BSandboxAdapter } = await import('~/lib/e2b/sandbox');
        return E2BSandboxAdapter.boot({
          workdirName: WORK_DIR_NAME,
        });
      })
      .then(async (sandbox) => {
        webcontainerContext.loaded = true;

        // workbenchStore loaded for side effects
        void import('~/lib/stores/workbench');

        /*
         * E2B doesn't need preview script injection — previews are served by E2B URL
         * Listen for server-ready events
         */
        sandbox.on('server-ready', (port: number, url: string) => {
          console.log(`[E2B] Preview available at port ${port}: ${url}`);
        });

        console.log('[E2B] Sandbox ready, workdir:', sandbox.workdir);

        return sandbox;
      })
      .catch((error) => {
        console.error('[E2B] Failed to create sandbox:', error);
        throw error;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
