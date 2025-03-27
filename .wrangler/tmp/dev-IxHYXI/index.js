"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // .wrangler/tmp/bundle-xdTUI3/checked-fetch.js
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

  // .wrangler/tmp/bundle-xdTUI3/middleware-insertion-facade.js
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
    "Content Length": "high",
    "Keyphrase Density": "medium",
    "Keyphrase in Introduction": "medium",
    "Image Alt Attributes": "low",
    "Internal Links": "medium",
    "Outbound Links": "low"
  };
  function getSuccessMessage(checkType, url) {
    const messages = {
      "Keyphrase in Title": "Great job! Your title includes the target keyphrase.",
      "Keyphrase in Meta Description": "Perfect! Your meta description effectively uses the keyphrase.",
      "Keyphrase in URL": isHomePage(url) ? "All good here, since it's the homepage! \u2728" : "Excellent! Your URL is SEO-friendly with the keyphrase.",
      "Content Length": "Well done! Your content length is good for SEO.",
      "Keyphrase Density": "Perfect! Your keyphrase density is within the optimal range.",
      "Keyphrase in Introduction": "Excellent! You've included the keyphrase in your introduction.",
      "Image Alt Attributes": "Well done! Your images are properly optimized with the keyphrase.",
      "Internal Links": "Perfect! You have a good number of internal links.",
      "Outbound Links": "Excellent! You've included relevant outbound links."
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
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : "";
      const content = bodyContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const paragraphs = [];
      const paragraphMatches = bodyContent.matchAll(/<p[^>]*>(.*?)<\/p>/gi);
      for (const match of paragraphMatches) {
        const text = match[1].replace(/<[^>]+>/g, " ").trim();
        if (text) paragraphs.push(text);
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
      return {
        title,
        metaDescription,
        content,
        paragraphs,
        images,
        internalLinks,
        outboundLinks,
        url
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
        "Content Length",
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
