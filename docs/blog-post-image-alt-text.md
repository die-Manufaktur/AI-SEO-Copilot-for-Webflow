# Why Webflow's Designer API Makes Image Alt Text Harder Than You'd Expect

**Category:** Web Development
**Author:** Paul Mulligan
**Meta description:** The Webflow Designer API doesn't let you access every image on the page. Here's how I built a 4-strategy fallback system to match and update image alt text from a browser extension.

---

I'm building an SEO analysis extension for Webflow. One of its features is straightforward on paper: scan a page for images missing alt text, generate suggestions with AI, and let the user apply them with one click. The scanning part worked fine. The AI suggestions worked fine. The "apply with one click" part nearly broke me.

The problem is that the Webflow Designer API — the interface extensions use to modify page elements — doesn't see images the same way a browser does. An HTML scraper will find every `<img>` tag on the rendered page. The Designer API only returns top-level design elements. If an image is nested inside a Link block, a ComponentInstance, or an HtmlEmbed, the API either can't find it or can't write to it. Your scraper says there are twelve images on the page. The API can reach seven of them. Good luck figuring out which seven.

## The matching problem

When my extension scrapes a published Webflow page, it gets a list of images with their `src` URLs and current `alt` attributes. Standard stuff. But when it queries the Designer API to find those same images, it gets back a flat list of design elements — and Image elements don't expose their source URL as a simple property. Instead, you call `getAsset()` on an Image element, and the API returns an asset object.

Here's where it gets interesting. Sometimes that asset object contains `id`, `url`, and `name`. Sometimes it contains just `id`. No URL. No filename. Just an opaque identifier like `67a1b3c9d4e5f6`. Whether you get the full object or the sparse one seems to depend on factors I haven't fully pinned down — possibly the Webflow plan, possibly whether the asset was uploaded directly or pulled from an external source, possibly the phase of the moon.

So I can't just compare URLs. I needed a fallback system.

## Four strategies, one match

The solution I landed on is a 4-strategy cascade. The extension tries each approach in order and stops at the first successful match.

**Strategy 1: Direct asset URL comparison.** Call `getAsset()` on the Image element. If the returned object has a URL, extract the filename and compare it to the filename from the scraped image URL. This handles the happy path where the API cooperates fully.

**Strategy 2: Read the src attribute directly.** If `getAsset()` doesn't return a URL, fall back to `getAttribute('src')` on the element. This catches some edge cases with older Webflow configurations or non-standard element types.

**Strategy 3: Asset ID in CDN URL.** This is the one I'm most proud of. Webflow hosts assets on a CDN with a predictable URL pattern: `https://cdn.prod.website-files.com/{siteId}/{assetId}_{filename}.{ext}`. When `getAsset()` returns only an `id`, I check whether that ID string appears anywhere in the scraped image's CDN URL. If the scraper found an image at `cdn.prod.website-files.com/abc123/67a1b3c9d4e5f6_hero.jpg` and the API gives me an asset with id `67a1b3c9d4e5f6`, that's a match. It feels like a hack, but it's surprisingly reliable.

**Strategy 4: Recursive child traversal.** Many images aren't top-level elements at all. They're nested inside Link blocks, Div blocks, or other containers. For each non-Image element, the extension calls `getChildren()` and searches up to three levels deep for Image elements inside. When it finds one, it runs strategies 1-3 on that nested image.

Each strategy logs what it tried and why it succeeded or failed. When something goes wrong in production, those logs are the only way to diagnose what the API returned versus what was expected.

## The images you can't touch

Even with four matching strategies, some images remain out of reach. If an image lives inside a ComponentInstance (a reusable Webflow component), the Designer API won't let you modify it from outside the component. Same for images embedded inside an HtmlEmbed element — they exist in the rendered HTML, but the Designer API treats the entire embed as an opaque block.

The scraper sees these images. It reports them as missing alt text. The AI generates perfectly good suggestions for them. But the extension physically cannot apply those suggestions through the API.

I had two options: hide these images from the results entirely, or show them with the Apply button disabled. I went with disabled. The user still sees the AI-generated alt text and can copy it manually. A tooltip explains why the button is grayed out: "Image type not available through API." It's not ideal, but pretending those images don't exist felt worse.

## Figuring out which images are applyable

The applyability check runs as a separate step before the results are displayed. The extension queries all top-level elements from the Designer API, filters to just Image types, and collects their asset IDs into a set. Then for each scraped image, it checks whether any of those asset IDs appear in the image's URL.

If the check fails entirely — maybe the Designer API timed out or returned unexpected data — the extension defaults to enabling all Apply buttons rather than disabling all of them. I'd rather have a button fail on click with a clear error than preemptively gray out buttons that might actually work. The user can always try again.

```typescript
try {
  const assetIds = await api.getApplyableImageAssetIds();
  for (const img of imageCheck.imageData) {
    for (const assetId of assetIds) {
      if (img.url.includes(assetId)) {
        applyable.add(img.url);
        break;
      }
    }
  }
} catch {
  // On failure, don't restrict — leave all enabled
}
```

## The runtime timing problem

There's one more wrinkle that has nothing to do with image matching. The Webflow Designer API isn't available when the extension's React app first renders. The `window.webflow` object gets injected at runtime by the Designer host, and it often isn't there yet when React's initial useEffect fires.

If you initialize the API in a useEffect and it's not ready, your extension silently does nothing. No error, no retry, just a dead Apply button that looks like it should work. The fix is lazy initialization: when the extension needs the API for the first time, it checks whether `window.webflow` exists and initializes the client on the spot. If it still doesn't exist, it retries on a short interval. The wrapper component that handles this uses polling rather than a single-shot check, because the timing gap between React's mount and Webflow's injection is unpredictable.

## The AI generation layer

On the backend, each image missing alt text gets a targeted AI prompt that includes the image URL and the page context. The generation happens per-image, not as a batch, because different images on the same page need very different descriptions. A hero banner and a team headshot shouldn't get the same style of alt text.

On the frontend, each image row tracks its own loading, success, and error state independently. If one image's generation fails, the others keep working. Users can also edit the suggested alt text inline before applying — the component tracks whether the user has modified the text, and won't overwrite their edits if an async regeneration response comes back late. That coordination between user edits and async AI responses was one of the trickier state management problems in the whole feature.

## What I'd do differently

If I were starting over, I'd push harder on getting Webflow to expose asset URLs consistently from `getAsset()`. The CDN URL pattern matching works, but it's fragile — if Webflow changes their CDN URL structure, strategy 3 breaks. I'd also explore whether the Designer API has any plans to support writing to elements inside ComponentInstances. That's the single biggest gap in the current implementation.

For now, the 4-strategy cascade handles real-world Webflow sites well enough that most users don't notice the complexity underneath. They click "Apply," the alt text appears on their image, and their SEO score improves. The messy middle is invisible, which is probably the best compliment you can give infrastructure code.

## Alt text matters more than most people think

Missing alt text is one of the most common SEO issues I see on Webflow sites. It affects accessibility, it affects image search rankings, and it's the kind of thing that accumulates — you add images during a redesign, forget the alt tags, and six months later you have forty images with no descriptions. Having an extension that catches these gaps and offers one-click fixes makes it realistic to actually maintain good alt text across a whole site, not just the pages you remember to check.

If you're building a Webflow extension that needs to modify page elements, my main advice is: don't trust that the Designer API will give you a clean path to every element on the page. Build fallbacks. Log everything. And give your users honest feedback when something can't be done automatically — they'd rather know than wonder why the button didn't work.
