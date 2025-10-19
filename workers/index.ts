import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { AnalyzeSEORequest, WorkerEnvironment } from '../shared/types/index';
import { validateAnalyzeRequest } from './modules/validation';
import { scrapeWebPage } from './modules/webScraper';
import { analyzeSEOElements, checkKeywordMatch } from './modules/seoAnalysis';
import { oauthProxy } from './modules/oauthProxy';

const app = new Hono();

app.use('*', corsMiddleware());

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// OAuth proxy endpoints
app.post('/oauth/token', oauthProxy.exchangeToken);
app.post('/oauth/refresh', oauthProxy.refreshToken);
app.get('/oauth/user', oauthProxy.getUserInfo);

app.get('/test-keywords', (c) => {
  const testResult = checkKeywordMatch("Expert Web Developer for Affordable Website Design Services | PMDS", "web developer", "services");
  return c.json({ testResult });
});

app.post('/api/analyze', async (c) => {
  try {
    console.log('[DEBUG] Analyze endpoint called');
    const body = await c.req.json();
    console.log('[DEBUG] Body parsed:', typeof body);
      
    if (!validateAnalyzeRequest(body)) {
      console.log('[DEBUG] Validation failed');
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
    console.log('[DEBUG] Validation passed');
    
    const { keyphrase, url, isHomePage = false, webflowPageData, pageAssets, advancedOptions } = body;
    console.log('[DEBUG] Destructured variables, about to scrape');
    
    const scrapedData = await scrapeWebPage(url, keyphrase);
    console.log('[DEBUG] Scraping completed');
    
    console.log('[DEBUG] About to call analyzeSEOElements');
    const analysisResult = await analyzeSEOElements(
      scrapedData, 
      keyphrase, 
      url, 
      isHomePage, 
      c.env as WorkerEnvironment, 
      webflowPageData, 
      pageAssets,
      advancedOptions
    );
    console.log('[DEBUG] Analysis completed');
    
    return c.json(analysisResult);
    
    /*
    const { keyphrase, url, isHomePage = false, webflowPageData, pageAssets, advancedOptions } = body;
    
    const scrapedData = await scrapeWebPage(url, keyphrase);
    
    const analysisResult = await analyzeSEOElements(
      scrapedData, 
      keyphrase, 
      url, 
      isHomePage, 
      c.env as WorkerEnvironment, 
      webflowPageData, 
      pageAssets,
      advancedOptions
    );
    
    return c.json(analysisResult);
    */
  } catch (error) {
    console.error('[SEO Analyzer] Error in /api/analyze route:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;