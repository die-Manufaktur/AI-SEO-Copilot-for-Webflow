/**
 * End-to-end tests for advanced workflow features
 * Tests content intelligence, batch operations, and complex user scenarios
 */

import { test, expect } from '@playwright/test';

test.describe('Advanced Workflow Features', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state with full permissions
    await page.addInitScript(() => {
      localStorage.setItem('webflow_token', JSON.stringify({
        access_token: 'premium_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
        scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      }));
    });

    // Mock API endpoints
    await page.route('**/api/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'user_12345',
          email: 'premium@example.com',
          firstName: 'Premium',
          lastName: 'User',
          plan: 'pro',
        }),
      });
    });

    // Mock sites with CMS collections
    await page.route('**/api/sites', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sites: [
            {
              _id: 'site_123',
              displayName: 'E-commerce Site',
              shortName: 'ecommerce-site',
              lastPublished: '2024-01-15T12:00:00.000Z',
              createdOn: '2024-01-01T00:00:00.000Z',
            }
          ]
        }),
      });
    });

    // Mock CMS collections
    await page.route('**/api/sites/site_123/collections', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collections: [
            {
              _id: 'collection_products',
              displayName: 'Products',
              slug: 'products',
              singularName: 'Product',
            },
            {
              _id: 'collection_blog',
              displayName: 'Blog Posts',
              slug: 'blog-posts',
              singularName: 'Blog Post',
            }
          ]
        }),
      });
    });

    // Mock CMS items
    await page.route('**/api/collections/collection_products/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              _id: 'item_1',
              fieldData: {
                name: 'Premium Widget',
                'short-description': 'Great widget',
                'meta-title': 'Basic Widget Title',
                'meta-description': 'Short desc',
              }
            },
            {
              _id: 'item_2',
              fieldData: {
                name: 'Deluxe Gadget',
                'short-description': 'Amazing gadget',
                'meta-title': 'Simple Gadget Title',
                'meta-description': 'Brief desc',
              }
            }
          ]
        }),
      });
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="seo-extension"]', { timeout: 10000 });
  });

  test('should perform intelligent content analysis across pages and CMS', async ({ page }) => {
    // Select site
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    
    // Switch to content intelligence mode
    await page.click('[data-testid="content-intelligence-tab"]');
    
    // Mock content intelligence analysis
    await page.route('**/api/content/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          insights: {
            totalIssues: 12,
            criticalIssues: 3,
            opportunities: 8,
            overallScore: 68,
          },
          recommendations: [
            {
              type: 'title_optimization',
              priority: 'high',
              affectedResources: ['page_1', 'item_1', 'item_2'],
              issue: 'Multiple pages have titles under 30 characters',
              solution: 'Expand titles to include relevant keywords and value propositions',
              impact: 'Could improve click-through rates by 15-25%',
            },
            {
              type: 'meta_description_missing',
              priority: 'medium',
              affectedResources: ['page_2', 'item_1'],
              issue: '2 resources missing meta descriptions',
              solution: 'Generate compelling meta descriptions with clear CTAs',
              impact: 'Essential for search result snippets',
            },
            {
              type: 'content_gap',
              priority: 'medium',
              affectedResources: ['collection_products'],
              issue: 'Product descriptions lack key SEO elements',
              solution: 'Enhance product descriptions with features, benefits, and keywords',
              impact: 'Could improve product page search visibility',
            }
          ],
          contentThemes: [
            { theme: 'premium products', frequency: 8, relevance: 0.9 },
            { theme: 'quality assurance', frequency: 5, relevance: 0.8 },
            { theme: 'customer satisfaction', frequency: 6, relevance: 0.85 }
          ],
        }),
      });
    });

    // Trigger content analysis
    await page.click('[data-testid="analyze-all-content-button"]');
    
    // Should show analysis loading state
    await expect(page.locator('[data-testid="content-analysis-loading"]')).toBeVisible();
    
    // Should display intelligent insights
    await expect(page.locator('[data-testid="content-insights"]')).toBeVisible();
    await expect(page.locator('[data-testid="overall-score"]')).toContainText('68');
    await expect(page.locator('[data-testid="critical-issues"]')).toContainText('3');
    
    // Should show prioritized recommendations
    await expect(page.locator('[data-testid="recommendation-title_optimization"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendation-title_optimization"]')).toContainText('high priority');
    await expect(page.locator('[data-testid="recommendation-title_optimization"]')).toContainText('3 resources affected');
    
    // Should display content themes
    await expect(page.locator('[data-testid="content-themes"]')).toBeVisible();
    await expect(page.locator('[data-testid="theme-premium-products"]')).toContainText('premium products (8)');
  });

  test('should execute smart batch operations with AI optimization', async ({ page }) => {
    // Navigate to batch operations
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    await page.click('[data-testid="smart-batch-tab"]');
    
    // Select content for optimization
    await page.click('[data-testid="select-pages-tab"]');
    await page.click('[data-testid="page-checkbox-page_1"]');
    await page.click('[data-testid="page-checkbox-page_2"]');
    
    await page.click('[data-testid="select-cms-tab"]');
    await page.click('[data-testid="collection-products"]');
    await page.click('[data-testid="item-checkbox-item_1"]');
    await page.click('[data-testid="item-checkbox-item_2"]');
    
    // Configure AI optimization settings
    await page.click('[data-testid="ai-optimization-settings"]');
    await page.check('[data-testid="optimize-for-conversion"]');
    await page.check('[data-testid="maintain-brand-voice"]');
    await page.selectOption('[data-testid="target-audience"]', 'business_professionals');
    
    // Mock AI batch optimization
    await page.route('**/api/ai/batch-optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          optimizations: [
            {
              resourceId: 'page_1',
              type: 'page_title',
              original: 'Old Home Page Title',
              optimized: 'Premium Products & Services - Industry-Leading Quality Solutions',
              confidence: 92,
              reasoning: 'Enhanced with value proposition and target keywords',
            },
            {
              resourceId: 'page_1',
              type: 'meta_description',
              original: 'Short description',
              optimized: 'Discover premium products and expert services designed for business professionals. Get industry-leading quality, exceptional support, and proven results. Start your success journey today!',
              confidence: 88,
              reasoning: 'Added clear value proposition, target audience, and call-to-action',
            },
            {
              resourceId: 'item_1',
              type: 'meta_title',
              original: 'Basic Widget Title',
              optimized: 'Premium Widget - Professional Grade Quality & Reliability',
              confidence: 90,
              reasoning: 'Emphasized premium positioning and key benefits',
            },
            {
              resourceId: 'item_1',
              type: 'meta_description',
              original: 'Short desc',
              optimized: 'Experience the Premium Widget advantage - engineered for professionals who demand reliability, performance, and exceptional results. Order now for fast delivery.',
              confidence: 87,
              reasoning: 'Highlighted target audience, benefits, and clear CTA',
            }
          ],
          summary: {
            totalOptimizations: 4,
            averageConfidence: 89.25,
            estimatedImpact: '+22% click-through rate improvement',
            estimatedTrafficIncrease: '15-30%',
          }
        }),
      });
    });

    // Generate AI optimizations
    await page.click('[data-testid="generate-ai-optimizations"]');
    
    // Should show optimization results
    await expect(page.locator('[data-testid="ai-optimizations"]')).toBeVisible();
    await expect(page.locator('[data-testid="optimization-summary"]')).toContainText('4 optimizations');
    await expect(page.locator('[data-testid="optimization-summary"]')).toContainText('89.3% average confidence');
    
    // Should show before/after comparisons
    await expect(page.locator('[data-testid="optimization-page_1-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="before-page_1-title"]')).toContainText('Old Home Page Title');
    await expect(page.locator('[data-testid="after-page_1-title"]')).toContainText('Premium Products & Services');
    
    // User can edit optimizations
    await page.click('[data-testid="edit-optimization-page_1-title"]');
    await page.fill('[data-testid="custom-title-input"]', 'My Custom Premium Title - Best in Class Solutions');
    await page.click('[data-testid="save-custom-optimization"]');
    
    // Apply all optimizations
    await page.click('[data-testid="apply-all-optimizations"]');
    
    // Should show confirmation with impact analysis
    await expect(page.locator('[data-testid="batch-confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="impact-summary"]')).toContainText('22% click-through rate improvement');
    
    // Mock batch application
    await page.route('**/api/batch/apply-optimizations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          results: [
            { success: true, resourceId: 'page_1', type: 'title' },
            { success: true, resourceId: 'page_1', type: 'description' },
            { success: true, resourceId: 'item_1', type: 'title' },
            { success: true, resourceId: 'item_1', type: 'description' },
          ],
          succeeded: 4,
          failed: 0,
          rollbackId: 'rollback_ai_batch_123',
        }),
      });
    });
    
    await page.click('[data-testid="proceed-optimization-batch"]');
    
    // Should show success with AI insights
    await expect(page.locator('[data-testid="ai-batch-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-batch-success"]')).toContainText('AI optimization completed');
    await expect(page.locator('[data-testid="ai-batch-success"]')).toContainText('4 improvements applied');
  });

  test('should provide comprehensive rollback with change tracking', async ({ page }) => {
    // Set up a scenario with recent changes
    await page.addInitScript(() => {
      // Mock rollback service data
      window.mockRollbackData = {
        rollbackId: 'rollback_complex_123',
        changes: [
          { resourceId: 'page_1', field: 'title', before: 'Old Title', after: 'New AI Title' },
          { resourceId: 'page_1', field: 'seo.description', before: 'Old Description', after: 'New AI Description' },
          { resourceId: 'item_1', field: 'meta-title', before: 'Basic Title', after: 'Premium Title' },
        ],
        timestamp: Date.now() - 300000, // 5 minutes ago
        totalChanges: 3,
      };
    });
    
    await page.goto('/?mockRecentChanges=true');
    
    // Navigate to rollback management
    await page.click('[data-testid="rollback-management-tab"]');
    
    // Should show recent changes
    await expect(page.locator('[data-testid="recent-changes"]')).toBeVisible();
    await expect(page.locator('[data-testid="change-rollback_complex_123"]')).toBeVisible();
    await expect(page.locator('[data-testid="change-rollback_complex_123"]')).toContainText('3 changes');
    await expect(page.locator('[data-testid="change-rollback_complex_123"]')).toContainText('5 minutes ago');
    
    // View change details
    await page.click('[data-testid="view-changes-rollback_complex_123"]');
    await expect(page.locator('[data-testid="change-details-dialog"]')).toBeVisible();
    
    // Should show detailed change log
    await expect(page.locator('[data-testid="change-page_1-title"]')).toContainText('Old Title → New AI Title');
    await expect(page.locator('[data-testid="change-page_1-description"]')).toContainText('Old Description → New AI Description');
    await expect(page.locator('[data-testid="change-item_1-title"]')).toContainText('Basic Title → Premium Title');
    
    // Generate rollback preview
    await page.click('[data-testid="preview-rollback-button"]');
    await expect(page.locator('[data-testid="rollback-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="rollback-preview"]')).toContainText('3 changes will be reverted');
    await expect(page.locator('[data-testid="rollback-preview"]')).toContainText('Estimated time: 6 seconds');
    await expect(page.locator('[data-testid="rollback-preview"]')).toContainText('Risk level: LOW');
    
    // Mock rollback execution
    await page.route('**/api/rollback/execute', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalChanges: 3,
          rolledBack: 3,
          failed: 0,
          duration: 5800,
        }),
      });
    });
    
    // Execute rollback
    await page.click('[data-testid="execute-rollback-button"]');
    
    // Should show progress tracking
    await expect(page.locator('[data-testid="rollback-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="rollback-progress-bar"]')).toBeVisible();
    
    // Should show success
    await expect(page.locator('[data-testid="rollback-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="rollback-success"]')).toContainText('3 changes rolled back successfully');
    await expect(page.locator('[data-testid="rollback-success"]')).toContainText('completed in 5.8 seconds');
  });

  test('should handle complex multi-language optimization workflows', async ({ page }) => {
    // Set up multi-language site
    await page.route('**/api/sites/site_123/locales', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          locales: [
            { code: 'en', name: 'English', primary: true },
            { code: 'es', name: 'Spanish', primary: false },
            { code: 'fr', name: 'French', primary: false },
          ]
        }),
      });
    });
    
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    
    // Switch to multi-language optimization
    await page.click('[data-testid="multi-language-tab"]');
    
    // Should show language selector
    await expect(page.locator('[data-testid="language-selector"]')).toBeVisible();
    
    // Select Spanish optimization
    await page.selectOption('[data-testid="language-selector"]', 'es');
    
    // Select content for Spanish optimization
    await page.click('[data-testid="page-checkbox-page_1"]');
    
    // Mock Spanish AI optimization
    await page.route('**/api/ai/optimize-language', async (route) => {
      const requestData = await route.request().postDataJSON();
      expect(requestData.language).toBe('es');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          optimizations: [
            {
              field: 'title',
              original: 'Old Home Page Title',
              optimized: 'Productos Premium y Servicios - Soluciones de Calidad Líder en la Industria',
              language: 'es',
              confidence: 91,
            },
            {
              field: 'meta_description',
              original: 'Short description',
              optimized: 'Descubre productos premium y servicios expertos diseñados para profesionales empresariales. Obtén calidad líder en la industria, soporte excepcional y resultados comprobados.',
              language: 'es',
              confidence: 89,
            }
          ],
          culturalInsights: [
            'Used formal "usted" form appropriate for business context',
            'Emphasized quality and professionalism, important in Spanish markets',
            'Added clear value proposition with business focus'
          ]
        }),
      });
    });
    
    // Generate Spanish optimizations
    await page.click('[data-testid="generate-language-optimizations"]');
    
    // Should show Spanish optimizations
    await expect(page.locator('[data-testid="spanish-optimizations"]')).toBeVisible();
    await expect(page.locator('[data-testid="optimized-title-es"]')).toContainText('Productos Premium y Servicios');
    
    // Should show cultural insights
    await expect(page.locator('[data-testid="cultural-insights"]')).toBeVisible();
    await expect(page.locator('[data-testid="cultural-insights"]')).toContainText('formal "usted" form');
    await expect(page.locator('[data-testid="cultural-insights"]')).toContainText('business context');
    
    // Apply Spanish optimizations
    await page.click('[data-testid="apply-spanish-optimizations"]');
    
    // Should confirm language-specific application
    await expect(page.locator('[data-testid="language-application-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-application-success"]')).toContainText('Spanish optimizations applied');
  });

  test('should provide performance monitoring and optimization suggestions', async ({ page }) => {
    // Navigate to performance insights
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    await page.click('[data-testid="performance-tab"]');
    
    // Mock performance analysis
    await page.route('**/api/performance/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          metrics: {
            seoScore: 72,
            technicalScore: 85,
            contentScore: 68,
            userExperienceScore: 91,
          },
          insights: [
            {
              category: 'SEO',
              issue: 'Missing schema markup on product pages',
              impact: 'high',
              effort: 'medium',
              recommendation: 'Add Product schema to CMS template',
              potentialImprovement: '+15 SEO score points',
            },
            {
              category: 'Content',
              issue: 'Thin content on category pages',
              impact: 'medium',
              effort: 'high',
              recommendation: 'Expand category descriptions with unique, keyword-rich content',
              potentialImprovement: '+10 content score points',
            },
            {
              category: 'Technical',
              issue: 'Large image files affecting load time',
              impact: 'medium',
              effort: 'low',
              recommendation: 'Optimize images with WebP format and responsive sizing',
              potentialImprovement: '+5 technical score points',
            }
          ],
          competitorAnalysis: {
            averageIndustryScore: 78,
            topCompetitor: 'competitor.com',
            topCompetitorScore: 89,
            gapAnalysis: [
              'Competitor uses more comprehensive schema markup',
              'Better mobile page speed optimization',
              'More frequent content updates'
            ]
          }
        }),
      });
    });
    
    // Trigger performance analysis
    await page.click('[data-testid="analyze-performance-button"]');
    
    // Should show performance dashboard
    await expect(page.locator('[data-testid="performance-dashboard"]')).toBeVisible();
    
    // Should display performance scores
    await expect(page.locator('[data-testid="seo-score"]')).toContainText('72');
    await expect(page.locator('[data-testid="technical-score"]')).toContainText('85');
    await expect(page.locator('[data-testid="content-score"]')).toContainText('68');
    await expect(page.locator('[data-testid="ux-score"]')).toContainText('91');
    
    // Should show prioritized insights
    await expect(page.locator('[data-testid="insight-schema-markup"]')).toBeVisible();
    await expect(page.locator('[data-testid="insight-schema-markup"]')).toContainText('high impact');
    await expect(page.locator('[data-testid="insight-schema-markup"]')).toContainText('+15 SEO score points');
    
    // Should show competitor analysis
    await expect(page.locator('[data-testid="competitor-analysis"]')).toBeVisible();
    await expect(page.locator('[data-testid="industry-average"]')).toContainText('78');
    await expect(page.locator('[data-testid="top-competitor"]')).toContainText('competitor.com (89)');
    
    // Should allow insight implementation
    await page.click('[data-testid="implement-insight-schema-markup"]');
    await expect(page.locator('[data-testid="implementation-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="implementation-guide"]')).toContainText('Add Product schema to CMS template');
  });

  test('should handle enterprise-grade security and audit logging', async ({ page }) => {
    // Navigate to security audit
    await page.click('[data-testid="security-audit-tab"]');
    
    // Mock security audit
    await page.route('**/api/security/audit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          securityScore: 94,
          findings: [
            {
              type: 'ssl_configuration',
              severity: 'low',
              status: 'pass',
              details: 'SSL certificate properly configured',
            },
            {
              type: 'content_security_policy',
              severity: 'medium',
              status: 'warning',
              details: 'CSP header could be more restrictive',
              recommendation: 'Consider adding frame-ancestors directive',
            },
            {
              type: 'api_rate_limiting',
              severity: 'low',
              status: 'pass',
              details: 'Rate limiting properly configured',
            }
          ],
          auditLog: [
            {
              timestamp: '2024-01-15T14:30:00Z',
              action: 'batch_operation',
              user: 'premium@example.com',
              resourcesAffected: 5,
              success: true,
            },
            {
              timestamp: '2024-01-15T14:25:00Z',
              action: 'rollback_operation',
              user: 'premium@example.com',
              resourcesAffected: 3,
              success: true,
            }
          ]
        }),
      });
    });
    
    // Trigger security audit
    await page.click('[data-testid="run-security-audit"]');
    
    // Should show security dashboard
    await expect(page.locator('[data-testid="security-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="security-score"]')).toContainText('94');
    
    // Should show security findings
    await expect(page.locator('[data-testid="security-findings"]')).toBeVisible();
    await expect(page.locator('[data-testid="finding-ssl_configuration"]')).toContainText('pass');
    await expect(page.locator('[data-testid="finding-content_security_policy"]')).toContainText('warning');
    
    // Should show audit log
    await expect(page.locator('[data-testid="audit-log"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-entry-0"]')).toContainText('batch_operation');
    await expect(page.locator('[data-testid="audit-entry-0"]')).toContainText('premium@example.com');
    await expect(page.locator('[data-testid="audit-entry-0"]')).toContainText('5 resources');
    
    // Should allow log export
    await page.click('[data-testid="export-audit-log"]');
    
    // Mock file download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('audit-log');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});