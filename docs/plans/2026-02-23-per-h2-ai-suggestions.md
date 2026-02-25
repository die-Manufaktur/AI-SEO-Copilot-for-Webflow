# Per-H2 AI Suggestions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give each H2 element its own contextually-relevant AI suggestion during initial analysis, wire up the per-item ✦ (regenerate) and "Generate All" buttons in H2SelectionList, and apply the per-H2 suggestion (not a shared blanket one) when the user clicks Apply.

**Architecture:** Add `h2Recommendations` array to `SEOCheck`; modify the H2 check in `seoAnalysis.ts` to skip the blanket AI call when individual H2 elements are available and instead generate per-H2 suggestions in parallel via `Promise.all`; rewrite `H2SelectionList` to own its local `suggestions` state and call the existing `/api/generate-recommendation` endpoint directly for regeneration; update `Home.tsx` to pass the new props.

**Tech Stack:** TypeScript, React 19, Cloudflare Workers + Hono, Vitest + Testing Library

---

## Key Code Locations (read before editing)

- `shared/types/index.ts` — `SEOCheck` interface (line 4)
- `workers/modules/seoAnalysis.ts` — `createSEOCheck` (line 372), H2 check block (lines 588-622)
- `workers/modules/aiRecommendations.ts` — `getAIRecommendation` with H2 prompt (line 87)
- `workers/index.ts` — `/api/generate-recommendation` endpoint (line 86)
- `client/src/lib/api.ts` — `generateRecommendation` function (line 158)
- `client/src/components/ui/H2SelectionList.tsx` — current component
- `client/src/components/ui/H2SelectionList.test.tsx` — existing tests
- `client/src/pages/Home.tsx` — H2SelectionList usage (lines ~1610-1635)

---

## Task 1: Add `h2Recommendations` to `SEOCheck` type

**Files:**
- Modify: `shared/types/index.ts`
- Modify: `workers/modules/seoAnalysis.h2Integration.test.ts`

### Step 1: Write the failing test

In `workers/modules/seoAnalysis.h2Integration.test.ts`, add this test inside the existing describe block:

```ts
it('should set h2Recommendations to undefined when check passes', async () => {
  const keyphrase = 'test keyword';
  const mockH2Elements: H2ElementInfo[] = [
    { id: 'h2-1', text: 'Our Services with test keyword', index: 0, element: {} as any },
  ];
  const scrapedData = createMockScrapedData([
    { level: 1, text: 'Main Heading' },
    { level: 2, text: 'Our Services with test keyword' },
  ]);
  const webflowPageData = createMockWebflowPageData(mockH2Elements);

  const result = await analyzeSEOElements(
    scrapedData, keyphrase, 'https://example.com', false,
    mockEnv, webflowPageData
  );

  const h2Check = result.checks.find(c => c.title === 'Keyphrase in H2 Headings');
  expect(h2Check?.passed).toBe(true);
  expect(h2Check?.h2Recommendations).toBeUndefined();
});
```

### Step 2: Run the test, confirm TypeScript error on `h2Check?.h2Recommendations`

```bash
cd client && pnpm test -- --testPathPattern="h2Integration" 2>&1 | head -30
```

Expected: TypeScript error — `h2Recommendations` does not exist on `SEOCheck`.

### Step 3: Add `h2Recommendations` to `SEOCheck` in `shared/types/index.ts`

After the `imageData` field (line 16), add:

```ts
  h2Recommendations?: Array<{
    h2Index: number;
    h2Text: string;
    suggestion: string;
  }>;
```

### Step 4: Run the test, confirm it now passes (field exists and is undefined for passing check)

```bash
cd client && pnpm test -- --testPathPattern="h2Integration" 2>&1 | head -30
```

Expected: PASS (the field is `undefined` for a passing check, which is correct).

### Step 5: Commit

```bash
git add shared/types/index.ts workers/modules/seoAnalysis.h2Integration.test.ts
git commit -m "feat(types): add h2Recommendations array to SEOCheck"
```

---

## Task 2: Generate per-H2 suggestions in seoAnalysis.ts

**Files:**
- Modify: `workers/modules/seoAnalysis.ts`
- Modify: `workers/modules/seoAnalysis.h2Integration.test.ts`

### Step 1: Write the failing test

In `workers/modules/seoAnalysis.h2Integration.test.ts`, mock `getAIRecommendation` and add this test:

First, add mock at the top of the file (after existing imports):
```ts
import { getAIRecommendation } from './aiRecommendations';

vi.mock('./aiRecommendations', () => ({
  getAIRecommendation: vi.fn(),
  shouldHaveCopyButton: vi.fn(() => true),
  handleRecommendationResult: vi.fn(),
}));
```

Then add the failing test:
```ts
it('should populate h2Recommendations with per-H2 suggestions when check fails', async () => {
  const mockGetAI = vi.mocked(getAIRecommendation);
  mockGetAI
    .mockResolvedValueOnce('Test Keyword in Our Services')
    .mockResolvedValueOnce('Why We Use Test Keyword');

  const keyphrase = 'test keyword';
  const mockH2Elements: H2ElementInfo[] = [
    { id: 'h2-1', text: 'Our Services', index: 0, element: {} as any },
    { id: 'h2-2', text: 'Why Choose Us', index: 1, element: {} as any },
  ];
  const scrapedData = createMockScrapedData([
    { level: 1, text: 'Main Heading' },
    { level: 2, text: 'Our Services' },
    { level: 2, text: 'Why Choose Us' },
  ]);
  const webflowPageData = createMockWebflowPageData(mockH2Elements);
  const env = { OPENAI_API_KEY: 'mock-key', USE_GPT_RECOMMENDATIONS: 'true' };

  const result = await analyzeSEOElements(
    scrapedData, keyphrase, 'https://example.com', false,
    env, webflowPageData
  );

  const h2Check = result.checks.find(c => c.title === 'Keyphrase in H2 Headings');
  expect(h2Check?.passed).toBe(false);
  expect(h2Check?.h2Recommendations).toHaveLength(2);
  expect(h2Check?.h2Recommendations?.[0]).toEqual({
    h2Index: 0,
    h2Text: 'Our Services',
    suggestion: 'Test Keyword in Our Services',
  });
  expect(h2Check?.h2Recommendations?.[1]).toEqual({
    h2Index: 1,
    h2Text: 'Why Choose Us',
    suggestion: 'Why We Use Test Keyword',
  });
  // AI should be called with each H2's individual text, not concatenated
  expect(mockGetAI).toHaveBeenCalledWith(
    'Keyphrase in H2 Headings', keyphrase, env, 'Our Services', undefined
  );
  expect(mockGetAI).toHaveBeenCalledWith(
    'Keyphrase in H2 Headings', keyphrase, env, 'Why Choose Us', undefined
  );
});

it('should not populate h2Recommendations when no h2Elements in webflowPageData', async () => {
  const mockGetAI = vi.mocked(getAIRecommendation);
  mockGetAI.mockResolvedValue('Blanket H2 suggestion');

  const keyphrase = 'test keyword';
  const scrapedData = createMockScrapedData([
    { level: 1, text: 'Main Heading' },
    { level: 2, text: 'Our Services' },
  ]);
  // webflowPageData has no h2Elements
  const webflowPageData = createMockWebflowPageData();
  const env = { OPENAI_API_KEY: 'mock-key', USE_GPT_RECOMMENDATIONS: 'true' };

  const result = await analyzeSEOElements(
    scrapedData, keyphrase, 'https://example.com', false,
    env, webflowPageData
  );

  const h2Check = result.checks.find(c => c.title === 'Keyphrase in H2 Headings');
  expect(h2Check?.passed).toBe(false);
  expect(h2Check?.h2Recommendations).toBeUndefined();
  // Falls back to blanket recommendation
  expect(h2Check?.recommendation).toBeDefined();
});
```

### Step 2: Run the tests to confirm they FAIL

```bash
cd client && pnpm test -- --testPathPattern="h2Integration" 2>&1 | head -40
```

Expected: FAIL — `h2Recommendations` is `undefined`.

### Step 3: Update the H2 check block in seoAnalysis.ts

Find the H2 check block (around line 588). Change the `createSEOCheck` call to skip the blanket AI call when individual H2 elements are available, then generate per-H2 suggestions:

Replace this section (from the comment `// --- Keyphrase in H2 Headings Check` through `checks.push(h2Check);`):

```ts
  // --- Keyphrase in H2 Headings Check with Designer API integration ---
  // Prefer H2 content from Webflow Designer API when available, fall back to scraped data
  let h2Text = '';
  let h2Count = 0;

  if (webflowPageData?.h2Elements && Array.isArray(webflowPageData.h2Elements)) {
    h2Text = webflowPageData.h2Elements.map(h2 => h2.text).join(' ');
    h2Count = webflowPageData.h2Elements.length;
  } else {
    const scrapedH2s = scrapedData.headings.filter(h => h.level === 2);
    h2Text = scrapedH2s.map(h => h.text).join(' ');
    h2Count = scrapedH2s.length;
  }

  const h2KeywordMatch = checkKeywordMatch(h2Text, keyphrase, secondaryKeywords);
  console.log('[Backend H2 Debug] H2 text:', h2Text);
  console.log('[Backend H2 Debug] Keyphrase:', keyphrase);
  console.log('[Backend H2 Debug] Match result:', h2KeywordMatch);

  // When individual H2 elements are available, skip the blanket AI call and use per-H2 recs instead
  const hasIndividualH2Elements = Boolean(webflowPageData?.h2Elements?.length);
  const h2Env = hasIndividualH2Elements
    ? { ...env, USE_GPT_RECOMMENDATIONS: undefined }
    : env;

  const h2Check = await createSEOCheck(
    "Keyphrase in H2 Headings",
    () => h2KeywordMatch.found,
    h2KeywordMatch.matchedKeyword ?
      `Good! The keyword "${h2KeywordMatch.matchedKeyword}" is found in at least one H2 heading.` :
      `Good! The keyphrase "${keyphrase}" is found in at least one H2 heading.`,
    `H2 headings do not contain the keyphrase "${keyphrase}"${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    `${h2Text} (${h2Count} found)`,
    keyphrase,
    h2Env,
    advancedOptions,
    h2KeywordMatch.matchedKeyword
  );

  // Generate per-H2 suggestions in parallel when individual H2 elements are available
  if (
    !h2Check.passed &&
    hasIndividualH2Elements &&
    env.USE_GPT_RECOMMENDATIONS === 'true' &&
    env.OPENAI_API_KEY
  ) {
    const h2Elements = webflowPageData!.h2Elements!;
    const recs = await Promise.all(
      h2Elements.map(async (h2El) => {
        try {
          const suggestion = await getAIRecommendation(
            'Keyphrase in H2 Headings',
            keyphrase,
            env,
            h2El.text,
            advancedOptions
          );
          return { h2Index: h2El.index, h2Text: h2El.text, suggestion };
        } catch {
          return { h2Index: h2El.index, h2Text: h2El.text, suggestion: '' };
        }
      })
    );
    h2Check.h2Recommendations = recs.filter(r => r.suggestion.length > 0);
  }

  checks.push(h2Check);
```

### Step 4: Run the tests, confirm they pass

```bash
cd client && pnpm test -- --testPathPattern="h2Integration" 2>&1 | head -40
```

Expected: All h2Integration tests PASS.

### Step 5: Run full test suite to check for regressions

```bash
cd client && pnpm test 2>&1 | tail -20
```

Expected: All tests pass.

### Step 6: Commit

```bash
git add workers/modules/seoAnalysis.ts workers/modules/seoAnalysis.h2Integration.test.ts
git commit -m "feat(analysis): generate per-H2 AI suggestions in parallel during analysis"
```

---

## Task 3: Rewrite H2SelectionList to show per-H2 suggestions with regenerate

**Files:**
- Rewrite: `client/src/components/ui/H2SelectionList.tsx`
- Rewrite: `client/src/components/ui/H2SelectionList.test.tsx`

### Step 1: Write the new failing tests

Replace the entire contents of `H2SelectionList.test.tsx` with:

```tsx
/**
 * Tests for H2SelectionList — per-H2 AI suggestions with regenerate functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { H2SelectionList } from './H2SelectionList';
import type { H2ElementInfo } from '../../lib/webflowDesignerApi';
import type { WebflowInsertionResult } from '../../types/webflow-data-api';

// Mock the useAppliedRecommendations hook
vi.mock('../../hooks/useAppliedRecommendations', () => ({
  useAppliedRecommendations: vi.fn(() => ({
    isApplied: vi.fn(() => false),
    markAsApplied: vi.fn(),
  })),
}));

// Mock the api module so tests don't make real HTTP calls
vi.mock('../../lib/api', () => ({
  generateRecommendation: vi.fn().mockResolvedValue('Freshly Generated Suggestion'),
}));

const mockH2Elements: H2ElementInfo[] = [
  { element: {} as any, id: 'h2_1', text: 'Discover Our Real Results', index: 0 },
  { element: {} as any, id: 'h2_2', text: 'Why Choose Our Platform', index: 1 },
  { element: {} as any, id: 'h2_3', text: 'How It Works', index: 2 },
];

const mockH2Recommendations = [
  { h2Index: 0, h2Text: 'Discover Our Real Results', suggestion: 'Real Results with Test Keyword' },
  { h2Index: 1, h2Text: 'Why Choose Our Platform', suggestion: 'Why Test Keyword Users Choose Us' },
  { h2Index: 2, h2Text: 'How It Works', suggestion: 'How Test Keyword Works for You' },
];

const mockInsertionResult: WebflowInsertionResult = {
  success: true,
  data: { _id: 'h2_1', content: 'Applied text', lastUpdated: new Date().toISOString() },
};

const defaultProps = {
  h2Elements: mockH2Elements,
  h2Recommendations: mockH2Recommendations,
  keyphrase: 'test keyword',
  onApply: vi.fn(),
};

describe('H2SelectionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with per-H2 suggestions', () => {
    it('shows the AI suggestion as the prominent text for each H2 card', () => {
      render(<H2SelectionList {...defaultProps} />);
      expect(screen.getByText('Real Results with Test Keyword')).toBeInTheDocument();
      expect(screen.getByText('Why Test Keyword Users Choose Us')).toBeInTheDocument();
      expect(screen.getByText('How Test Keyword Works for You')).toBeInTheDocument();
    });

    it('shows the current H2 text as secondary reference', () => {
      render(<H2SelectionList {...defaultProps} />);
      expect(screen.getByText('Discover Our Real Results')).toBeInTheDocument();
      expect(screen.getByText('Why Choose Our Platform')).toBeInTheDocument();
    });

    it('shows H2 #N label for each card', () => {
      render(<H2SelectionList {...defaultProps} />);
      expect(screen.getByText('H2 #1')).toBeInTheDocument();
      expect(screen.getByText('H2 #2')).toBeInTheDocument();
      expect(screen.getByText('H2 #3')).toBeInTheDocument();
    });

    it('renders "Generate All" button', () => {
      render(<H2SelectionList {...defaultProps} />);
      expect(screen.getByRole('button', { name: /generate all/i })).toBeInTheDocument();
    });

    it('shows empty state when no valid H2 elements', () => {
      render(<H2SelectionList {...defaultProps} h2Elements={[]} />);
      expect(screen.getByText(/no valid h2 elements found/i)).toBeInTheDocument();
    });

    it('falls back gracefully when no h2Recommendations provided', () => {
      render(<H2SelectionList {...defaultProps} h2Recommendations={undefined} />);
      // Should still render h2 cards (no crash), just no suggestion text
      expect(screen.getByText('H2 #1')).toBeInTheDocument();
    });
  });

  describe('Apply functionality', () => {
    it('calls onApply with the per-H2 suggestion (not a shared recommendation)', async () => {
      const user = userEvent.setup();
      const mockOnApply = vi.fn().mockResolvedValue(mockInsertionResult);

      render(<H2SelectionList {...defaultProps} onApply={mockOnApply} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply to h2/i });
      await user.click(applyButtons[0]);

      expect(mockOnApply).toHaveBeenCalledWith({
        h2Element: mockH2Elements[0],
        recommendation: 'Real Results with Test Keyword', // per-H2 suggestion, not shared
      });
    });

    it('calls onApply with the second H2s suggestion when second apply is clicked', async () => {
      const user = userEvent.setup();
      const mockOnApply = vi.fn().mockResolvedValue(mockInsertionResult);

      render(<H2SelectionList {...defaultProps} onApply={mockOnApply} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply to h2/i });
      await user.click(applyButtons[1]);

      expect(mockOnApply).toHaveBeenCalledWith({
        h2Element: mockH2Elements[1],
        recommendation: 'Why Test Keyword Users Choose Us',
      });
    });

    it('shows "Applied" badge and disables all buttons after successful apply', async () => {
      const user = userEvent.setup();
      const mockOnApply = vi.fn().mockResolvedValue(mockInsertionResult);

      render(<H2SelectionList {...defaultProps} onApply={mockOnApply} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply to h2/i });
      await user.click(applyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });
    });
  });

  describe('Per-item regeneration', () => {
    it('calls generateRecommendation with individual H2 text when per-item regenerate clicked', async () => {
      const { generateRecommendation } = await import('../../lib/api');
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenerateButtons[0]); // First H2's regenerate button

      await waitFor(() => {
        expect(generateRecommendation).toHaveBeenCalledWith({
          checkType: 'Keyphrase in H2 Headings',
          keyphrase: 'test keyword',
          context: 'Discover Our Real Results', // individual H2 text
          advancedOptions: undefined,
        });
      });
    });

    it('updates the suggestion for that card after regeneration', async () => {
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      // Initially shows initial suggestion
      expect(screen.getByText('Real Results with Test Keyword')).toBeInTheDocument();

      const regenerateButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenerateButtons[0]);

      // After regeneration, shows the new suggestion from mock
      await waitFor(() => {
        expect(screen.getByText('Freshly Generated Suggestion')).toBeInTheDocument();
      });
    });

    it('only regenerates the clicked H2, leaving others unchanged', async () => {
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenerateButtons[0]); // Only regenerate first H2

      await waitFor(() => {
        expect(screen.getByText('Freshly Generated Suggestion')).toBeInTheDocument();
      });

      // Second and third H2 suggestions unchanged
      expect(screen.getByText('Why Test Keyword Users Choose Us')).toBeInTheDocument();
      expect(screen.getByText('How Test Keyword Works for You')).toBeInTheDocument();
    });

    it('disables per-item regenerate button while regenerating', async () => {
      const { generateRecommendation } = await import('../../lib/api');
      // Delay the mock to simulate loading
      vi.mocked(generateRecommendation).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('New suggestion'), 100))
      );
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenerateButtons[0]);

      // During loading, all regenerate/apply buttons should be in loading/disabled state
      await waitFor(() => {
        expect(regenerateButtons[0]).toBeDisabled();
      });
    });
  });

  describe('"Generate All" button', () => {
    it('calls generateRecommendation for every H2 when "Generate All" clicked', async () => {
      const { generateRecommendation } = await import('../../lib/api');
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const generateAllButton = screen.getByRole('button', { name: /generate all/i });
      await user.click(generateAllButton);

      await waitFor(() => {
        expect(generateRecommendation).toHaveBeenCalledTimes(3);
      });

      expect(generateRecommendation).toHaveBeenCalledWith(expect.objectContaining({
        context: 'Discover Our Real Results',
      }));
      expect(generateRecommendation).toHaveBeenCalledWith(expect.objectContaining({
        context: 'Why Choose Our Platform',
      }));
      expect(generateRecommendation).toHaveBeenCalledWith(expect.objectContaining({
        context: 'How It Works',
      }));
    });

    it('updates all suggestions after "Generate All" completes', async () => {
      const { generateRecommendation } = await import('../../lib/api');
      vi.mocked(generateRecommendation).mockResolvedValue('Freshly Generated Suggestion');
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const generateAllButton = screen.getByRole('button', { name: /generate all/i });
      await user.click(generateAllButton);

      await waitFor(() => {
        const allSuggestions = screen.getAllByText('Freshly Generated Suggestion');
        expect(allSuggestions).toHaveLength(3);
      });
    });
  });

  describe('Disabled state', () => {
    it('disables all buttons when disabled prop is true', () => {
      render(<H2SelectionList {...defaultProps} disabled={true} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn).toBeDisabled());
    });
  });

  describe('Error handling', () => {
    it('calls onError when apply fails', async () => {
      const user = userEvent.setup();
      const mockOnApply = vi.fn().mockRejectedValue(new Error('Apply failed'));
      const mockOnError = vi.fn();

      render(<H2SelectionList {...defaultProps} onApply={mockOnApply} onError={mockOnError} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply to h2/i });
      await user.click(applyButtons[0]);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Apply failed' }));
      });
    });
  });
});
```

### Step 2: Run the tests, confirm they all FAIL

```bash
cd client && pnpm test -- --testPathPattern="H2SelectionList" 2>&1 | head -50
```

Expected: Many failures — new props not accepted, "Generate All" not found, per-H2 suggestion not displayed, `generateRecommendation` not called.

### Step 3: Rewrite H2SelectionList.tsx

Replace the entire file with:

```tsx
/**
 * H2SelectionList Component
 * Displays H2 elements with per-H2 AI suggestions and individual/batch regenerate buttons.
 * Once one is applied, marks check as passed and disables all other buttons.
 */

import React, { useState } from 'react';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { useAppliedRecommendations } from '../../hooks/useAppliedRecommendations';
import { generateRecommendation } from '../../lib/api';
import type { H2ElementInfo } from '../../lib/webflowDesignerApi';
import type { WebflowInsertionResult } from '../../types/webflow-data-api';
import type { AdvancedOptions } from '../../../../shared/types';

const ApplyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 5V8M8 11V8M8 8H11M8 8H5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RegenerateIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5L8.63857 3.22572C9.34757 5.14175 10.8582 6.65243 12.7743 7.36143L14.5 8L12.7743 8.63857C10.8582 9.34757 9.34757 10.8582 8.63857 12.7743L8 14.5L7.36143 12.7743C6.65243 10.8582 5.14175 9.34757 3.22572 8.63857L1.5 8L3.22572 7.36143C5.14175 6.65243 6.65243 5.14175 7.36143 3.22572L8 1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="25 13" strokeLinecap="round"/>
  </svg>
);

export interface H2Recommendation {
  h2Index: number;
  h2Text: string;
  suggestion: string;
}

export interface H2SelectionListProps {
  h2Elements: H2ElementInfo[];
  h2Recommendations?: H2Recommendation[];
  keyphrase: string;
  advancedOptions?: AdvancedOptions;
  onApply: (request: { h2Element: H2ElementInfo; recommendation: string }) => Promise<WebflowInsertionResult>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
  pageId?: string;
  checkTitle?: string;
}

interface H2ItemState {
  loading: boolean;
  success: boolean;
  error?: string;
}

export function H2SelectionList({
  h2Elements,
  h2Recommendations,
  keyphrase,
  advancedOptions,
  onApply,
  onError,
  disabled = false,
  className = '',
  pageId,
  checkTitle = 'Keyphrase in H2 Headings',
}: H2SelectionListProps): React.ReactElement {
  // Build initial suggestions record from h2Recommendations (keyed by h2Index)
  const initialSuggestions: Record<number, string> = {};
  h2Recommendations?.forEach(rec => {
    initialSuggestions[rec.h2Index] = rec.suggestion;
  });

  const [suggestions, setSuggestions] = useState<Record<number, string>>(initialSuggestions);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  const [itemStates, setItemStates] = useState<Record<number, H2ItemState>>({});
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);

  const { markAsApplied } = useAppliedRecommendations({ pageId });

  const validH2Elements = h2Elements.filter(h2 =>
    h2 && h2.id && h2.text && h2.text.trim().length > 0
  );

  if (validH2Elements.length === 0) {
    return (
      <div className={`text-center py-6 text-muted-foreground ${className}`}>
        <p>No valid H2 elements found on this page.</p>
        <p className="text-sm mt-1">Add H2 headings with text content to your page to use this feature.</p>
      </div>
    );
  }

  const updateItemState = (index: number, updates: Partial<H2ItemState>) => {
    setItemStates(prev => ({ ...prev, [index]: { ...prev[index], ...updates } }));
  };

  const handleApply = async (h2Element: H2ElementInfo, index: number) => {
    if (disabled || appliedIndex !== null) return;

    updateItemState(index, { loading: true, error: undefined });

    const recommendation = suggestions[h2Element.index] ?? '';

    try {
      const result = await onApply({ h2Element, recommendation });

      if (result.success) {
        setAppliedIndex(index);
        updateItemState(index, { loading: false, success: true });

        if (pageId && checkTitle) {
          markAsApplied(checkTitle, recommendation, {
            elementType: 'h2',
            elementIndex: index,
            elementId: h2Element.id,
          });
        }
      } else {
        throw new Error('Apply operation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateItemState(index, { loading: false, error: errorMessage });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const handleRegenerate = async (h2Element: H2ElementInfo) => {
    if (disabled || regeneratingAll) return;

    setRegeneratingIndex(h2Element.index);
    try {
      const newSuggestion = await generateRecommendation({
        checkType: 'Keyphrase in H2 Headings',
        keyphrase,
        context: h2Element.text,
        advancedOptions,
      });
      setSuggestions(prev => ({ ...prev, [h2Element.index]: newSuggestion }));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to regenerate suggestion'));
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleRegenerateAll = async () => {
    if (disabled) return;

    setRegeneratingAll(true);
    try {
      const results = await Promise.all(
        validH2Elements.map(async h2El => {
          try {
            const newSuggestion = await generateRecommendation({
              checkType: 'Keyphrase in H2 Headings',
              keyphrase,
              context: h2El.text,
              advancedOptions,
            });
            return { index: h2El.index, suggestion: newSuggestion };
          } catch {
            return { index: h2El.index, suggestion: suggestions[h2El.index] ?? '' };
          }
        })
      );
      const updated: Record<number, string> = {};
      results.forEach(r => { updated[r.index] = r.suggestion; });
      setSuggestions(prev => ({ ...prev, ...updated }));
    } finally {
      setRegeneratingAll(false);
    }
  };

  const isAnyLoading = regeneratingIndex !== null || regeneratingAll;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Generate All header button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerateAll}
          disabled={disabled || isAnyLoading || appliedIndex !== null}
          className="flex items-center gap-1.5 text-xs text-text2 hover:text-text1"
          aria-label="Generate All new suggestions"
        >
          {regeneratingAll ? (
            <SpinnerIcon className="h-3 w-3" />
          ) : (
            <RegenerateIcon className="h-3 w-3" />
          )}
          Generate All
        </Button>
      </div>

      {validH2Elements.map((h2Element, index) => {
        const itemState = itemStates[index] || {};
        const isItemApplied = appliedIndex === index;
        const isOtherApplied = appliedIndex !== null && appliedIndex !== index;
        const isRegeneratingThis = regeneratingIndex === h2Element.index;
        const isDisabled = disabled || appliedIndex !== null || itemState.loading || isAnyLoading;
        const suggestion = suggestions[h2Element.index] ?? '';

        return (
          <div
            key={`${h2Element.id}-${index}`}
            className={`flex items-start gap-3 p-4 rounded-[7px] transition-colors ${
              isItemApplied
                ? 'bg-green-900/30 border border-green-700'
                : isOtherApplied
                ? 'opacity-50'
                : ''
            }`}
            style={!isItemApplied ? {
              background: 'linear-gradient(var(--background3), var(--background3)) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%) border-box',
              border: '1px solid transparent',
            } : undefined}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-text2">H2 #{index + 1}</span>
                {isItemApplied && (
                  <span className="text-xs font-medium text-green-400 bg-green-900/50 px-2 py-0.5 rounded">
                    Applied
                  </span>
                )}
              </div>
              {/* Current H2 text — secondary reference */}
              <p className="text-xs text-text3 mb-1 text-break">{h2Element.text}</p>
              {/* AI suggestion — prominent, actionable */}
              {suggestion && (
                <p className={`text-sm font-medium text-break ${isOtherApplied ? 'text-text3' : 'text-text1'}`}>
                  {suggestion}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApply(h2Element, index)}
                      disabled={isDisabled || !suggestion}
                      className="hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
                      style={{
                        width: '2rem',
                        height: '2rem',
                        minWidth: '2rem',
                        padding: '0.5rem',
                        background: 'linear-gradient(#787878, #787878) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%) border-box',
                        border: '1px solid transparent',
                        borderRadius: '1.6875rem',
                      }}
                      aria-label={`Apply to H2 ${index + 1}: ${h2Element.text}`}
                    >
                      <ApplyIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>Apply to page</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerate(h2Element)}
                      disabled={isDisabled || isRegeneratingThis}
                      className="hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
                      style={{
                        width: '2rem',
                        height: '2rem',
                        minWidth: '2rem',
                        padding: '0.5rem',
                        background: 'linear-gradient(#787878, #787878) padding-box, linear-gradient(135deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.00) 100%) border-box',
                        border: '1px solid transparent',
                        borderRadius: '1.6875rem',
                      }}
                      aria-label="Generate new suggestion"
                    >
                      {isRegeneratingThis ? (
                        <SpinnerIcon className="h-4 w-4" />
                      ) : (
                        <RegenerateIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>Generate new suggestion</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      })}

      {appliedIndex !== null && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-sm text-green-400">
            Successfully applied recommendation to H2 #{appliedIndex + 1}
          </p>
          <p className="text-xs text-green-500 mt-1">
            The H2 check will now show as passed.
          </p>
        </div>
      )}
    </div>
  );
}
```

**Note on import path for `AdvancedOptions`:** Check the actual relative path from `H2SelectionList.tsx` to `shared/types`. If the project resolves `@/types` or similar, adjust accordingly. Common path: `'../../../../shared/types'`.

### Step 4: Run the tests and fix any import path issues

```bash
cd client && pnpm test -- --testPathPattern="H2SelectionList" 2>&1 | head -60
```

Expected: Most tests pass. Fix any import issues if path to `shared/types` is wrong.

### Step 5: Run full test suite

```bash
cd client && pnpm test 2>&1 | tail -20
```

Expected: All tests pass.

### Step 6: Commit

```bash
git add client/src/components/ui/H2SelectionList.tsx client/src/components/ui/H2SelectionList.test.tsx
git commit -m "feat(ui): rewrite H2SelectionList with per-H2 suggestions and regenerate functionality"
```

---

## Task 4: Update Home.tsx to pass the new H2SelectionList props

**Files:**
- Modify: `client/src/pages/Home.tsx`

### Step 1: Find the H2SelectionList usage in Home.tsx

The current usage is around line 1612. It currently passes:
- `h2Elements={h2Elements}` — keep
- `recommendation={check.recommendation || ''}` — REMOVE (replaced by `h2Recommendations`)
- `onRegenerate={async (h2Element, _index) => { ... }}` — REMOVE (H2SelectionList handles this internally now)
- `onApply={...}` — keep (the handler applies `recommendation` from the callback, which is now per-H2)

### Step 2: Update the H2SelectionList props in Home.tsx

Find the block:
```tsx
<H2SelectionList
  h2Elements={h2Elements}
  recommendation={check.recommendation || ''}
  onRegenerate={async (h2Element, _index) => {
    ...long block...
  }}
  onApply={async ({ h2Element, recommendation }) => {
```

Replace with:
```tsx
<H2SelectionList
  h2Elements={h2Elements}
  h2Recommendations={check.h2Recommendations}
  keyphrase={analysisRequestData?.keyphrase || form.getValues('keyphrase')}
  advancedOptions={analysisRequestData?.advancedOptions}
  onApply={async ({ h2Element, recommendation }) => {
```

Keep the rest of `onApply` handler unchanged — it already destructures `recommendation` from the callback argument and uses it correctly.

### Step 3: Check for TypeScript errors

```bash
cd client && pnpm check 2>&1 | grep -i "H2SelectionList\|h2Recommendations\|recommendation" | head -20
```

Expected: No errors for H2SelectionList. Fix any type errors if `recommendation` prop is still referenced.

### Step 4: Run the full test suite

```bash
cd client && pnpm test 2>&1 | tail -20
```

Expected: All tests pass.

### Step 5: Commit

```bash
git add client/src/pages/Home.tsx
git commit -m "feat(home): pass per-H2 recommendations and keyphrase context to H2SelectionList"
```

---

## Task 5: Verify the AdvancedOptions import path in H2SelectionList.tsx

**Files:**
- Potentially modify: `client/src/components/ui/H2SelectionList.tsx`

The `AdvancedOptions` type lives in `shared/types/index.ts`. The import path in `H2SelectionList.tsx` needs to match the project structure.

### Step 1: Find the correct relative path

```bash
# From the H2SelectionList.tsx location, find shared/types
ls "client/src/components/ui/../../../../../../shared/types/index.ts" 2>&1 || echo "not found"
ls "client/src/components/ui/../../../../shared/types/index.ts" 2>&1 || echo "not found"
```

### Step 2: Check if there's a path alias in tsconfig/vite config

```bash
grep -r "shared" client/tsconfig.json client/vite.config.ts 2>/dev/null | head -10
```

### Step 3: Alternatively, import AdvancedOptions from the existing api.ts types

In the existing codebase, `AdvancedOptions` is used in `client/src/lib/api.ts` which imports from `'../../../shared/types'`. From `H2SelectionList.tsx` (which is in `client/src/components/ui/`), the correct relative path would be `'../../../../shared/types'`.

If TypeScript complains, adjust the import:
```ts
import type { AdvancedOptions } from '../../../../shared/types';
```

### Step 4: Run TypeScript check

```bash
cd client && pnpm check 2>&1 | head -20
```

Expected: No type errors.

### Step 5: Commit if any path fix was needed

```bash
git add client/src/components/ui/H2SelectionList.tsx
git commit -m "fix(ui): correct AdvancedOptions import path in H2SelectionList"
```

---

## Task 6: Final verification

### Step 1: Run the complete test suite with coverage

```bash
cd client && pnpm test 2>&1 | tail -30
```

Expected: All tests pass, no regressions.

### Step 2: Run TypeScript check

```bash
cd client && pnpm check 2>&1 | head -20
```

Expected: No errors.

### Step 3: Verify the key behaviors are in place

Mentally verify:
- [ ] `SEOCheck.h2Recommendations` type exists in `shared/types/index.ts`
- [ ] `seoAnalysis.ts` generates per-H2 AI suggestions in parallel when `webflowPageData.h2Elements` is present
- [ ] `seoAnalysis.ts` skips the blanket AI recommendation when individual H2s are available
- [ ] `H2SelectionList` renders per-H2 suggestions prominently
- [ ] `H2SelectionList` renders current H2 text as secondary reference
- [ ] Per-item ✦ button calls `generateRecommendation` with that H2's `text` as context
- [ ] "Generate All" calls `generateRecommendation` for all H2s in parallel
- [ ] Apply button passes the per-H2 suggestion (from local `suggestions` state) to `onApply`
- [ ] `Home.tsx` passes `h2Recommendations`, `keyphrase`, `advancedOptions` to H2SelectionList
- [ ] `Home.tsx` no longer passes the removed `recommendation` and `onRegenerate` props

### Step 4: Final commit summary

If everything passes, no additional commit is needed. The work is complete across the previous 5 task commits.

---

## Potential Gotchas

1. **`h2El.index` vs array index**: The `H2ElementInfo.index` is set by Webflow (could be non-sequential). The `suggestions` record is keyed by `h2El.index`, not by array position. Make sure `handleApply` uses `h2Element.index` (not `index` from `.map()`) to look up the suggestion.

2. **`Promise.all` in Worker environment**: Cloudflare Workers supports `Promise.all` natively. Parallel calls are fine.

3. **H2SelectionList test mock for `../../lib/api`**: The mock path must match exactly what `H2SelectionList.tsx` imports. If the component imports `'../../lib/api'` and the test is in the same directory, the mock path in `vi.mock('../../lib/api', ...)` is correct.

4. **`onRegenerate` prop removed**: `H2SelectionList.tsx` used to accept an `onRegenerate` callback. After this change it doesn't — confirm no other code passes this prop. Search: `grep -r "onRegenerate" client/src/`.

5. **Blanket recommendation removal for H2**: By passing `h2Env` (without `USE_GPT_RECOMMENDATIONS`) to `createSEOCheck` when individual H2 elements are present, `check.recommendation` will be `undefined` for the H2 check. This is fine since the new `H2SelectionList` uses `h2Recommendations` instead. But if any other part of the UI depends on `check.recommendation` for H2, check it first.

6. **Test mock for `getAIRecommendation` in h2Integration.test.ts**: The mock must be added BEFORE the existing tests run. Move the `vi.mock()` call to the top of the file (after imports, before `describe` blocks).
