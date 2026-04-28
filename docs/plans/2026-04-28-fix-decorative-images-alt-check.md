# Fix Decorative Images Flagged As Missing Alt Text — Issue #573

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stop the "Image Alt Attributes" SEO check from flagging WCAG-decorative images (`alt=""`, `role="presentation"`, `role="none"`) as failures. Reported externally by Crystal Scott (CPWA) via LinkedIn; tracked in https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/573.

**Architecture:** Two-layer fix in the Cloudflare Worker. (1) The scraper (`webScraper.ts`) currently coerces missing-attribute and empty-string-attribute into one indistinguishable `''`. We preserve the distinction by typing `alt` as `string | undefined` and additionally capturing the `role` attribute. (2) The analyzer (`seoAnalysis.ts`) currently treats both states as failures; we change it to fail only when `alt` is `undefined` or whitespace-only, and to skip images with `role="presentation"` / `role="none"`.

**Tech Stack:** TypeScript, Cheerio, Vitest, Cloudflare Workers (Hono).

---

## Important Context

- Cheerio's `.attr('alt')` returns `undefined` when the attribute is absent and `''` when present-but-empty. The current code does `$(el).attr('alt') || ''`, which destroys this distinction.
- Webflow's Designer asset panel exposes a "Decorative" alt-text option that publishes as `alt=""` — so honoring `alt=""` aligns the audit with Webflow's own intent model.
- The check description currently reads: `"Found N image(s) without alt attributes."` — we'll keep the phrasing minimally invasive but mention decoratives only if any were excluded (see Open Decisions below).
- The AI-recommendation branch (`seoAnalysis.ts:687-705`) is gated on `imagesWithoutAlt` membership — once decoratives are filtered out, no AI suggestions are generated for them automatically.
- The `images` data shape returned to the client is `Array<{src, alt, size?}>`. Adding an optional `role` field (or a derived `isDecorative` flag) is non-breaking.
- Tests live in:
  - `workers/modules/webScraper.test.ts` (extraction)
  - `workers/modules/seoAnalysis.test.ts` (check logic)
- The client (`ImageAltTextList.tsx`) only renders what the worker tells it to render via `imageData`. No client-side change is required for this fix.

## Files Modified

| File | Action |
|------|--------|
| `workers/modules/webScraper.ts` | Stop coercing `alt`; capture `role`; update return type |
| `shared/types/index.ts` (or wherever `images` is typed) | Type `alt: string \| undefined` and add `role?: string` if not already optional |
| `workers/modules/seoAnalysis.ts:665` | Skip decoratives in `imagesWithoutAlt` filter; update description message |
| `workers/modules/webScraper.test.ts` | Add tests for the three alt states + role |
| `workers/modules/seoAnalysis.test.ts` | Add tests covering decorative skip + AI-gen suppression |

---

## Open Decisions (please confirm before execution)

1. **Decorative signals to honor.** Default plan: `alt=""` AND `role="presentation"` AND `role="none"`. Anything else (e.g., `aria-hidden="true"`)? **Default: just the three above.**
2. **Description message when decoratives are excluded.** Default: `"Found N image(s) without alt attributes. M decorative image(s) excluded."` Or stay silent on exclusions? **Default: include the count for transparency.**
3. **Whitespace-only alt (`alt="   "`).** Default: treat as MISSING (current behavior — preserves WCAG correctness). Keep? **Default: yes.**
4. **Should the API response surface a separate `decorativeImageCount` field** (for future UI use), or just keep this internal? **Default: skip — YAGNI.**

---

### Task 1: Update Scraper to Preserve Alt-State Distinction

**Files:**
- Modify: `workers/modules/webScraper.ts:158-172`
- Modify: `workers/modules/webScraper.test.ts` (add new tests)

**Step 1: Write the failing tests**

Add to `webScraper.test.ts` inside the existing `describe` for image extraction (or create one if absent):

```typescript
describe('extractImages — decorative image distinction', () => {
  it('returns alt: undefined when the alt attribute is absent', () => {
    const html = `<html><body><img src="/a.png"></body></html>`;
    const $ = cheerio.load(html);
    const images = extractImages($);
    expect(images[0].alt).toBeUndefined();
  });

  it('returns alt: "" when alt is present-but-empty (decorative)', () => {
    const html = `<html><body><img src="/a.png" alt=""></body></html>`;
    const $ = cheerio.load(html);
    const images = extractImages($);
    expect(images[0].alt).toBe('');
  });

  it('returns alt with the actual content when populated', () => {
    const html = `<html><body><img src="/a.png" alt="A photograph"></body></html>`;
    const $ = cheerio.load(html);
    const images = extractImages($);
    expect(images[0].alt).toBe('A photograph');
  });

  it('captures role="presentation" and role="none"', () => {
    const html = `
      <html><body>
        <img src="/a.png" role="presentation">
        <img src="/b.png" role="none">
        <img src="/c.png">
      </body></html>`;
    const $ = cheerio.load(html);
    const images = extractImages($);
    expect(images[0].role).toBe('presentation');
    expect(images[1].role).toBe('none');
    expect(images[2].role).toBeUndefined();
  });
});
```

**Step 2: Run the tests to verify they FAIL**

Run: `pnpm test:workers -- webScraper`
Expected: FAIL — alt is currently `''` for absent attr; `role` field not extracted.

**Step 3: Update `extractImages` signature and body**

Replace `webScraper.ts:158-172` with:

```typescript
function extractImages($: cheerio.CheerioAPI): Array<{src: string, alt: string | undefined, role?: string, size?: number}> {
  const images: Array<{src: string, alt: string | undefined, role?: string, size?: number}> = [];

  $('img').each((_, element) => {
    const src = $(element).attr('src') || '';
    if (!src) return;
    const alt = $(element).attr('alt'); // string | undefined — preserve missing-vs-empty
    const role = $(element).attr('role');
    images.push({
      src,
      alt,
      ...(role ? { role } : {}),
    });
  });

  return images;
}
```

**Step 4: Update the shared image type**

Find where the `images` field on the scraped-data type lives (likely `shared/types/index.ts` or `workers/modules/webScraper.ts` where `extractImages` return type flows into `ScrapedData`). Update to:

```typescript
images: Array<{ src: string; alt: string | undefined; role?: string; size?: number }>;
```

If the type is currently `alt: string`, this is a breaking type change for downstream consumers — run `pnpm check` after editing to see who else needs updating.

**Step 5: Run tests to verify PASS**

Run: `pnpm test:workers -- webScraper`
Expected: PASS for the four new tests.

**Step 6: Commit**

```bash
git add workers/modules/webScraper.ts workers/modules/webScraper.test.ts shared/types/index.ts
git commit -m "feat(webScraper): preserve missing-vs-empty alt distinction and capture role attribute"
```

---

### Task 2: Skip Decorative Images in the SEO Check

**Files:**
- Modify: `workers/modules/seoAnalysis.ts:657-706`
- Modify: `workers/modules/seoAnalysis.test.ts` (add new tests)

**Step 1: Write the failing tests**

Add to `seoAnalysis.test.ts` inside the suite that covers the `Image Alt Attributes` check (or add a new `describe` block):

```typescript
describe('Image Alt Attributes — decorative image handling (issue #573)', () => {
  it('does NOT flag images with alt="" (explicit decorative)', async () => {
    const scrapedData = makeScrapedData({
      images: [
        { src: '/spacer.png', alt: '' },           // decorative
        { src: '/photo.png', alt: undefined },     // missing → flag
      ],
    });
    const result = await analyzeSEO(scrapedData, /* ... */);
    const check = result.checks.find(c => c.title === 'Image Alt Attributes')!;
    expect(check.passed).toBe(false);
    expect(check.imageData).toHaveLength(1);
    expect(check.imageData![0].url).toBe('/photo.png');
  });

  it('does NOT flag images with role="presentation" or role="none"', async () => {
    const scrapedData = makeScrapedData({
      images: [
        { src: '/divider.png', alt: undefined, role: 'presentation' },
        { src: '/icon.png', alt: undefined, role: 'none' },
        { src: '/hero.png', alt: undefined },
      ],
    });
    const result = await analyzeSEO(scrapedData, /* ... */);
    const check = result.checks.find(c => c.title === 'Image Alt Attributes')!;
    expect(check.imageData).toHaveLength(1);
    expect(check.imageData![0].url).toBe('/hero.png');
  });

  it('passes the check when ALL flaggable images are decorative', async () => {
    const scrapedData = makeScrapedData({
      images: [
        { src: '/a.png', alt: '' },
        { src: '/b.png', alt: undefined, role: 'presentation' },
      ],
    });
    const result = await analyzeSEO(scrapedData, /* ... */);
    const check = result.checks.find(c => c.title === 'Image Alt Attributes')!;
    expect(check.passed).toBe(true);
  });

  it('treats whitespace-only alt as missing', async () => {
    const scrapedData = makeScrapedData({
      images: [{ src: '/a.png', alt: '   ' }],
    });
    const result = await analyzeSEO(scrapedData, /* ... */);
    const check = result.checks.find(c => c.title === 'Image Alt Attributes')!;
    expect(check.passed).toBe(false);
    expect(check.imageData).toHaveLength(1);
  });

  it('mentions the decorative-exclusion count in the description when decoratives exist', async () => {
    const scrapedData = makeScrapedData({
      images: [
        { src: '/a.png', alt: '' },
        { src: '/b.png', alt: '' },
        { src: '/c.png', alt: undefined },
      ],
    });
    const result = await analyzeSEO(scrapedData, /* ... */);
    const check = result.checks.find(c => c.title === 'Image Alt Attributes')!;
    expect(check.description).toMatch(/2 decorative/i);
  });

  it('does NOT generate AI suggestions for decorative images', async () => {
    const aiSpy = vi.spyOn(aiRecommendations, 'getAIRecommendation');
    const scrapedData = makeScrapedData({
      images: [
        { src: '/spacer.png', alt: '' },
        { src: '/photo.png', alt: undefined },
      ],
    });
    await analyzeSEO(scrapedData, /* env with USE_GPT_RECOMMENDATIONS=true */);
    expect(aiSpy).toHaveBeenCalledTimes(1);
    expect(aiSpy).toHaveBeenCalledWith(
      'Image Alt Attributes',
      expect.anything(),
      expect.anything(),
      '/photo.png',
      expect.anything()
    );
  });
});
```

> **Note:** `makeScrapedData` is a test helper. If one doesn't exist, write a tiny inline factory at the top of the new describe block, or use an existing pattern from this same test file.

**Step 2: Run tests to verify they FAIL**

Run: `pnpm test:workers -- seoAnalysis`
Expected: FAIL — current logic flags `alt=""` and ignores `role`.

**Step 3: Implement the fix**

Replace the block at `seoAnalysis.ts:665-673` with:

```typescript
const isDecorative = (img: { alt: string | undefined; role?: string }) =>
  img.alt === '' || img.role === 'presentation' || img.role === 'none';

const flaggableImages = scrapedData.images.filter(img => !isDecorative(img));
const decorativeCount = scrapedData.images.length - flaggableImages.length;

const imagesWithoutAlt = flaggableImages.filter(
  img => img.alt === undefined || img.alt.trim().length === 0
);
imageAltCheck.passed = imagesWithoutAlt.length === 0;

if (imageAltCheck.passed) {
  imageAltCheck.description = getSuccessMessage(imageAltCheck.title);
} else {
  const decorativeNote = decorativeCount > 0
    ? ` ${decorativeCount} decorative image(s) excluded.`
    : '';
  imageAltCheck.description = `Found ${imagesWithoutAlt.length} image(s) without alt attributes.${decorativeNote}`;
}
```

The existing `imageData` mapping (lines 677-684) and AI generation (lines 687-705) keep working unchanged because they iterate over `imagesWithoutAlt`, which now excludes decoratives.

**Step 4: Run tests to verify PASS**

Run: `pnpm test:workers -- seoAnalysis`
Expected: PASS — including the AI-suppression spy test.

**Step 5: Commit**

```bash
git add workers/modules/seoAnalysis.ts workers/modules/seoAnalysis.test.ts
git commit -m "fix(seoAnalysis): exclude decorative images from Image Alt Attributes check (#573)"
```

---

### Task 3: Final Verification

**Step 1: Full type check**

Run: `pnpm check`
Expected: PASS

**Step 2: Full test suite**

Run: `pnpm test`
Expected: PASS — including any client-side tests that consume the `images` shape (none should break, since `alt: string | undefined` is structurally a superset of `alt: string`).

**Step 3: Lint**

Run: `pnpm lint`
Expected: PASS (or only pre-existing warnings).

**Step 4: Manual sanity check (optional but recommended)**

Build a fixture HTML page with one of each: missing-alt, `alt=""`, `role="presentation"`, real alt. Point the dev worker at it and verify the analyze response classifies each correctly.

```bash
pnpm dev
# In another terminal, hit http://localhost:8787/api/analyze with a test URL
```

**Step 5: Open PR**

```bash
git push -u origin fix/issue-573-decorative-images-alt-text
gh pr create --title "fix: stop flagging decorative images as missing alt text (#573)" --body "..."
```

PR body should include:
- Link to issue #573
- Summary of the two-layer fix (scraper preserves distinction; analyzer skips decoratives)
- Testing notes (new test cases listed)
- Mention that the AI alt-text generation cascade naturally suppresses for decoratives via the upstream filter
