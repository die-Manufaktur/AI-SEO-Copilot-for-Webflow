declare module 'msw' {
  export interface HttpResponse {
    json(data: any, init?: ResponseInit): Response;
    text(text: string, init?: ResponseInit): Response;
    xml(xml: string, init?: ResponseInit): Response;
    arrayBuffer(buffer: ArrayBuffer, init?: ResponseInit): Response;
    stream(stream: ReadableStream, init?: ResponseInit): Response;
  }

  export interface HttpRequestContext {
    request: Request;
    params: Record<string, string>;
    cookies: Record<string, string>;
  }

  export type HttpHandler = (context: HttpRequestContext) => Response | Promise<Response>;
  export type HttpHandlerWithDestructuring = (context: { request: Request; params?: Record<string, string>; cookies?: Record<string, string> }) => Response | Promise<Response>;

  export interface HttpMethods {
    get(url: string, handler: HttpHandlerWithDestructuring): any;
    post(url: string, handler: HttpHandlerWithDestructuring): any;
    put(url: string, handler: HttpHandlerWithDestructuring): any;
    patch(url: string, handler: HttpHandlerWithDestructuring): any;
    delete(url: string, handler: HttpHandlerWithDestructuring): any;
    head(url: string, handler: HttpHandlerWithDestructuring): any;
    options(url: string, handler: HttpHandlerWithDestructuring): any;
  }

  export const http: HttpMethods;
  export const HttpResponse: {
    json(data: any, init?: ResponseInit): Response;
    text(text: string, init?: ResponseInit): Response;
    xml(xml: string, init?: ResponseInit): Response;
    arrayBuffer(buffer: ArrayBuffer, init?: ResponseInit): Response;
    stream(stream: ReadableStream, init?: ResponseInit): Response;
    error(): Response;
  };
}

declare module 'msw/node' {
  export interface SetupServer {
    listen(options?: { onUnhandledRequest?: 'bypass' | 'warn' | 'error' }): void;
    close(): void;
    use(...handlers: any[]): void;
    resetHandlers(...handlers: any[]): void;
    restoreHandlers(): void;
  }

  export function setupServer(...handlers: any[]): SetupServer;
}