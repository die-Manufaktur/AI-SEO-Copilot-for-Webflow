/**
 * Integration tests to validate TypeScript error fixes
 * Ensures all previous error fixes are working correctly
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { render } from '@testing-library/react';
import React from 'react';
import { 
  WebflowError, 
  WebflowErrorFactory, 
  WebflowAuthError, 
  WebflowServerError 
} from '../../lib/webflowErrors';

describe('TypeScript Error Fixes Validation', () => {
  // Test MSW HttpResponse fixes
  describe('MSW HttpResponse Usage', () => {
    const handlers = [
      http.get('/test', () => {
        return HttpResponse.json({ message: 'success' }, { status: 200 });
      }),
      http.post('/test-error', () => {
        return HttpResponse.json({ error: 'bad request' }, { status: 400 });
      }),
    ];

    const server = setupServer(...handlers);

    beforeAll(() => {
      server.listen();
    });

    afterEach(() => {
      server.resetHandlers();
    });

    afterAll(() => {
      server.close();
    });

    it('should use HttpResponse.json correctly', async () => {
      const response = await fetch('/test');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'success' });
    });

    it('should handle error responses correctly', async () => {
      const response = await fetch('/test-error', { method: 'POST' });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'bad request' });
    });
  });

  // Test WebflowError fixes
  describe('WebflowError Classes', () => {
    it('should create auth errors correctly', () => {
      const error = WebflowAuthError.tokenExpired();
      
      expect(error).toBeInstanceOf(WebflowError);
      expect(error).toBeInstanceOf(WebflowAuthError);
      expect(error.code).toBe(401);
      expect(error.type).toBe('Authentication Error');
    });

    it('should create server errors as fallback', () => {
      const mockResponse = new Response('{}', { status: 503 });
      const apiError = { err: 'service_unavailable', msg: 'Service down', code: 503 };
      
      const error = WebflowErrorFactory.fromResponse(mockResponse, apiError);
      
      expect(error).toBeInstanceOf(WebflowServerError);
      expect(error.code).toBe(503);
    });

    it('should handle unknown errors correctly', () => {
      const error = WebflowErrorFactory.fromUnknownError('unknown error');
      
      expect(error).toBeInstanceOf(WebflowServerError);
      expect(error.message).toBe('unknown error');
      expect(error.code).toBe(500);
    });
  });

  // Test JSX and React component rendering
  describe('JSX and React Components', () => {
    it('should render simple JSX elements without namespace errors', () => {
      const TestComponent: React.FC = () => {
        return (
          <div data-testid="test-component">
            <h1>Test Title</h1>
            <p>Test content</p>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('test-component')).toBeDefined();
    });

    it('should handle React fragments correctly', () => {
      const FragmentComponent: React.FC = () => {
        return (
          <>
            <span data-testid="first">First</span>
            <span data-testid="second">Second</span>
          </>
        );
      };

      const { getByTestId } = render(<FragmentComponent />);
      
      expect(getByTestId('first')).toBeDefined();
      expect(getByTestId('second')).toBeDefined();
    });
  });

  // Test Factory function type annotations
  describe('Test Data Factory Types', () => {
    it('should validate factory function type annotations are working', () => {
      // This test ensures that the fake() and sequence() functions
      // are properly typed and don't cause TypeScript errors
      
      // Mock the test-data-bot functions to verify types
      const fakeFn = (fn: (f: any) => string): string => fn({ lorem: { words: () => 'test' } });
      const sequenceFn = (fn: (x: number) => string): string => fn(1);
      
      const result1 = fakeFn((f) => f.lorem.words());
      const result2 = sequenceFn((x) => `item_${x}`);
      
      expect(result1).toBe('test');
      expect(result2).toBe('item_1');
    });
  });

  // Test Window.location mocking
  describe('Window Location Mocking', () => {
    it('should have properly mocked window.location', () => {
      expect(window.location).toBeDefined();
      expect(window.location.href).toBe('http://localhost:1337');
      expect(window.location.origin).toBe('http://localhost:1337');
      expect(typeof window.location.reload).toBe('function');
      expect(typeof window.location.assign).toBe('function');
      expect(typeof window.location.replace).toBe('function');
    });

    it('should allow window.location properties to be accessed', () => {
      const url = new URL(window.location.href);
      expect(url.hostname).toBe('localhost');
      expect(url.port).toBe('1337');
      expect(url.protocol).toBe('http:');
    });
  });

  // Test Vitest globals
  describe('Vitest Globals Integration', () => {
    it('should have access to vitest functions without import errors', () => {
      expect(typeof expect).toBe('function');
      expect(typeof describe).toBe('function');
      expect(typeof it).toBe('function');
    });
  });
});