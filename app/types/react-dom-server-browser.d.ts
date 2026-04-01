declare module 'react-dom/server.browser' {
  export function renderToReadableStream(
    children: React.ReactNode,
    options?: {
      identifierPrefix?: string;
      namespaceURI?: string;
      nonce?: string;
      bootstrapScriptContent?: string;
      bootstrapScripts?: string[];
      bootstrapModules?: string[];
      progressiveChunkSize?: number;
      signal?: AbortSignal;
      onError?: (error: unknown) => string | void;
    },
  ): Promise<ReadableStream & { allReady: Promise<void> }>;

  export function renderToString(element: React.ReactNode): string;
  export function renderToStaticMarkup(element: React.ReactNode): string;
}
