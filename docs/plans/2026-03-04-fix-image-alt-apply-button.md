# Fix Image Alt Attributes Apply Button via Standard Insertion Pipeline

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Image Alt Attributes Apply button work by routing it through the standard insertion pipeline, consistent with all other SEO checks.

**Architecture:** The current `onApply` in `Home.tsx` bypasses the insertion pipeline by directly instantiating `WebflowDesignerExtensionAPI` inline. We will add `'image_alt'` as a new insertion type recognized by the type system, insertion helpers, and `WebflowInsertion` router. Then we rewire `Home.tsx` to call `applyInsertion()` from `InsertionContext` instead.

**Tech Stack:** React 19, TypeScript, Vitest, Webflow Designer Extension API

---

## Important Context

- `Home.tsx` already destructures `applyInsertion` from `useInsertion()` at line 350
- `WebflowDesignerExtensionAPI.updateImageAltText()` at `webflowDesignerApi.ts:870` is already implemented and correct
- `WebflowInsertion` constructor already initializes `this.designerApi` when `window.webflow` exists
- The existing test at `insertionHelpers.test.ts:48-63` **asserts** `'Image Alt Attributes'` returns `null` — this test must be updated
- `image_alt` does NOT require `pageId` (it identifies elements by image URL), so `validateRequest()` must not enforce `pageId` for this type

## Files Modified

| File | Action |
|------|--------|
| `client/src/types/webflow-data-api.d.ts` | Add `'image_alt'` to type union + `imageUrl` field |
| `client/src/utils/insertionHelpers.ts` | Add image alt mapping + `imageUrl` in context |
| `client/src/utils/insertionHelpers.test.ts` | Update test expectations + add new tests |
| `client/src/lib/webflowInsertion.ts` | Add `applyImageAlt()` + switch case + validation |
| `client/src/lib/webflowInsertion.test.ts` | Add `image_alt` test cases |
| `client/src/pages/Home.tsx` | Replace inline `onApply` with pipeline call |

---

### Task 1: Add `image_alt` to the Type System

**Files:**
- Modify: `client/src/types/webflow-data-api.d.ts:222-234`

**Step 1: Add `'image_alt'` to the insertion type union**

In `WebflowInsertionRequest` interface (line 223), add `'image_alt'` to the type union:

```typescript
type: 'page_title' | 'meta_description' | 'page_seo' | 'page_slug' | 'cms_field' | 'custom_code' | 'h1_heading' | 'h2_heading' | 'introduction_text' | 'image_alt';
```

**Step 2: Add `imageUrl` optional field**

After line 228 (`value: any;`), add:

```typescript
imageUrl?: string; // For image_alt type: identifies which image to update by src URL
```

**Step 3: Run type check to verify no compilation errors**

Run: `pnpm check`
Expected: PASS (new type is additive, no existing code breaks)

**Step 4: Commit**

```bash
git add client/src/types/webflow-data-api.d.ts
git commit -m "feat(types): add image_alt insertion type and imageUrl field to WebflowInsertionRequest"
```

---

### Task 2: Add Image Alt Mapping to Insertion Helpers

**Files:**
- Modify: `client/src/utils/insertionHelpers.ts`
- Modify: `client/src/utils/insertionHelpers.test.ts`

**Step 1: Update the existing test that asserts `'Image Alt Attributes'` returns null**

In `insertionHelpers.test.ts`, the test at line 46-63 lists `'Image Alt Attributes'` in the `nonInsertableChecks` array. Remove it from that array.

Then add new tests:

```typescript
describe('createInsertionRequest - Image Alt checks', () => {
  it('should create image_alt request for "Image Alt Attributes" check', () => {
    const context: RecommendationContext = {
      checkTitle: 'Image Alt Attributes',
      recommendation: 'A golden retriever playing fetch in the park',
      imageUrl: 'https://example.com/dog.jpg',
    };

    const request = createInsertionRequest(context);

    expect(request).not.toBeNull();
    expect(request?.type).toBe('image_alt');
    expect(request?.value).toBe('A golden retriever playing fetch in the park');
    expect(request?.imageUrl).toBe('https://example.com/dog.jpg');
  });

  it('should handle various image alt check title formats', () => {
    const imageAltChecks = [
      'Image Alt Attributes',
      'Alt Attribute',
      'image alt',
    ];

    imageAltChecks.forEach(checkTitle => {
      const request = createInsertionRequest({
        checkTitle,
        recommendation: 'Test alt text',
        imageUrl: 'https://example.com/test.jpg',
      });

      expect(request?.type).toBe('image_alt');
    });
  });
});

describe('canApplyRecommendation - Image Alt checks', () => {
  it('should return true for "Image Alt Attributes"', () => {
    expect(canApplyRecommendation('Image Alt Attributes')).toBe(true);
  });
});

describe('getApplyDescription - Image Alt checks', () => {
  it('should return correct description for image alt checks', () => {
    expect(getApplyDescription('Image Alt Attributes')).toBe('Apply as image alt text');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && pnpm vitest run src/utils/insertionHelpers.test.ts`
Expected: FAIL — `getInsertionTypeFromCheckTitle` doesn't recognize image alt yet

**Step 3: Implement the mapping in `insertionHelpers.ts`**

3a. Update the return type of `getInsertionTypeFromCheckTitle` (line 66) to include `'image_alt'`:

```typescript
function getInsertionTypeFromCheckTitle(
  checkTitle: string
): 'page_title' | 'meta_description' | 'page_seo' | 'page_slug' | 'cms_field' | 'custom_code' | 'h1_heading' | 'h2_heading' | 'introduction_text' | 'image_alt' | null {
```

3b. Add the image alt matching block BEFORE the "Return null" comment at line 159:

```typescript
// Image alt text checks
if (
  normalizedTitle.includes('image alt') ||
  normalizedTitle.includes('alt attribute')
) {
  return 'image_alt';
}
```

3c. Add `imageUrl` to `RecommendationContext` interface (line 7-13):

```typescript
export interface RecommendationContext {
  checkTitle: string;
  recommendation: string;
  pageId?: string;
  cmsItemId?: string;
  fieldId?: string;
  imageUrl?: string;
}
```

3d. In `createInsertionRequest()`, after the `fieldId` block (line 47), add:

```typescript
if (context.imageUrl) {
  baseRequest.imageUrl = context.imageUrl;
}
```

3e. Add `'image_alt'` case to `getApplyDescription()` switch (before the `default` case):

```typescript
case 'image_alt':
  return 'Apply as image alt text';
```

**Step 4: Run test to verify it passes**

Run: `cd client && pnpm vitest run src/utils/insertionHelpers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/src/utils/insertionHelpers.ts client/src/utils/insertionHelpers.test.ts
git commit -m "feat(insertionHelpers): add image_alt type mapping and imageUrl context"
```

---

### Task 3: Add `applyImageAlt` to WebflowInsertion Router

**Files:**
- Modify: `client/src/lib/webflowInsertion.ts`
- Modify: `client/src/lib/webflowInsertion.test.ts`

**Step 1: Write the failing test**

Add to `webflowInsertion.test.ts` (find a suitable location near other `apply` tests):

```typescript
describe('image_alt operations', () => {
  it('should call designerApi.updateImageAltText for image_alt type', async () => {
    // Set up Designer API mock
    const mockDesignerApi = {
      updateImageAltText: vi.fn().mockResolvedValue(true),
    };
    (insertion as any).designerApi = mockDesignerApi;
    (insertion as any).useDesignerAPI = true;

    const request: WebflowInsertionRequest = {
      type: 'image_alt',
      value: 'A cute puppy playing',
      imageUrl: 'https://example.com/puppy.jpg',
      checkTitle: 'Image Alt Attributes',
    };

    const result = await insertion.apply(request);

    expect(result.success).toBe(true);
    expect(mockDesignerApi.updateImageAltText).toHaveBeenCalledWith(
      'https://example.com/puppy.jpg',
      'A cute puppy playing'
    );
  });

  it('should throw when imageUrl is missing for image_alt type', async () => {
    const mockDesignerApi = {
      updateImageAltText: vi.fn(),
    };
    (insertion as any).designerApi = mockDesignerApi;
    (insertion as any).useDesignerAPI = true;

    const request: WebflowInsertionRequest = {
      type: 'image_alt',
      value: 'Some alt text',
      checkTitle: 'Image Alt Attributes',
    };

    const result = await insertion.apply(request);
    expect(result.success).toBe(false);
  });

  it('should throw when Designer API is not available for image_alt', async () => {
    (insertion as any).designerApi = undefined;
    (insertion as any).useDesignerAPI = false;

    const request: WebflowInsertionRequest = {
      type: 'image_alt',
      value: 'Some alt text',
      imageUrl: 'https://example.com/test.jpg',
      checkTitle: 'Image Alt Attributes',
    };

    const result = await insertion.apply(request);
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && pnpm vitest run src/lib/webflowInsertion.test.ts`
Expected: FAIL — `Unknown insertion type: image_alt`

**Step 3: Implement `applyImageAlt` and add to the switch**

3a. Add the `'image_alt'` case to the `apply()` method's switch statement (after `'introduction_text'` case, around line 112):

```typescript
case 'image_alt':
  result = await this.applyImageAlt(request);
  break;
```

3b. Add the private method (after `applyIntroductionText`, around line 694):

```typescript
/**
 * Apply image alt text change using Webflow Designer API
 */
private async applyImageAlt(request: WebflowInsertionRequest): Promise<WebflowInsertionResult> {
  try {
    if (!request.imageUrl) {
      throw new Error('Image URL is required for image_alt operations');
    }
    if (this.useDesignerAPI && this.designerApi) {
      console.log('[WebflowInsertion] Using Designer API to update image alt text');
      const success = await this.designerApi.updateImageAltText(request.imageUrl, request.value as string);

      if (success) {
        return {
          success: true,
          data: {
            type: 'image_alt',
            imageUrl: request.imageUrl,
            originalValue: null,
            newValue: request.value,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        throw new Error('Failed to update image alt text via Designer API');
      }
    } else {
      throw new Error('Image alt text updates require Designer Extension API');
    }
  } catch (error) {
    console.error('[WebflowInsertion] Failed to update image alt text:', error);
    throw error;
  }
}
```

3c. Update `validateRequest()` to NOT require `pageId` for `image_alt`. The existing validation at line 286-292 checks for `pageId` on page-based types. `image_alt` is NOT in that list, so it will naturally skip. However, the value validation at line 306 will apply — which is correct (alt text should not be empty). No changes needed to `validateRequest` since `image_alt` is not listed in the pageId-required types.

**Step 4: Run test to verify it passes**

Run: `cd client && pnpm vitest run src/lib/webflowInsertion.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/src/lib/webflowInsertion.ts client/src/lib/webflowInsertion.test.ts
git commit -m "feat(webflowInsertion): add applyImageAlt method for image_alt insertion type"
```

---

### Task 4: Rewire Home.tsx to Use the Insertion Pipeline

**Files:**
- Modify: `client/src/pages/Home.tsx:1677-1700`

**Step 1: Replace the inline `onApply` callback**

The current `onApply` at lines 1677-1700 directly creates `new WebflowDesignerExtensionAPI()`. Replace it with a pipeline-based approach using `applyInsertion` (already available at line 350):

Replace lines 1677-1700 with:

```typescript
onApply={async ({ image, newAltText }) => {
  try {
    const result = await applyInsertion({
      type: 'image_alt',
      value: newAltText,
      checkTitle: 'Image Alt Attributes',
      imageUrl: image.url,
      pageId: currentPageId,
    });
    if (result.success) {
      toast({
        title: "Your text has been included successfully",
        description: "Don't forget to publish your website to update the SEO score.",
      });
    }
    return { success: result.success };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast({
      variant: "destructive",
      title: "Apply Failed",
      description: errorMessage,
    });
    return { success: false };
  }
}}
```

**Step 2: Remove unused `WebflowDesignerExtensionAPI` import if no longer needed**

Check if `WebflowDesignerExtensionAPI` is used elsewhere in `Home.tsx`. It's imported at line 63. Search for other usages — if it's only used in the image alt `onApply`, remove the import. If it's used elsewhere (e.g., H2 handling), keep it.

Run: `grep -n "WebflowDesignerExtensionAPI" client/src/pages/Home.tsx`

If only found on lines 63 (import) and the old onApply (now removed), delete line 63.

**Step 3: Run type check**

Run: `pnpm check`
Expected: PASS

**Step 4: Run all tests**

Run: `pnpm test`
Expected: PASS (no existing tests depend on the inline behavior)

**Step 5: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat(Home): route image alt apply through standard insertion pipeline"
```

---

### Task 5: Final Verification

**Step 1: Run full type check**

Run: `pnpm check`
Expected: PASS

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS (or only pre-existing warnings)

**Step 4: Verify no regressions in related tests**

Run specifically:
```bash
cd client
pnpm vitest run src/utils/insertionHelpers.test.ts
pnpm vitest run src/lib/webflowInsertion.test.ts
pnpm vitest run src/components/ui/ImageAltTextList.test.ts
```
Expected: All PASS

**Step 5: Final commit if any fixups needed, then done**
