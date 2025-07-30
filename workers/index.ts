import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { AnalyzeSEORequest, WorkerEnvironment } from '../shared/types/index';
import { validateAnalyzeRequest } from './modules/validation';
import { scrapeWebPage } from './modules/webScraper';
import { analyzeSEOElements, checkKeywordMatch } from './modules/seoAnalysis';

const app = new Hono();

app.use('*', corsMiddleware());

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.get('/test-keywords', (c) => {
  const testResult = checkKeywordMatch("Expert Web Developer for Affordable Website Design Services | PMDS", "web developer", "services");
  return c.json({ testResult });
});

app.post('/api/analyze', async (c) => {
  try {
    const body = await c.req.json();
      
    if (!validateAnalyzeRequest(body)) {
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
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
  } catch (error) {
    console.error('[SEO Analyzer] Error in /api/analyze route:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;