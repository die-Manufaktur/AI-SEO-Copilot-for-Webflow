import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { HelpProvider, useHelp } from './HelpContext';
import React from 'react';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('HelpContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <HelpProvider>{children}</HelpProvider>
  );

  describe('Help Toggle', () => {
    it('should enable help by default', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      expect(result.current.isHelpEnabled).toBe(true);
    });

    it('should toggle help on and off', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      expect(result.current.isHelpEnabled).toBe(true);
      
      act(() => {
        result.current.toggleHelp(false);
      });
      
      expect(result.current.isHelpEnabled).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'seo-copilot-help-enabled',
        'false'
      );
    });

    it('should load help preference from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      
      const { result } = renderHook(() => useHelp(), { wrapper });
      expect(result.current.isHelpEnabled).toBe(false);
    });
  });

  describe('Help Content', () => {
    it('should get help content by ID', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      const help = result.current.getHelp('page-title');
      expect(help).toMatchObject({
        id: 'page-title',
        title: 'Page Title',
        content: expect.any(String),
        tips: expect.any(Array)
      });
    });

    it('should return null for unknown help ID', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      const help = result.current.getHelp('unknown-id');
      expect(help).toBeNull();
    });

    it('should get help articles by category', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      const articles = result.current.getHelpByCategory('seo');
      expect(articles).toBeInstanceOf(Array);
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        category: 'seo'
      });
    });
  });

  describe('Help Search', () => {
    it('should search help articles by query', async () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      let searchResults: any[];
      await act(async () => {
        searchResults = await result.current.searchHelp('keyword');
      });
      
      expect(searchResults!).toBeInstanceOf(Array);
      expect(searchResults!.length).toBeGreaterThan(0);
      expect(searchResults![0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        content: expect.any(String),
        relevance: expect.any(Number)
      });
    });

    it('should return empty array for no matches', async () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      let searchResults: any[];
      await act(async () => {
        searchResults = await result.current.searchHelp('xyzabc123');
      });
      
      expect(searchResults!).toEqual([]);
    });

    it('should search case-insensitively', async () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      let lowerResults: any[];
      let upperResults: any[];
      
      await act(async () => {
        lowerResults = await result.current.searchHelp('seo');
        upperResults = await result.current.searchHelp('SEO');
      });
      
      expect(lowerResults!.length).toBe(upperResults!.length);
    });
  });

  describe('Tutorial Management', () => {
    it('should track tutorial progress', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      act(() => {
        result.current.startTutorial('getting-started');
      });
      
      expect(result.current.getCurrentTutorial()).toMatchObject({
        id: 'getting-started',
        currentStep: 0,
        totalSteps: expect.any(Number)
      });
    });

    it('should advance tutorial steps', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      act(() => {
        result.current.startTutorial('getting-started');
        result.current.nextTutorialStep();
      });
      
      const tutorial = result.current.getCurrentTutorial();
      expect(tutorial?.currentStep).toBe(1);
    });

    it('should complete tutorial', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      act(() => {
        result.current.startTutorial('getting-started');
        result.current.completeTutorial();
      });
      
      expect(result.current.getCurrentTutorial()).toBeNull();
      expect(result.current.isTutorialCompleted('getting-started')).toBe(true);
    });

    it('should save tutorial progress to localStorage', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      act(() => {
        result.current.startTutorial('getting-started');
        result.current.nextTutorialStep();
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'seo-copilot-tutorial-progress',
        expect.stringContaining('getting-started')
      );
    });
  });

  describe('Help Analytics', () => {
    it('should track help events', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      act(() => {
        result.current.trackEvent('help_article_viewed', {
          articleId: 'test-article',
          title: 'Test Article'
        });
      });
      
      const analytics = result.current.getHelpAnalytics();
      expect(analytics.articlesViewed).toContain('test-article');
      expect(analytics.totalViews).toBe(1);
    });

    it('should track search queries', async () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      await act(async () => {
        await result.current.searchHelp('test query');
      });
      
      const analytics = result.current.getHelpAnalytics();
      expect(analytics.searchQueries).toContain('test query');
    });

    it('should track tutorial completions', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      act(() => {
        result.current.startTutorial('test-tutorial');
        result.current.completeTutorial();
      });
      
      const analytics = result.current.getHelpAnalytics();
      expect(analytics.tutorialsCompleted).toContain('test-tutorial');
    });

    it('should calculate help effectiveness metrics', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      act(() => {
        // View articles
        result.current.trackEvent('help_article_viewed', { articleId: '1' });
        result.current.trackEvent('help_article_viewed', { articleId: '2' });
        
        // Complete tutorial
        result.current.startTutorial('tutorial1');
        result.current.completeTutorial();
        
        // Search
        result.current.searchHelp('query1');
      });
      
      const analytics = result.current.getHelpAnalytics();
      expect(analytics.effectiveness).toMatchObject({
        averageArticlesPerUser: expect.any(Number),
        tutorialCompletionRate: expect.any(Number),
        searchSuccessRate: expect.any(Number)
      });
    });
  });

  describe('Contextual Help Detection', () => {
    it('should register help targets', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      const element = document.createElement('input');
      element.setAttribute('data-help-id', 'test-input');
      
      act(() => {
        result.current.registerHelpTarget(element);
      });
      
      expect(result.current.getActiveHelpTargets()).toContain('test-input');
    });

    it('should unregister help targets', () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      const element = document.createElement('input');
      element.setAttribute('data-help-id', 'test-input');
      
      act(() => {
        result.current.registerHelpTarget(element);
        result.current.unregisterHelpTarget(element);
      });
      
      expect(result.current.getActiveHelpTargets()).not.toContain('test-input');
    });

    it('should detect help targets in DOM mutations', async () => {
      const { result } = renderHook(() => useHelp(), { wrapper });
      
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      act(() => {
        result.current.enableAutoDetection();
      });
      
      const element = document.createElement('input');
      element.setAttribute('data-help-id', 'dynamic-input');
      container.appendChild(element);
      
      // Wait for mutation observer
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.getActiveHelpTargets()).toContain('dynamic-input');
      
      document.body.removeChild(container);
    });
  });
});