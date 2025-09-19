// Add TypeScript definitions for the Webflow global object

// Webflow Site Information Types
interface WebflowDomain {
  url: string;
  lastPublished: string | null;
  default: boolean;
  stage: string;
}

interface WebflowSiteInfo {
  siteId: string;
  siteName: string;
  shortName: string;
  isPasswordProtected: boolean;
  isPrivateStaging: boolean;
  domains: WebflowDomain[];
}

interface WebflowPage {
  id: string;
  name: string;
  path: string;
  isHomepage(): Promise<boolean>;
  getTitle(): Promise<string>;
  getDescription(): Promise<string>;
  getSlug(): Promise<string>;
  getOpenGraphTitle(): Promise<string>;
  usesTitleAsOpenGraphTitle(): Promise<boolean>;
  getOpenGraphDescription(): Promise<string>;
  usesDescriptionAsOpenGraphDescription(): Promise<boolean>;
  getOpenGraphImage(): Promise<string>;
  getSearchTitle(): Promise<string>;
  usesTitleAsSearchTitle(): Promise<boolean>;
  getSearchDescription(): Promise<string>;
  usesDescriptionAsSearchDescription(): Promise<boolean>;
  getSearchImage(): Promise<string>;
  isExcludedFromSearch(): Promise<boolean>;
  getPublishPath(): Promise<string>;
}

// Webflow API Extension Interface
interface WebflowExtension {
  setExtensionSize(preset: 'small' | 'medium' | 'large' | 'full' | { width: number; height: number }): Promise<void>;
  getSiteInfo(): Promise<WebflowSiteInfo>;
  getCurrentPage(): Promise<WebflowPage>;
  getAllElements(): Promise<Array<{
    tagName: string;
    textContent: string;
    customAttributes?: Array<{ name: string; value: string }>;
    children?: () => Promise<Array<{ type: string; tagName: string; textContent: string }>>;
  }>>;
  getPublishPath(pageId: string): Promise<string>;
  subscribe(event: 'currentpage', callback: (page: WebflowPage) => void): () => void;
  subscribe(event: string, callback: (data: any) => void): () => void;
  clipboard?: {
    writeText: (text: string) => Promise<void>;
  };
}

// Global Window Interface
interface Window {
  webflow?: WebflowExtension;
}

// SVG Module Declarations
declare module "*.svg" {
  import React from "react";
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Vitest Global Types
declare global {
  namespace vi {
    interface MockedFunction<T extends (...args: any[]) => any> {
      (...args: Parameters<T>): ReturnType<T>;
      mockImplementation(fn: T): this;
      mockResolvedValue(value: Awaited<ReturnType<T>>): this;
      mockRejectedValue(value: any): this;
      mockReturnValue(value: ReturnType<T>): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
    }

    type Mocked<T> = {
      [K in keyof T]: T[K] extends (...args: any[]) => any
        ? MockedFunction<T[K]>
        : T[K] extends object
        ? Mocked<T[K]>
        : T[K];
    };

    function fn<T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T>;
    function spyOn<T, K extends keyof T>(object: T, method: K): MockedFunction<T[K] extends (...args: any[]) => any ? T[K] : never>;
    function stubGlobal(name: string, value: any): void;
    function clearAllMocks(): void;
    function resetAllMocks(): void;
    function restoreAllMocks(): void;
    function useFakeTimers(): void;
    function useRealTimers(): void;
    function advanceTimersByTime(ms: number): void;
    function clearAllTimers(): void;
  }

  const vi: typeof vi;

  namespace expect {
    interface Matchers<R> {
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(times: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenLastCalledWith(...args: any[]): R;
      toHaveBeenNthCalledWith(nthCall: number, ...args: any[]): R;
      toHaveReturned(): R;
      toHaveReturnedTimes(times: number): R;
      toHaveReturnedWith(value: any): R;
      toHaveLastReturnedWith(value: any): R;
      toHaveNthReturnedWith(nthCall: number, value: any): R;
      toHaveLength(length: number): R;
      toHaveProperty(property: string, value?: any): R;
      toContain(item: any): R;
      toContainEqual(item: any): R;
      toEqual(value: any): R;
      toStrictEqual(value: any): R;
      toBe(value: any): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeNull(): R;
      toBeUndefined(): R;
      toBeDefined(): R;
      toBeNaN(): R;
      toBeInstanceOf(constructor: any): R;
      toBeCloseTo(number: number, numDigits?: number): R;
      toBeGreaterThan(number: number): R;
      toBeGreaterThanOrEqual(number: number): R;
      toBeLessThan(number: number): R;
      toBeLessThanOrEqual(number: number): R;
      toMatch(regexp: string | RegExp): R;
      toMatchObject(object: Record<string, any>): R;
      toThrow(error?: string | Error | RegExp): R;
      toThrowError(error?: string | Error | RegExp): R;
      resolves: Matchers<Promise<R>>;
      rejects: Matchers<Promise<R>>;
      objectContaining(object: Record<string, any>): any;
    }
  }

  function expect(actual: any): expect.Matchers<void>;

  // JSX namespace for React 19
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {}
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}
