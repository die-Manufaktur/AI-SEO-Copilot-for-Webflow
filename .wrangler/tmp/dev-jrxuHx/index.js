"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // .wrangler/tmp/bundle-2EukRC/checked-fetch.js
  var urls = /* @__PURE__ */ new Set();
  function checkURL(request, init) {
    const url = request instanceof URL ? request : new URL(
      (typeof request === "string" ? new Request(request, init) : request).url
    );
    if (url.port && url.port !== "443" && url.protocol === "https:") {
      if (!urls.has(url.toString())) {
        urls.add(url.toString());
        console.warn(
          `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
        );
      }
    }
  }
  __name(checkURL, "checkURL");
  globalThis.fetch = new Proxy(globalThis.fetch, {
    apply(target, thisArg, argArray) {
      const [request, init] = argArray;
      checkURL(request, init);
      return Reflect.apply(target, thisArg, argArray);
    }
  });

  // ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
  var __facade_middleware__ = [];
  function __facade_register__(...args) {
    __facade_middleware__.push(...args.flat());
  }
  __name(__facade_register__, "__facade_register__");
  function __facade_registerInternal__(...args) {
    __facade_middleware__.unshift(...args.flat());
  }
  __name(__facade_registerInternal__, "__facade_registerInternal__");
  function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
    const [head, ...tail] = middlewareChain;
    const middlewareCtx = {
      dispatch,
      next(newRequest, newEnv) {
        return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
      }
    };
    return head(request, env, ctx, middlewareCtx);
  }
  __name(__facade_invokeChain__, "__facade_invokeChain__");
  function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
    return __facade_invokeChain__(request, env, ctx, dispatch, [
      ...__facade_middleware__,
      finalMiddleware
    ]);
  }
  __name(__facade_invoke__, "__facade_invoke__");

  // ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/loader-sw.ts
  var __FACADE_EVENT_TARGET__;
  if (globalThis.MINIFLARE) {
    __FACADE_EVENT_TARGET__ = new (Object.getPrototypeOf(WorkerGlobalScope))();
  } else {
    __FACADE_EVENT_TARGET__ = new EventTarget();
  }
  function __facade_isSpecialEvent__(type) {
    return type === "fetch" || type === "scheduled";
  }
  __name(__facade_isSpecialEvent__, "__facade_isSpecialEvent__");
  var __facade__originalAddEventListener__ = globalThis.addEventListener;
  var __facade__originalRemoveEventListener__ = globalThis.removeEventListener;
  var __facade__originalDispatchEvent__ = globalThis.dispatchEvent;
  globalThis.addEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.addEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalAddEventListener__(type, listener, options);
    }
  };
  globalThis.removeEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.removeEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalRemoveEventListener__(type, listener, options);
    }
  };
  globalThis.dispatchEvent = function(event) {
    if (__facade_isSpecialEvent__(event.type)) {
      return __FACADE_EVENT_TARGET__.dispatchEvent(event);
    } else {
      return __facade__originalDispatchEvent__(event);
    }
  };
  globalThis.addMiddleware = __facade_register__;
  globalThis.addMiddlewareInternal = __facade_registerInternal__;
  var __facade_waitUntil__ = Symbol("__facade_waitUntil__");
  var __facade_response__ = Symbol("__facade_response__");
  var __facade_dispatched__ = Symbol("__facade_dispatched__");
  var __Facade_ExtendableEvent__ = class ___Facade_ExtendableEvent__ extends Event {
    static {
      __name(this, "__Facade_ExtendableEvent__");
    }
    [__facade_waitUntil__] = [];
    waitUntil(promise) {
      if (!(this instanceof ___Facade_ExtendableEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this[__facade_waitUntil__].push(promise);
    }
  };
  var __Facade_FetchEvent__ = class ___Facade_FetchEvent__ extends __Facade_ExtendableEvent__ {
    static {
      __name(this, "__Facade_FetchEvent__");
    }
    #request;
    #passThroughOnException;
    [__facade_response__];
    [__facade_dispatched__] = false;
    constructor(type, init) {
      super(type);
      this.#request = init.request;
      this.#passThroughOnException = init.passThroughOnException;
    }
    get request() {
      return this.#request;
    }
    respondWith(response) {
      if (!(this instanceof ___Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      if (this[__facade_response__] !== void 0) {
        throw new DOMException(
          "FetchEvent.respondWith() has already been called; it can only be called once.",
          "InvalidStateError"
        );
      }
      if (this[__facade_dispatched__]) {
        throw new DOMException(
          "Too late to call FetchEvent.respondWith(). It must be called synchronously in the event handler.",
          "InvalidStateError"
        );
      }
      this.stopImmediatePropagation();
      this[__facade_response__] = response;
    }
    passThroughOnException() {
      if (!(this instanceof ___Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#passThroughOnException();
    }
  };
  var __Facade_ScheduledEvent__ = class ___Facade_ScheduledEvent__ extends __Facade_ExtendableEvent__ {
    static {
      __name(this, "__Facade_ScheduledEvent__");
    }
    #scheduledTime;
    #cron;
    #noRetry;
    constructor(type, init) {
      super(type);
      this.#scheduledTime = init.scheduledTime;
      this.#cron = init.cron;
      this.#noRetry = init.noRetry;
    }
    get scheduledTime() {
      return this.#scheduledTime;
    }
    get cron() {
      return this.#cron;
    }
    noRetry() {
      if (!(this instanceof ___Facade_ScheduledEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#noRetry();
    }
  };
  __facade__originalAddEventListener__("fetch", (event) => {
    const ctx = {
      waitUntil: event.waitUntil.bind(event),
      passThroughOnException: event.passThroughOnException.bind(event)
    };
    const __facade_sw_dispatch__ = /* @__PURE__ */ __name(function(type, init) {
      if (type === "scheduled") {
        const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
          scheduledTime: Date.now(),
          cron: init.cron ?? "",
          noRetry() {
          }
        });
        __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
        event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      }
    }, "__facade_sw_dispatch__");
    const __facade_sw_fetch__ = /* @__PURE__ */ __name(function(request, _env, ctx2) {
      const facadeEvent = new __Facade_FetchEvent__("fetch", {
        request,
        passThroughOnException: ctx2.passThroughOnException
      });
      __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
      facadeEvent[__facade_dispatched__] = true;
      event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      const response = facadeEvent[__facade_response__];
      if (response === void 0) {
        throw new Error("No response!");
      }
      return response;
    }, "__facade_sw_fetch__");
    event.respondWith(
      __facade_invoke__(
        event.request,
        globalThis,
        ctx,
        __facade_sw_dispatch__,
        __facade_sw_fetch__
      )
    );
  });
  __facade__originalAddEventListener__("scheduled", (event) => {
    const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
      scheduledTime: event.scheduledTime,
      cron: event.cron,
      noRetry: event.noRetry.bind(event)
    });
    __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
    event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
  });

  // ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
  var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } finally {
      try {
        if (request.body !== null && !request.bodyUsed) {
          const reader = request.body.getReader();
          while (!(await reader.read()).done) {
          }
        }
      } catch (e) {
        console.error("Failed to drain the unused request body.", e);
      }
    }
  }, "drainBody");
  var middleware_ensure_req_body_drained_default = drainBody;

  // ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
  function reduceError(e) {
    return {
      name: e?.name,
      message: e?.message ?? String(e),
      stack: e?.stack,
      cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
    };
  }
  __name(reduceError, "reduceError");
  var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } catch (e) {
      const error = reduceError(e);
      return Response.json(error, {
        status: 500,
        headers: { "MF-Experimental-Error-Stack": "true" }
      });
    }
  }, "jsonError");
  var middleware_miniflare3_json_error_default = jsonError;

  // .wrangler/tmp/bundle-2EukRC/middleware-insertion-facade.js
  __facade_registerInternal__([middleware_ensure_req_body_drained_default, middleware_miniflare3_json_error_default]);

  // workers/index.ts
  var allowedOrigins = [
    "https://webflow.com",
    "https://*.webflow-ext.com",
    "https://*.webflow.io",
    "http://localhost:1337",
    // For local development
    "http://localhost:5173"
    // For Vite development server
  ];
  var createDomainPattern = /* @__PURE__ */ __name((domain) => {
    if (domain.includes("*")) {
      return new RegExp("^" + domain.replace("*.", "([a-zA-Z0-9-]+\\.)?") + "$");
    }
    return new RegExp("^" + domain + "$");
  }, "createDomainPattern");
  var originPatterns = allowedOrigins.map(createDomainPattern);
  var isAllowedOrigin = /* @__PURE__ */ __name((origin) => {
    if (!origin) return false;
    return originPatterns.some((pattern) => pattern.test(origin));
  }, "isAllowedOrigin");
  var handleCors = /* @__PURE__ */ __name((request) => {
    const origin = request.headers.get("Origin");
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    return null;
  }, "handleCors");
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  __name(escapeRegExp, "escapeRegExp");
  function calculateKeyphraseDensity(content, keyphrase) {
    const normalizedContent = content.toLowerCase().trim();
    const normalizedKeyphrase = keyphrase.toLowerCase().trim();
    const escapedKeyphrase = escapeRegExp(normalizedKeyphrase);
    const totalWords = normalizedContent.split(/\s+/).filter((word) => word.length > 0).length;
    const regex = new RegExp(`\\b${escapedKeyphrase}\\b`, "gi");
    const matches = normalizedContent.match(regex) || [];
    const occurrences = matches.length;
    const density = occurrences * normalizedKeyphrase.split(/\s+/).length / totalWords * 100;
    return { density, occurrences, totalWords };
  }
  __name(calculateKeyphraseDensity, "calculateKeyphraseDensity");
  function isHomePage(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname === "/" || urlObj.pathname === "";
    } catch {
      return false;
    }
  }
  __name(isHomePage, "isHomePage");
  var checkPriorities = {
    "Keyphrase in Title": "high",
    "Keyphrase in Meta Description": "high",
    "Keyphrase in URL": "medium",
    "Content Length on page": "high",
    // Updated name
    "Keyphrase Density": "medium",
    "Keyphrase in Introduction": "medium",
    "Keyphrase in H1 Heading": "high",
    "Keyphrase in H2 Headings": "medium",
    "Heading Hierarchy": "high",
    "Image Alt Attributes": "low",
    "Internal Links": "medium",
    "Outbound Links": "low",
    "Next-Gen Image Formats": "low",
    "OpenGraph Image": "medium",
    // Updated to OpenGraph instead of OG
    "Open Graph Title and Description": "medium",
    // Updated to match Home.tsx
    "Code Minification": "low",
    "Schema Markup": "medium",
    "Image File Size": "medium"
  };
  function getSuccessMessage(checkType, url) {
    const messages = {
      "Keyphrase in Title": "Great job! Your title includes the target keyphrase.",
      "Keyphrase in Meta Description": "Perfect! Your meta description effectively uses the keyphrase.",
      "Keyphrase in URL": isHomePage(url) ? "All good here, since it's the homepage! \u2728" : "Excellent! Your URL is SEO-friendly with the keyphrase.",
      "Content Length on page": "Well done! Your content length is good for SEO.",
      "Keyphrase Density": "Perfect! Your keyphrase density is within the optimal range.",
      "Keyphrase in Introduction": "Excellent! You've included the keyphrase in your introduction.",
      "Image Alt Attributes": "Well done! Your images are properly optimized with the keyphrase.",
      "Internal Links": "Perfect! You have a good number of internal links.",
      "Outbound Links": "Excellent! You've included relevant outbound links.",
      "Next-Gen Image Formats": "Excellent! Your images use modern, optimized formats.",
      "OpenGraph Image": "Great job! Your page has a properly configured OpenGraph image.",
      "Open Graph Title and Description": "Perfect! Open Graph title and description are well configured.",
      "Keyphrase in H1 Heading": "Excellent! Your main H1 heading effectively includes the keyphrase.",
      "Keyphrase in H2 Headings": "Great job! Your H2 subheadings include the keyphrase, reinforcing your topic focus.",
      "Heading Hierarchy": "Great job! Your page has a proper heading tag hierarchy.",
      "Code Minification": "Excellent! Your JavaScript and CSS files are properly minified for better performance.",
      "Schema Markup": "Great job! Your page has schema markup implemented, making it easier for search engines to understand your content.",
      "Image File Size": "Great job! All your images are well-optimized, keeping your page loading times fast."
    };
    return messages[checkType] || "Good job!";
  }
  __name(getSuccessMessage, "getSuccessMessage");
  var fallbackRecommendations = {
    "Keyphrase in Title": /* @__PURE__ */ __name((keyphrase, title) => `Consider rewriting your title to include '${keyphrase}', preferably at the beginning. Here is a better title: "${keyphrase} - ${title}"`, "Keyphrase in Title"),
    "Keyphrase in Meta Description": /* @__PURE__ */ __name((keyphrase, metaDescription) => `Add '${keyphrase}' to your meta description in a natural way that encourages clicks. Here is a better meta description: "${metaDescription ? metaDescription.substring(0, 50) : "Learn about"} ${keyphrase} ${metaDescription ? metaDescription.substring(50, 100) : "and discover how it can help you"}."`, "Keyphrase in Meta Description"),
    "Keyphrase in Introduction": /* @__PURE__ */ __name((keyphrase) => `Mention '${keyphrase}' in your first paragraph to establish relevance early.`, "Keyphrase in Introduction"),
    "Image Alt Attributes": /* @__PURE__ */ __name((keyphrase) => `Add descriptive alt text containing '${keyphrase}' to at least one relevant image.`, "Image Alt Attributes"),
    "Internal Links": /* @__PURE__ */ __name(() => `Add links to other relevant pages on your site to improve navigation and SEO.`, "Internal Links"),
    "Outbound Links": /* @__PURE__ */ __name(() => `Link to reputable external sources to increase your content's credibility.`, "Outbound Links")
  };
  async function scrapeWebpage(url) {
    console.log(`Scraping webpage: ${url}`);
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";
      const metaDescriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
      const metaDescription = metaDescriptionMatch ? metaDescriptionMatch[1].trim() : "";
      const ogMetadata = {
        title: "",
        description: "",
        image: "",
        imageWidth: "",
        imageHeight: ""
      };
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
      if (ogTitleMatch) ogMetadata.title = ogTitleMatch[1].trim();
      const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
      if (ogDescMatch) ogMetadata.description = ogDescMatch[1].trim();
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
      if (ogImageMatch) ogMetadata.image = ogImageMatch[1].trim();
      const ogImageWidthMatch = html.match(/<meta\s+property=["']og:image:width["']\s+content=["'](.*?)["']/i);
      if (ogImageWidthMatch) ogMetadata.imageWidth = ogImageWidthMatch[1].trim();
      const ogImageHeightMatch = html.match(/<meta\s+property=["']og:image:height["']\s+content=["'](.*?)["']/i);
      if (ogImageHeightMatch) ogMetadata.imageHeight = ogImageHeightMatch[1].trim();
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : "";
      const content = bodyContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const paragraphs = [];
      const paragraphMatches = bodyContent.matchAll(/<p[^>]*>(.*?)<\/p>/gi);
      for (const match of paragraphMatches) {
        const text = match[1].replace(/<[^>]+>/g, " ").trim();
        if (text) paragraphs.push(text);
      }
      const headings = [];
      for (let i = 1; i <= 6; i++) {
        const headingMatches = bodyContent.matchAll(new RegExp(`<h${i}[^>]*>(.*?)</h${i}>`, "gi"));
        for (const match of headingMatches) {
          const text = match[1].replace(/<[^>]+>/g, " ").trim();
          if (text) headings.push({ level: i, text });
        }
      }
      const images = [];
      const imageMatches = bodyContent.matchAll(/<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi);
      for (const match of imageMatches) {
        images.push({ src: match[1], alt: match[2] });
      }
      const baseUrl = new URL(url);
      const internalLinks = [];
      const outboundLinks = [];
      const linkMatches = bodyContent.matchAll(/<a[^>]*href=["'](.*?)["'][^>]*>/gi);
      for (const match of linkMatches) {
        try {
          const href = match[1];
          if (href.startsWith("#") || href.startsWith("javascript:")) continue;
          const linkUrl = new URL(href, baseUrl.origin);
          if (linkUrl.hostname === baseUrl.hostname) {
            internalLinks.push(href);
          } else {
            outboundLinks.push(href);
          }
        } catch (e) {
        }
      }
      const resources = {
        js: [],
        css: []
      };
      const scriptMatches = bodyContent.matchAll(/<script[^>]*src=["'](.*?)["'][^>]*>/gi);
      for (const match of Array.from(scriptMatches)) {
        const scriptUrl = match[1];
        if (scriptUrl) {
          try {
            let absoluteUrl = scriptUrl;
            if (scriptUrl.startsWith("//")) {
              absoluteUrl = `https:${scriptUrl}`;
            } else if (scriptUrl.startsWith("/")) {
              absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${scriptUrl}`;
            } else if (!scriptUrl.startsWith("http")) {
              absoluteUrl = new URL(scriptUrl, url).toString();
            }
            resources.js.push({
              url: absoluteUrl,
              minified: scriptUrl.includes(".min.js") || scriptUrl.includes("-min.js")
            });
          } catch (e) {
            console.log(`Error processing script URL: ${scriptUrl}`, e);
          }
        }
      }
      const inlineScriptMatches = bodyContent.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      for (const match of Array.from(inlineScriptMatches)) {
        const scriptContent = match[1]?.trim();
        if (scriptContent && scriptContent.length > 0) {
          const isMinified = !scriptContent.includes("\n") && !/\s{2,}/.test(scriptContent) && scriptContent.length > 50;
          resources.js.push({
            url: "inline-script",
            minified: isMinified
          });
        }
      }
      const cssMatches = bodyContent.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'](.*?)["'][^>]*>/gi);
      for (const match of Array.from(cssMatches)) {
        const cssUrl = match[1];
        if (cssUrl) {
          try {
            let absoluteUrl = cssUrl;
            if (cssUrl.startsWith("//")) {
              absoluteUrl = `https:${cssUrl}`;
            } else if (cssUrl.startsWith("/")) {
              absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${cssUrl}`;
            } else if (!cssUrl.startsWith("http")) {
              absoluteUrl = new URL(cssUrl, url).toString();
            }
            resources.css.push({
              url: absoluteUrl,
              minified: cssUrl.includes(".min.css") || cssUrl.includes("-min.css")
            });
          } catch (e) {
            console.log(`Error processing CSS URL: ${cssUrl}`, e);
          }
        }
      }
      const inlineStyleMatches = bodyContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      for (const match of Array.from(inlineStyleMatches)) {
        const styleContent = match[1]?.trim();
        if (styleContent && styleContent.length > 0) {
          const isMinified = !styleContent.includes("\n") && !/\s{2,}/.test(styleContent) && styleContent.length > 50;
          resources.css.push({
            url: "inline-style",
            minified: isMinified
          });
        }
      }
      const schema = {
        detected: false,
        types: []
      };
      const schemaJsonMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (schemaJsonMatch) {
        schema.detected = true;
        try {
          const jsonData = JSON.parse(schemaJsonMatch[1]);
          if (jsonData["@type"]) {
            schema.types.push(jsonData["@type"]);
          } else if (Array.isArray(jsonData) && jsonData[0] && jsonData[0]["@type"]) {
            schema.types = jsonData.map((item) => item["@type"]).filter(Boolean);
          }
        } catch (e) {
          console.log("Error parsing schema JSON:", e);
        }
      }
      return {
        title,
        metaDescription,
        content,
        paragraphs,
        headings,
        images,
        internalLinks,
        outboundLinks,
        url,
        ogMetadata,
        resources,
        schema
      };
    } catch (error) {
      console.error(`Error scraping webpage: ${error.message}`);
      throw new Error(`Failed to scrape webpage: ${error.message}`);
    }
  }
  __name(scrapeWebpage, "scrapeWebpage");
  async function analyzeSEO(url, keyphrase) {
    console.log(`Analyzing SEO for URL: ${url}, keyphrase: ${keyphrase}`);
    try {
      const scrapedData = await scrapeWebpage(url);
      const checks = [];
      let passedChecks = 0;
      let failedChecks = 0;
      const addCheck = /* @__PURE__ */ __name((title, description, passed, recommendation = "") => {
        let finalDescription = passed ? getSuccessMessage(title, url) : description;
        let finalRecommendation = "";
        if (!passed) {
          switch (title) {
            case "Keyphrase in Title":
              finalRecommendation = fallbackRecommendations[title](keyphrase, scrapedData.title);
              break;
            case "Keyphrase in Meta Description":
              finalRecommendation = fallbackRecommendations[title](keyphrase, scrapedData.metaDescription);
              break;
            default:
              finalRecommendation = fallbackRecommendations[title] ? fallbackRecommendations[title](keyphrase) : `Consider optimizing your content for the keyphrase "${keyphrase}" in relation to ${title.toLowerCase()}.`;
          }
        }
        if (passed) {
          passedChecks++;
        } else {
          failedChecks++;
        }
        const priority = checkPriorities[title] || "medium";
        checks.push({ title, description: finalDescription, passed, recommendation: finalRecommendation, priority });
      }, "addCheck");
      addCheck(
        "Keyphrase in Title",
        "The focus keyphrase should appear in the page title",
        scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase())
      );
      addCheck(
        "Keyphrase in Meta Description",
        "The meta description should contain the focus keyphrase",
        Boolean(scrapedData.metaDescription && scrapedData.metaDescription.toLowerCase().includes(keyphrase.toLowerCase()))
      );
      const isHome = isHomePage(url);
      addCheck(
        "Keyphrase in URL",
        isHome ? "This is the homepage URL, so the keyphrase is not required in the URL \u2728" : "The URL should contain the focus keyphrase",
        isHome || url.toLowerCase().includes(keyphrase.toLowerCase())
      );
      const minWordCount = 300;
      const wordCount = scrapedData.content.split(/\s+/).length;
      addCheck(
        "Content Length on page",
        // Updated name to match Home.tsx
        `Your content has ${wordCount} words. For good SEO, aim for at least ${minWordCount} words to provide comprehensive coverage of your topic.`,
        wordCount >= minWordCount
      );
      const densityResult = calculateKeyphraseDensity(scrapedData.content, keyphrase);
      addCheck(
        "Keyphrase Density",
        `Keyphrase density should be between 0.5% and 2.5%. Current density: ${densityResult.density.toFixed(1)}% (${densityResult.occurrences} occurrences in ${densityResult.totalWords} words)`,
        densityResult.density >= 0.5 && densityResult.density <= 2.5
      );
      const firstParagraph = scrapedData.paragraphs[0] || "";
      addCheck(
        "Keyphrase in Introduction",
        "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
        firstParagraph.toLowerCase().includes(keyphrase.toLowerCase())
      );
      const altTextsWithKeyphrase = scrapedData.images.some((img) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase()));
      addCheck(
        "Image Alt Attributes",
        "At least one image should have an alt attribute containing the focus keyphrase",
        altTextsWithKeyphrase
      );
      const hasInternalLinks = scrapedData.internalLinks.length > 0;
      addCheck(
        "Internal Links",
        "The page should contain internal links to other pages",
        hasInternalLinks
      );
      const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
      addCheck(
        "Outbound Links",
        "The page should contain outbound links to authoritative sources",
        hasOutboundLinks
      );
      const h1Tags = scrapedData.headings.filter((heading) => heading.level === 1);
      let h1HasKeyphrase = h1Tags.some(
        (heading) => heading.text.toLowerCase().includes(keyphrase.toLowerCase())
      );
      if (!h1HasKeyphrase && h1Tags.length > 0) {
        const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
        if (keyphraseWords.length > 0) {
          const allWordsFoundInAnyH1 = h1Tags.some((heading) => {
            const headingText = heading.text.toLowerCase();
            return keyphraseWords.every((word) => headingText.includes(word));
          });
          h1HasKeyphrase = allWordsFoundInAnyH1;
        }
      }
      addCheck(
        "Keyphrase in H1 Heading",
        h1Tags.length === 0 ? "Your page is missing an H1 heading. Add an H1 heading that includes your keyphrase." : h1Tags.length > 1 ? "You have multiple H1 headings. Best practice is to have a single H1 heading that includes your keyphrase." : "Your H1 heading should include your target keyphrase for optimal SEO.",
        h1HasKeyphrase && h1Tags.length === 1
      );
      const h2Tags = scrapedData.headings.filter((heading) => heading.level === 2);
      let h2HasKeyphrase = h2Tags.some(
        (heading) => heading.text.toLowerCase().includes(keyphrase.toLowerCase())
      );
      if (!h2HasKeyphrase && h2Tags.length > 0) {
        const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
        if (keyphraseWords.length > 0) {
          const allWordsFoundInAnyH2 = h2Tags.some((heading) => {
            const headingText = heading.text.toLowerCase();
            return keyphraseWords.every((word) => headingText.includes(word));
          });
          h2HasKeyphrase = allWordsFoundInAnyH2;
        }
      }
      addCheck(
        "Keyphrase in H2 Headings",
        h2Tags.length === 0 ? "Your page doesn't have any H2 headings. Add H2 subheadings that include your keyphrase to structure your content." : "Your H2 headings should include your target keyphrase at least once to reinforce your topic focus.",
        h2HasKeyphrase && h2Tags.length > 0
      );
      const hasH1 = h1Tags.length > 0;
      const hasH2 = h2Tags.length > 0;
      const hasProperHeadingStructure = hasH1 && hasH2 && h1Tags.length === 1;
      let hasProperLevelOrder = true;
      const allHeadings = [...scrapedData.headings].sort((a, b) => {
        return scrapedData.headings.indexOf(a) - scrapedData.headings.indexOf(b);
      });
      let prevLevel = 0;
      for (const heading of allHeadings) {
        if (heading.level > prevLevel + 1 && prevLevel > 0) {
          hasProperLevelOrder = false;
          break;
        }
        prevLevel = heading.level;
      }
      const hasProperHeadingHierarchy = hasProperHeadingStructure && hasProperLevelOrder;
      addCheck(
        "Heading Hierarchy",
        hasProperHeadingHierarchy ? "Your page has a proper heading structure with a single H1 followed by appropriate subheadings." : !hasH1 ? "Your page is missing an H1 heading, which is crucial for SEO and document structure." : h1Tags.length > 1 ? "Your page has multiple H1 headings. Best practice is to have a single H1 heading per page." : !hasH2 ? "Your page is missing H2 headings. Use H2 headings to structure your content under the main H1 heading." : !hasProperLevelOrder ? "Your heading structure skips levels (e.g., H1 followed directly by H3). This can confuse search engines and assistive technologies." : "Your heading structure needs improvement. Follow a logical hierarchy (H1 \u2192 H2 \u2192 H3) for better SEO.",
        hasProperHeadingHierarchy
      );
      const hasOGTitle = Boolean(scrapedData.ogMetadata.title);
      const hasOGDescription = Boolean(scrapedData.ogMetadata.description);
      const ogTitleLength = hasOGTitle ? scrapedData.ogMetadata.title.length : 0;
      const ogDescLength = hasOGDescription ? scrapedData.ogMetadata.description.length : 0;
      const validOGMeta = hasOGTitle && hasOGDescription && ogTitleLength >= 10 && ogTitleLength <= 70 && ogDescLength >= 100 && ogDescLength <= 200;
      addCheck(
        "Open Graph Title and Description",
        validOGMeta ? "Open Graph title and description are properly set with optimal lengths" : "Open Graph title and/or description need optimization",
        validOGMeta
      );
      const hasOGImage = Boolean(scrapedData.ogMetadata.image);
      const validOGImageSize = Boolean(
        scrapedData.ogMetadata.imageWidth && scrapedData.ogMetadata.imageHeight && parseInt(scrapedData.ogMetadata.imageWidth) >= 1200 && parseInt(scrapedData.ogMetadata.imageHeight) >= 630
      );
      addCheck(
        "OpenGraph Image",
        hasOGImage ? validOGImageSize ? `Open Graph image is present with recommended dimensions (1200x630 or larger).` : `Open Graph image is present but may not have the optimal dimensions.` : "Open Graph image is missing. Add an OG image with dimensions of at least 1200x630px.",
        hasOGImage
      );
      const hasSchemaMarkup = scrapedData.schema.detected;
      addCheck(
        "Schema Markup",
        hasSchemaMarkup ? `Your page has schema markup implemented (${scrapedData.schema.types.join(", ") || "Unknown type"})` : "Your page is missing schema markup (structured data)",
        hasSchemaMarkup
      );
      const jsResources = scrapedData.resources.js;
      const cssResources = scrapedData.resources.css;
      const totalJsResources = jsResources.length;
      const totalCssResources = cssResources.length;
      const minifiedJsCount = jsResources.filter((r) => r.minified).length;
      const minifiedCssCount = cssResources.filter((r) => r.minified).length;
      const totalResources = totalJsResources + totalCssResources;
      const minifiedResources = minifiedJsCount + minifiedCssCount;
      const minificationPercentage = totalResources > 0 ? Math.round(minifiedResources / totalResources * 100) : 100;
      const nonMinifiedJs = jsResources.filter((r) => !r.minified && r.url !== "inline-script").map((r) => r.url);
      const nonMinifiedCss = cssResources.filter((r) => !r.minified && r.url !== "inline-style").map((r) => r.url);
      const hasNonMinified = nonMinifiedJs.length > 0 || nonMinifiedCss.length > 0;
      const hasInlineNonMinified = jsResources.some((r) => r.url === "inline-script" && !r.minified) || cssResources.some((r) => r.url === "inline-style" && !r.minified);
      let minificationRecommendation = "";
      if (totalResources === 0) {
        minificationRecommendation = "No JavaScript or CSS resources found on the page.";
      } else {
        minificationRecommendation = `Found ${totalJsResources} JavaScript and ${totalCssResources} CSS resources. `;
        minificationRecommendation += `${minifiedJsCount} of ${totalJsResources} JavaScript and ${minifiedCssCount} of ${totalCssResources} CSS resources are minified. `;
        if (hasInlineNonMinified) {
          minificationRecommendation += `

Non-minified inline scripts or styles detected. Consider minifying them or moving to external files.`;
        }
        minificationRecommendation += `

Minify your JavaScript and CSS files to improve page load speed. Use tools like UglifyJS, Terser, or CSSNano, or build tools like Webpack or Parcel.`;
      }
      const minificationPasses = minificationPercentage >= 40;
      addCheck(
        "Code Minification",
        minificationPasses ? `Your JavaScript and CSS resources are well optimized. ${minificationPercentage}% are minified.` : `${minificationPercentage}% of your JavaScript and CSS resources are minified. Aim for at least 40% minification.`,
        minificationPasses,
        minificationRecommendation
      );
      if (!minificationPasses) {
        const minificationCheck = checks.find((check) => check.title === "Code Minification");
        if (minificationCheck) {
          minificationCheck.recommendation = minificationRecommendation;
        }
      }
      const score = Math.round(passedChecks / checks.length * 100);
      return { checks, passedChecks, failedChecks, url, score, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    } catch (error) {
      console.error(`Error analyzing SEO: ${error.message}`);
      throw error;
    }
  }
  __name(analyzeSEO, "analyzeSEO");
  addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
  });
  async function handleRequest(request) {
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get("Origin");
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Content-Type": "application/json"
    };
    console.log(`Handling request: ${request.method} ${path} from ${origin || "unknown origin"}`);
    if (path === "/api/analyze" && request.method === "HEAD") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    try {
      if (path === "/api/analyze" && request.method === "POST") {
        const data = await request.json();
        const { keyphrase, url: url2 } = data;
        if (!keyphrase || !url2) {
          return new Response(JSON.stringify({ message: "Keyphrase and URL are required" }), { status: 400, headers: corsHeaders });
        }
        const results = await analyzeSEO(url2, keyphrase);
        return new Response(JSON.stringify(results), { status: 200, headers: corsHeaders });
      } else if (path === "/api/register-domains" && request.method === "POST") {
        const data = await request.json();
        const { domains } = data;
        if (!domains || !Array.isArray(domains)) {
          return new Response(JSON.stringify({ success: false, message: "Domains array is required" }), { status: 400, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ success: true, message: `Successfully registered ${domains.length} domains.` }), { status: 200, headers: corsHeaders });
      } else if (path === "/api/ping" && (request.method === "GET" || request.method === "HEAD")) {
        return new Response(JSON.stringify({ status: "ok", message: "Worker is running", timestamp: (/* @__PURE__ */ new Date()).toISOString() }), { status: 200, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ message: "Route not found", path }), { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error("Error processing request:", error);
      return new Response(JSON.stringify({ message: "Internal server error", error: error.message }), { status: 500, headers: corsHeaders });
    }
  }
  __name(handleRequest, "handleRequest");
})();
//# sourceMappingURL=index.js.map
