/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_WORKER_URL?: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly SSR: boolean;
    readonly [key: string]: string | boolean | undefined;
  }
}