import '@testing-library/jest-dom/vitest';
import { vi, beforeEach } from 'vitest';

// Import MSW configuration first
import './__tests__/setup/mswConfig';

// Import test infrastructure setup
import './__tests__/utils/testHelpers.tsx';

// Mock framer-motion for testing environment
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, {
      get: (target, prop) => {
        // Return a mock component for any motion element (div, span, button, etc.)
        return React.forwardRef(({ 
          children, 
          whileHover, 
          whileTap, 
          animate, 
          initial, 
          exit, 
          transition, 
          variants,
          onAnimationStart,
          onAnimationComplete,
          ...props 
        }: any, ref: any) => {
          // Create the element with the proper tag and pass through all non-motion props
          return React.createElement(prop, {
            ...props,
            ref,
          }, children);
        });
      }
    }),
    AnimatePresence: vi.fn().mockImplementation(({ children, mode, ...props }) => {
      return React.createElement(React.Fragment, null, children);
    }),
    useAnimation: vi.fn(() => ({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      set: vi.fn(),
    })),
    useMotionValue: vi.fn((initial) => ({
      set: vi.fn(),
      get: vi.fn(() => initial),
      destroy: vi.fn(),
      on: vi.fn(),
      clearListeners: vi.fn(),
    })),
    useTransform: vi.fn((input, output) => ({
      set: vi.fn(),
      get: vi.fn(() => output?.[0] || 0),
      destroy: vi.fn(),
      on: vi.fn(),
      clearListeners: vi.fn(),
    })),
  };
});

// Mock floating-ui for tooltip positioning
vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    x: 0,
    y: 0,
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
      reference: null,
      floating: null,
    },
    floatingStyles: {
      position: 'absolute',
      top: '0px',
      left: '0px',
    },
    strategy: 'absolute',
    placement: 'top',
    middlewareData: {},
    isPositioned: true,
    update: vi.fn(),
  })),
  autoUpdate: vi.fn((reference, floating, update) => {
    // Return a cleanup function
    return () => {};
  }),
  offset: vi.fn(),
  shift: vi.fn(),
  flip: vi.fn(),
  arrow: vi.fn(),
  size: vi.fn(),
  hide: vi.fn(),
  computePosition: vi.fn(() => Promise.resolve({
    x: 0,
    y: 0,
    placement: 'top',
    strategy: 'absolute',
    middlewareData: {}
  })),
}));

// Mock floating-ui/react-dom specifically
vi.mock('@floating-ui/react-dom', () => ({
  useFloating: vi.fn(() => ({
    x: 0,
    y: 0,
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
      reference: null,
      floating: null,
    },
    floatingStyles: {
      position: 'absolute',
      top: '0px',
      left: '0px',
    },
    strategy: 'absolute',
    placement: 'top',
    middlewareData: {},
    isPositioned: true,
    update: vi.fn(),
  })),
  autoUpdate: vi.fn((reference, floating, update) => {
    // Return a cleanup function that doesn't call observe
    return () => {};
  }),
  whileElementsMounted: vi.fn((reference, floating, update) => {
    // Return a cleanup function immediately
    return () => {};
  }),
  offset: vi.fn(),
  shift: vi.fn(),
  flip: vi.fn(),
  arrow: vi.fn(),
  size: vi.fn(),
  hide: vi.fn(),
}));

// Mock floating-ui/dom for any direct DOM usage - complete override to prevent io.observe errors
vi.mock('@floating-ui/dom', () => {
  const mockAutoUpdate = vi.fn((reference, floating, update) => {
    // Don't actually start any observers, just return cleanup function
    return () => {};
  });
  
  return {
    computePosition: vi.fn(() => Promise.resolve({
      x: 0,
      y: 0,
      placement: 'top',
      strategy: 'absolute',
      middlewareData: {}
    })),
    offset: vi.fn(),
    shift: vi.fn(),
    flip: vi.fn(),
    arrow: vi.fn(),
    size: vi.fn(),
    hide: vi.fn(),
    autoUpdate: mockAutoUpdate,
    whileElementsMounted: vi.fn((reference, floating, update) => {
      // Return a cleanup function immediately without creating observers
      return () => {};
    }),
  };
});

(global as any).webflow = undefined;

// Mock pointer capture methods for Radix UI compatibility
Object.assign(Element.prototype, {
  hasPointerCapture: vi.fn(() => false),
  setPointerCapture: vi.fn(),
  releasePointerCapture: vi.fn(),
});

// Mock DOMRectReadOnly first
class MockDOMRectReadOnly implements DOMRectReadOnly {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;

  constructor(x = 0, y = 0, width = 200, height = 100) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = y;
    this.left = x;
    this.right = x + width;
    this.bottom = y + height;
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      left: this.left,
    };
  }
}

// Set global DOMRectReadOnly
global.DOMRectReadOnly = MockDOMRectReadOnly as any;
(window as any).DOMRectReadOnly = MockDOMRectReadOnly;

// Mock ResizeObserver with proper class implementation that matches the native API
class MockResizeObserver implements ResizeObserver {
  private callback: ResizeObserverCallback;
  
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  
  observe = vi.fn((target: Element, options?: ResizeObserverOptions) => {
    // Use requestAnimationFrame for better compatibility with Radix UI
    requestAnimationFrame(() => {
      const mockEntry: ResizeObserverEntry = {
        target,
        contentRect: new MockDOMRectReadOnly(),
        borderBoxSize: [{
          blockSize: 100,
          inlineSize: 200,
        }] as ReadonlyArray<ResizeObserverSize>,
        contentBoxSize: [{
          blockSize: 100,
          inlineSize: 200,
        }] as ReadonlyArray<ResizeObserverSize>,
        devicePixelContentBoxSize: [{
          blockSize: 100,
          inlineSize: 200,
        }] as ReadonlyArray<ResizeObserverSize>,
      };
      
      try {
        this.callback([mockEntry], this);
      } catch (error) {
        // Silently ignore callback errors in tests
      }
    });
  });
  
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Ensure global availability with proper typing
global.ResizeObserver = MockResizeObserver;
(window as any).ResizeObserver = MockResizeObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0) as unknown as number);
global.cancelAnimationFrame = vi.fn();

// Mock IntersectionObserver properly to prevent "io.observe is not a function" errors
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;
  private options?: IntersectionObserverInit;
  
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
  }
  
  observe = vi.fn((target: Element) => {
    // Don't actually observe anything in tests
  });
  
  unobserve = vi.fn();
  disconnect = vi.fn();
  
  get root() { return null; }
  get rootMargin() { return '0px'; }
  get thresholds() { return [0]; }
}

// Set up the global IntersectionObserver
global.IntersectionObserver = MockIntersectionObserver as any;

// Also ensure window.IntersectionObserver is set
(window as any).IntersectionObserver = MockIntersectionObserver;

// Mock MutationObserver with proper callback support for React Testing Library
class MockMutationObserver {
  private callback: MutationCallback;
  private observing = false;
  
  constructor(callback: MutationCallback) {
    this.callback = callback;
  }
  
  observe = vi.fn((target: Node, options?: MutationObserverInit) => {
    this.observing = true;
    // Use requestAnimationFrame for better timing with React Testing Library
    requestAnimationFrame(() => {
      if (this.observing) {
        try {
          this.callback([], this);
        } catch (error) {
          // Silently ignore callback errors in tests
        }
      }
    });
  });
  
  disconnect = vi.fn(() => {
    this.observing = false;
  });
  
  takeRecords = vi.fn(() => []);
}

global.MutationObserver = MockMutationObserver as any;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Global error handlers for unhandled promise rejections
let unhandledRejections: any[] = [];

beforeEach(() => {
  // Reset unhandled rejections array
  unhandledRejections = [];
  
  // Capture unhandled promise rejections
  const originalHandler = process.listenerCount('unhandledRejection') > 0 
    ? process.listeners('unhandledRejection')[0] 
    : null;
    
  process.removeAllListeners('unhandledRejection');
  process.on('unhandledRejection', (reason, promise) => {
    unhandledRejections.push({ reason, promise });
    // Only log if it's not a test-related error
    if (reason && !String(reason).includes('Authentication token is required')) {
      console.warn('Unhandled promise rejection in test:', reason);
    }
  });

  // Delete clipboard property completely so userEvent can define its own
  if (navigator.clipboard) {
    try {
      delete (navigator as any).clipboard;
    } catch (e) {
      // If delete fails, try to reconfigure as configurable
      try {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: vi.fn(() => Promise.resolve()),
            readText: vi.fn(() => Promise.resolve('')),
            write: vi.fn(() => Promise.resolve()),
            read: vi.fn(() => Promise.resolve([])),
          },
          writable: true,
          configurable: true,
        });
      } catch (redefineError) {
        // Silent fail if we can't reconfigure
      }
    }
  }
});

// Mock CSS computed styles for jsdom - compatible with cssstyle library
window.getComputedStyle = vi.fn((element: Element) => {
  // Get inline styles from the element
  const htmlElement = element as HTMLElement;
  const inlineStyle = htmlElement.style || {};
  
  // Create a basic style object that's compatible with cssstyle expectations
  const styleProperties = {
    visibility: 'visible',
    display: 'block',
    opacity: '1',
    pointerEvents: 'auto',
    color: inlineStyle.color || 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    // Always use inline styles first, then fallback to defaults
    transform: inlineStyle.transform || 'none',
    transition: inlineStyle.transition || 'none',
    width: inlineStyle.width || '200px',
    height: inlineStyle.height || '16px',
    position: inlineStyle.position || 'static',
    overflow: 'visible',
    zIndex: 'auto',
    fontSize: '16px',
    fontFamily: 'arial',
    textAlign: 'left',
    lineHeight: 'normal',
    margin: '0px',
    padding: '0px',
    border: 'none',
    boxSizing: 'content-box',
    // CSS custom properties for progress circle tests
    '--redText': 'rgb(239, 68, 68)',
    '--yellowText': 'rgb(245, 158, 11)',
    '--blueText': 'rgb(59, 130, 246)',
    '--greenText': 'rgb(34, 197, 94)'
  };

  // Create a simple object without complex prototype chain
  const mockStyle = {
    ...styleProperties,
    length: 0,
    cssText: '',
    parentRule: null,
    
    getPropertyValue: vi.fn((prop: string) => {
      // Handle CSS custom properties
      if (prop.startsWith('--')) {
        return (styleProperties as any)[prop] || '';
      }
      
      // Convert property names to both camelCase and kebab-case
      const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      
      // Check inline styles first (this is what toHaveStyle matcher expects)
      if (inlineStyle && inlineStyle[camelProp as keyof CSSStyleDeclaration]) {
        let value = inlineStyle[camelProp as keyof CSSStyleDeclaration] as string;
        
        // Handle CSS variables in values like "var(--redText)"
        if (value && value.includes('var(--')) {
          const varMatch = value.match(/var\((--[^)]+)\)/);
          if (varMatch) {
            const customProp = varMatch[1];
            const customValue = (styleProperties as any)[customProp];
            if (customValue) {
              value = value.replace(varMatch[0], customValue);
            }
          }
        }
        
        return value;
      }
      
      if (inlineStyle && inlineStyle[kebabProp as keyof CSSStyleDeclaration]) {
        let value = inlineStyle[kebabProp as keyof CSSStyleDeclaration] as string;
        
        // Handle CSS variables in values
        if (value && value.includes('var(--')) {
          const varMatch = value.match(/var\((--[^)]+)\)/);
          if (varMatch) {
            const customProp = varMatch[1];
            const customValue = (styleProperties as any)[customProp];
            if (customValue) {
              value = value.replace(varMatch[0], customValue);
            }
          }
        }
        
        return value;
      }
      
      // For progress tests - check if element has style attribute with specific properties
      if (htmlElement && htmlElement.getAttribute) {
        const styleAttr = htmlElement.getAttribute('style');
        if (styleAttr) {
          // Parse inline style attribute
          const match = styleAttr.match(new RegExp(`${prop}:\\s*([^;]+)`));
          if (match) {
            return match[1].trim();
          }
        }
      }
      
      // Fallback to default properties
      return (styleProperties as any)[prop] || (styleProperties as any)[kebabProp] || (styleProperties as any)[camelProp] || '';
    }),
    getPropertyPriority: vi.fn(() => ''),
    removeProperty: vi.fn(() => ''),
    setProperty: vi.fn(),
    item: vi.fn(() => ''),
  };

  return mockStyle as any;
});

// Track focused element globally for toHaveFocus matcher - with better userEvent compatibility
let focusedElement: Element | null = null;

// Create a custom event that userEvent can recognize and react to
const dispatchFocusChange = (element: Element | null, eventType: 'focus' | 'blur') => {
  const previousElement = focusedElement;
  
  if (eventType === 'focus') {
    // Blur previous element first
    if (previousElement && previousElement !== element) {
      focusedElement = null;
      const blurEvent = new FocusEvent('blur', { 
        bubbles: false, 
        relatedTarget: element as Element 
      });
      Object.defineProperty(blurEvent, 'target', { value: previousElement, configurable: true });
      previousElement.dispatchEvent(blurEvent);
    }
    
    focusedElement = element;
    if (element) {
      const focusEvent = new FocusEvent('focus', { 
        bubbles: false, 
        relatedTarget: previousElement as Element 
      });
      Object.defineProperty(focusEvent, 'target', { value: element, configurable: true });
      element.dispatchEvent(focusEvent);
    }
  } else if (eventType === 'blur') {
    if (focusedElement === element) {
      focusedElement = null;
      if (element) {
        const blurEvent = new FocusEvent('blur', { bubbles: false });
        Object.defineProperty(blurEvent, 'target', { value: element, configurable: true });
        element.dispatchEvent(blurEvent);
      }
    }
  }
};

// Fix Element.prototype for better testing compatibility
Object.assign(Element.prototype, {
  // Enhance getBoundingClientRect for tests
  getBoundingClientRect: vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 16,
    right: 200,
    width: 200,
    height: 16,
    x: 0,
    y: 0,
    toJSON: () => {}
  })),
  // Mock getClientRects
  getClientRects: vi.fn(() => ({
    length: 1,
    item: () => ({
      top: 0,
      left: 0,
      bottom: 16,
      right: 200,
      width: 200,
      height: 16,
    }),
    [0]: {
      top: 0,
      left: 0,
      bottom: 16,
      right: 200,
      width: 200,
      height: 16,
    }
  })),
  // Mock scrollIntoView for element focusing
  scrollIntoView: vi.fn(),
  // Mock selection methods for userEvent
  createTextRange: vi.fn(() => ({
    getBoundingClientRect: vi.fn(() => ({ top: 0, left: 0, bottom: 16, right: 200, width: 200, height: 16 })),
    getClientRects: vi.fn(() => [{ top: 0, left: 0, bottom: 16, right: 200, width: 200, height: 16 }]),
    setEnd: vi.fn(),
    setStart: vi.fn(),
    collapse: vi.fn(),
  })),
});

// Mock document.activeElement with better integration
Object.defineProperty(document, 'activeElement', {
  get: () => focusedElement || document.body,
  configurable: true,
});

// Enhanced focus and blur methods that work better with userEvent
const originalFocus = HTMLElement.prototype.focus;
const originalBlur = HTMLElement.prototype.blur;

// Override focus method to work with userEvent
HTMLElement.prototype.focus = vi.fn(function(this: HTMLElement, options?: FocusOptions) {
  // Only focus if element is focusable
  if (this.tabIndex >= 0 || ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(this.tagName)) {
    dispatchFocusChange(this, 'focus');
  }
  
  // Call original if it exists
  if (typeof originalFocus === 'function') {
    try {
      originalFocus.call(this, options);
    } catch (e) {
      // Ignore focus errors in test environment
    }
  }
}) as any;

// Override blur method to work with userEvent  
HTMLElement.prototype.blur = vi.fn(function(this: HTMLElement) {
  dispatchFocusChange(this, 'blur');
  
  // Call original if it exists
  if (typeof originalBlur === 'function') {
    try {
      originalBlur.call(this);
    } catch (e) {
      // Ignore blur errors in test environment
    }
  }
}) as any;

// Use minimal Range and Selection mocking - let JSDOM handle most of this
// The issue might be our complex mocking interfering with userEvent's text insertion logic

// Minimal Range mock
(global.Range as any) = vi.fn().mockImplementation(() => ({
  setStart: vi.fn(),
  setEnd: vi.fn(),
  collapse: vi.fn(),
  selectNode: vi.fn(),
  selectNodeContents: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    top: 0, left: 0, bottom: 16, right: 200, width: 200, height: 16, x: 0, y: 0
  })),
  getClientRects: vi.fn(() => []),
  insertNode: vi.fn(),
  surroundContents: vi.fn(),
  deleteContents: vi.fn(),
  extractContents: vi.fn(),
  cloneContents: vi.fn(),
  cloneRange: vi.fn(),
  detach: vi.fn(),
  toString: vi.fn(() => ''),
  START_TO_START: 0,
  START_TO_END: 1,
  END_TO_END: 2,
  END_TO_START: 3,
}));

// Minimal Selection mock 
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn(() => ({
    rangeCount: 0,
    focusNode: null,
    focusOffset: 0,
    anchorNode: null,
    anchorOffset: 0,
    isCollapsed: true,
    type: 'None',
    addRange: vi.fn(),
    removeRange: vi.fn(),
    removeAllRanges: vi.fn(),
    getRangeAt: vi.fn(),
    toString: vi.fn(() => ''),
    collapse: vi.fn(),
    extend: vi.fn(),
    selectAllChildren: vi.fn(),
    deleteFromDocument: vi.fn(),
    containsNode: vi.fn(() => false),
  })),
});

// Minimal Document methods
Object.assign(document, {
  createRange: vi.fn(() => new (global.Range as any)()),
  execCommand: vi.fn(() => false),
});

// Simplified setSelectionRange for inputs - don't interfere with userEvent's text cursor logic
Object.defineProperty(HTMLInputElement.prototype, 'setSelectionRange', {
  value: vi.fn(function(this: HTMLInputElement, start: number, end: number) {
    this.selectionStart = start;
    this.selectionEnd = end;
    // Don't create selections for inputs - userEvent handles this internally
  }),
  writable: true,
});

Object.defineProperty(HTMLTextAreaElement.prototype, 'setSelectionRange', {
  value: vi.fn(function(this: HTMLTextAreaElement, start: number, end: number) {
    this.selectionStart = start;
    this.selectionEnd = end;
    // Don't create selections for textareas - userEvent handles this internally
  }),
  writable: true,
});

// Add select() method to input elements
Object.defineProperty(HTMLInputElement.prototype, 'select', {
  value: vi.fn(function(this: HTMLInputElement) {
    this.setSelectionRange(0, this.value.length);
    this.focus();
  }),
  writable: true,
});

Object.defineProperty(HTMLTextAreaElement.prototype, 'select', {
  value: vi.fn(function(this: HTMLTextAreaElement) {
    this.setSelectionRange(0, this.value.length);
    this.focus();
  }),
  writable: true,
});

// Mock tabIndex for focusing with proper defaults for focusable elements
Object.defineProperty(HTMLElement.prototype, 'tabIndex', {
  get: function(this: HTMLElement) {
    const explicitTabIndex = this.getAttribute('tabindex');
    if (explicitTabIndex !== null) {
      return parseInt(explicitTabIndex, 10);
    }
    
    // Default tabIndex values for focusable elements
    if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(this.tagName)) {
      return 0; // Naturally focusable elements
    }
    
    return -1; // Non-focusable by default
  },
  set: vi.fn(function(this: HTMLElement, value: number) {
    this.setAttribute('tabindex', value.toString());
  }),
  configurable: true,
});

// Ensure HTMLElement style property works correctly with toHaveStyle matcher
Object.defineProperty(HTMLElement.prototype, 'style', {
  get: function(this: HTMLElement) {
    // Get existing style or create a new one
    let style = (this as any)._style;
    if (!style) {
      // Create a proper CSSStyleDeclaration mock
      style = {
        // Store actual style values
        _values: new Map<string, string>(),
        
        // Getters/setters for common CSS properties
        get width() { return this._values.get('width') || ''; },
        set width(value: string) { 
          this._values.set('width', value);
          this._updateStyleAttribute();
        },
        
        get height() { return this._values.get('height') || ''; },
        set height(value: string) { 
          this._values.set('height', value);
          this._updateStyleAttribute();
        },
        
        get transform() { return this._values.get('transform') || ''; },
        set transform(value: string) { 
          this._values.set('transform', value);
          this._updateStyleAttribute();
        },
        
        get color() { return this._values.get('color') || ''; },
        set color(value: string) { 
          this._values.set('color', value);
          this._updateStyleAttribute();
        },
        
        get transition() { return this._values.get('transition') || ''; },
        set transition(value: string) { 
          this._values.set('transition', value);
          this._updateStyleAttribute();
        },
        
        // Generic property methods
        getPropertyValue: (prop: string) => {
          return style._values.get(prop) || '';
        },
        
        setProperty: (prop: string, value: string) => {
          style._values.set(prop, value);
          style._updateStyleAttribute();
        },
        
        removeProperty: (prop: string) => {
          const oldValue = style._values.get(prop) || '';
          style._values.delete(prop);
          style._updateStyleAttribute();
          return oldValue;
        },
        
        // Update the style attribute when properties change
        _updateStyleAttribute: function() {
          const styleString = Array.from(this._values.entries() as IterableIterator<[string, string]>)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');
          if (styleString) {
            (style._element as HTMLElement).setAttribute('style', styleString);
          } else {
            (style._element as HTMLElement).removeAttribute('style');
          }
        },
        
        get cssText() {
          return Array.from(this._values.entries() as IterableIterator<[string, string]>)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');
        },
        
        set cssText(value: string) {
          this._values.clear();
          if (value) {
            const declarations = value.split(';');
            declarations.forEach(decl => {
              const [prop, val] = decl.split(':').map(s => s.trim());
              if (prop && val) {
                this._values.set(prop, val);
              }
            });
          }
          this._updateStyleAttribute();
        },
        
        length: 0,
        item: () => '',
        parentRule: null
      };
      
      // Set reference back to element
      style._element = this;
      
      // Cache the style object
      (this as any)._style = style;
    }
    
    return style;
  },
  set: function(this: HTMLElement, value: any) {
    if (typeof value === 'string') {
      // Handle style as CSS text
      this.style.cssText = value;
    } else if (value && typeof value === 'object') {
      // Handle style as object with properties
      const style = this.style;
      Object.entries(value).forEach(([prop, val]) => {
        if (typeof val === 'string') {
          style.setProperty(prop, val);
        }
      });
    }
  },
  configurable: true,
});

// Mock offsetParent for visibility checks
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get: vi.fn(() => document.body),
  configurable: true,
});

// Mock additional offset and scroll properties for HelpSystem tests
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  get: vi.fn(function(this: HTMLElement) { return 100; }),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  get: vi.fn(function(this: HTMLElement) { return 200; }),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
  get: vi.fn(function(this: HTMLElement) { return 0; }),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
  get: vi.fn(function(this: HTMLElement) { return 0; }),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  get: vi.fn(function(this: HTMLElement) { return 200; }),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
  get: vi.fn(function(this: HTMLElement) { return 300; }),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
  get: vi.fn(function(this: HTMLElement) { return 0; }),
  set: vi.fn(),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
  get: vi.fn(function(this: HTMLElement) { return 0; }),
  set: vi.fn(),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  get: vi.fn(function(this: HTMLElement) { return 100; }),
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  get: vi.fn(function(this: HTMLElement) { return 200; }),
  configurable: true,
});

// Let userEvent handle input values completely - no custom value property
// userEvent is designed to work with native input behavior

// Ensure input elements have proper focus behavior
Object.defineProperty(HTMLInputElement.prototype, 'disabled', {
  get: function(this: any) { 
    return this.hasAttribute('disabled'); 
  },
  set: function(this: any, val: boolean) { 
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  },
  configurable: true,
});

Object.defineProperty(HTMLTextAreaElement.prototype, 'value', {
  get: function(this: any) { 
    return this._value !== undefined ? this._value : this.getAttribute('value') || this.textContent || ''; 
  },
  set: function(this: any, val: string) { 
    this._value = val;
    this.setAttribute('value', val);
    this.textContent = val;
  },
  configurable: true,
});

// Note: tabIndex for textarea is already handled by HTMLElement.prototype.tabIndex above

// Make textarea clearable and focusable
Object.defineProperty(HTMLTextAreaElement.prototype, 'disabled', {
  get: function(this: any) { 
    return this.hasAttribute('disabled'); 
  },
  set: function(this: any, val: boolean) { 
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  },
  configurable: true,
});

// Mock selection properties with proper tracking - this is crucial for userEvent text insertion
Object.defineProperty(HTMLInputElement.prototype, 'selectionStart', {
  get: function(this: HTMLInputElement) {
    return (this as any)._selectionStart ?? this.value.length;
  },
  set: function(this: HTMLInputElement, value: number) {
    (this as any)._selectionStart = value;
  },
  configurable: true,
});

Object.defineProperty(HTMLInputElement.prototype, 'selectionEnd', {
  get: function(this: HTMLInputElement) {
    return (this as any)._selectionEnd ?? this.value.length;
  },
  set: function(this: HTMLInputElement, value: number) {
    (this as any)._selectionEnd = value;
  },
  configurable: true,
});

Object.defineProperty(HTMLTextAreaElement.prototype, 'selectionStart', {
  get: function(this: HTMLTextAreaElement) {
    return (this as any)._selectionStart ?? this.value.length;
  },
  set: function(this: HTMLTextAreaElement, value: number) {
    (this as any)._selectionStart = value;
  },
  configurable: true,
});

Object.defineProperty(HTMLTextAreaElement.prototype, 'selectionEnd', {
  get: function(this: HTMLTextAreaElement) {
    return (this as any)._selectionEnd ?? this.value.length;
  },
  set: function(this: HTMLTextAreaElement, value: number) {
    (this as any)._selectionEnd = value;
  },
  configurable: true,
});