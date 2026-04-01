/**
 * WebContainer runtime — runs Node.js directly in the browser.
 *
 * No API keys, no cloud sandbox, no server dependency.
 * This is the original bolt.diy approach that just works.
 */
import { WebContainer } from '@webcontainer/api';
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

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        return WebContainer.boot({ workdirName: WORK_DIR_NAME });
      })
      .then(async (wc) => {
        webcontainerContext.loaded = true;

        // workbenchStore loaded for side effects
        void import('~/lib/stores/workbench');

        wc.on('server-ready', (port: number, url: string) => {
          console.log(`[WebContainer] Preview at port ${port}: ${url}`);
        });

        console.log('[WebContainer] Ready');

        return wc;
      })
      .catch((error) => {
        console.error('[WebContainer] Failed to boot:', error);
        throw error;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
