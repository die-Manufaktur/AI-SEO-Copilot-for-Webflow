/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_WORKER_URL?: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly SSR: boolean;
    // Add any other environment variables you use
    readonly [key: string]: string | boolean | undefined;
  }
}