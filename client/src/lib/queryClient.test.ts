import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryClient } from './queryClient';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('queryClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    describe('default queryFn behavior', () => {
        it('should make fetch request with credentials include', async () => {
            const mockResponse = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValueOnce(mockResponse),
            });

            // Get the queryFn from the defaults
            const defaults = queryClient.getDefaultOptions();
            const queryFn = defaults.queries?.queryFn;
            expect(queryFn).toBeDefined();
            expect(typeof queryFn).toBe('function');

            const result = await (queryFn as Function)({
                queryKey: ['/api/test'],
                signal: new AbortController().signal,
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                credentials: 'include',
            });
            expect(result).toEqual(mockResponse);
        });

        it('should throw error with status and statusText for 5xx errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });
            const defaults = queryClient.getDefaultOptions();
            const queryFn = defaults.queries?.queryFn;
            expect(queryFn).toBeDefined();
            expect(typeof queryFn).toBe('function');

            await expect(
                (queryFn as Function)({
                    queryKey: ['/api/test'],
                    signal: new AbortController().signal,
                })
            ).rejects.toThrow('500: Internal Server Error');
        });

        it('should throw error with status and response text for 4xx errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: vi.fn().mockResolvedValueOnce('Bad Request'),
            });
            
            const defaults = queryClient.getDefaultOptions();
            const queryFn = defaults.queries?.queryFn;
            expect(queryFn).toBeDefined();
            expect(typeof queryFn).toBe('function');

            await expect(
                (queryFn as Function)({
                    queryKey: ['/api/test'],
                    signal: new AbortController().signal,
                })
            ).rejects.toThrow('400: Bad Request');
        });
    });

    describe('default options', () => {
        it('should have correct query defaults', () => {
            const defaults = queryClient.getDefaultOptions();
            
            expect(defaults.queries?.refetchInterval).toBe(false);
            expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
            expect(defaults.queries?.staleTime).toBe(Infinity);
            expect(defaults.queries?.retry).toBe(false);
        });

        it('should have correct mutation defaults', () => {
            const defaults = queryClient.getDefaultOptions();
            
            expect(defaults.mutations?.retry).toBe(false);
        });

        it('should be properly configured as a QueryClient instance', () => {
            expect(queryClient).toBeDefined();
            expect(typeof queryClient.getDefaultOptions).toBe('function');
            expect(typeof queryClient.clear).toBe('function');
        });
    });

    describe('queryFn error handling', () => {
        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            
            const defaults = queryClient.getDefaultOptions();
            const queryFn = defaults.queries?.queryFn;
            expect(queryFn).toBeDefined();
            expect(typeof queryFn).toBe('function');

            await expect(
                (queryFn as Function)({
                    queryKey: ['/api/test'],
                    signal: new AbortController().signal,
                })
            ).rejects.toThrow('Network error');
        });

        it('should parse JSON response correctly', async () => {
            const mockData = { success: true, data: { id: 1, name: 'test' } };
            const mockJsonFn = vi.fn().mockResolvedValueOnce(mockData);
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: mockJsonFn,
            });

            const defaults = queryClient.getDefaultOptions();
            const queryFn = defaults.queries?.queryFn;
            expect(queryFn).toBeDefined();

            const result = await (queryFn as Function)({
                queryKey: ['/api/test'],
                signal: new AbortController().signal,
            });

            expect(mockJsonFn).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockData);
        });
    });
});