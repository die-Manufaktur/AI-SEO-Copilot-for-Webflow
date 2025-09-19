/**
 * End-to-end tests for SEO content insertion workflows
 * Tests the complete user journey from analysis to content application
 */

import { test, expect } from '@playwright/test';

test.describe('SEO Content Insertion Workflows', () => {
  // Mock authenticated state for all tests
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('webflow_token', JSON.stringify({
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
        scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      }));
    });

    // Mock Webflow API endpoints
    await page.route('**/api/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'user_12345',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        }),
      });
    });

    // Mock sites endpoint
    await page.route('**/api/sites', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sites: [
            {
              _id: 'site_123',
              displayName: 'Test Site',
              shortName: 'test-site',
              lastPublished: '2024-01-15T12:00:00.000Z',
              createdOn: '2024-01-01T00:00:00.000Z',
            }
          ]
        }),
      });
    });

    // Mock pages endpoint
    await page.route('**/api/sites/site_123/pages', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pages: [
            {
              _id: 'page_1',
              siteId: 'site_123',
              title: 'Old Home Page Title',
              slug: 'home',
              isHomePage: true,
              isFolderHomePage: false,
              archived: false,
              draft: false,
              seo: {
                title: 'Old SEO Title',
                description: 'Short description that needs improvement for better SEO performance.',
              },
              openGraph: {
                title: 'Old OG Title',
                description: 'Old OG Description',
              },
              createdOn: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-15T12:00:00.000Z',
            },
            {
              _id: 'page_2',
              siteId: 'site_123',
              title: 'About Us',
              slug: 'about',
              isHomePage: false,
              isFolderHomePage: false,
              archived: false,
              draft: false,
              seo: {
                title: 'About Our Company',
                description: 'Learn more about our company and mission.',
              },
              openGraph: {
                title: 'About Our Company',
                description: 'Learn more about our company and mission.',
              },
              createdOn: '2024-01-02T00:00:00.000Z',
              lastUpdated: '2024-01-16T12:00:00.000Z',
            }
          ]
        }),
      });
    });

    // Mock AI recommendations endpoint
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recommendations: {
            title: 'Optimized Home Page Title - Best Quality Products & Services',
            description: 'Discover our premium products and exceptional services designed to meet your needs. Get expert solutions, fast delivery, and outstanding customer support. Start your journey with us today!',
          },
          confidence: 85,
          language: 'en',
        }),
      });
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="seo-extension"]', { timeout: 10000 });
  });

  test('should complete full SEO analysis and content application workflow', async ({ page }) => {
    // Step 1: Select site
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    
    // Step 2: Wait for pages to load
    await expect(page.locator('[data-testid="pages-list"]')).toBeVisible();
    
    // Step 3: Select a page for analysis
    await page.click('[data-testid="page-item-page_1"]');
    
    // Step 4: Click analyze button
    await page.click('[data-testid="analyze-button"]');
    
    // Step 5: Wait for analysis results
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Step 6: Verify SEO issues are displayed
    await expect(page.locator('[data-testid="seo-issues"]')).toBeVisible();
    await expect(page.locator('[data-testid="seo-score"]')).toBeVisible();
    
    // Step 7: Check AI recommendations are shown
    await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommended-title"]')).toContainText('Optimized Home Page Title');
    await expect(page.locator('[data-testid="recommended-description"]')).toContainText('Discover our premium products');
    
    // Step 8: Apply title recommendation
    await page.click('[data-testid="apply-title-button"]');
    
    // Step 9: Mock the API call for applying title
    await page.route('**/api/sites/site_123/pages/page_1', async (route) => {
      const request = route.request();
      if (request.method() === 'PATCH') {
        const postData = JSON.parse(await request.postData() || '{}');
        expect(postData.title).toBe('Optimized Home Page Title - Best Quality Products & Services');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'page_1',
            title: postData.title,
            seo: {
              title: 'Old SEO Title',
              description: 'Short description that needs improvement for better SEO performance.',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
    
    // Step 10: Verify success feedback
    await expect(page.locator('[data-testid="apply-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="apply-success-message"]')).toContainText(/title applied successfully/i);
    
    // Step 11: Apply description recommendation
    await page.click('[data-testid="apply-description-button"]');
    
    // Step 12: Verify both changes are reflected in UI
    await expect(page.locator('[data-testid="applied-changes-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="applied-changes-summary"]')).toContainText('2 changes applied');
  });

  test('should handle batch operations with confirmation dialog', async ({ page }) => {
    // Select site and load pages
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    await expect(page.locator('[data-testid="pages-list"]')).toBeVisible();
    
    // Select multiple pages
    await page.click('[data-testid="page-checkbox-page_1"]');
    await page.click('[data-testid="page-checkbox-page_2"]');
    
    // Click batch apply button
    await page.click('[data-testid="batch-apply-button"]');
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="batch-confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="batch-confirmation-dialog"]')).toContainText('Apply 4 Changes?');
    await expect(page.locator('[data-testid="batch-confirmation-dialog"]')).toContainText('2 pages will be affected');
    
    // Show details
    await page.click('[data-testid="show-details-button"]');
    await expect(page.locator('[data-testid="batch-operation-details"]')).toBeVisible();
    
    // Mock batch application API
    await page.route('**/api/batch/apply', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          results: [
            { success: true, data: { _id: 'page_1', title: 'New Title 1' } },
            { success: true, data: { _id: 'page_1', seo: { description: 'New Description 1' } } },
            { success: true, data: { _id: 'page_2', title: 'New Title 2' } },
            { success: true, data: { _id: 'page_2', seo: { description: 'New Description 2' } } },
          ],
          succeeded: 4,
          failed: 0,
          rollbackId: 'rollback_123',
        }),
      });
    });
    
    // Proceed with batch application
    await page.click('[data-testid="proceed-batch-button"]');
    
    // Should show progress
    await expect(page.locator('[data-testid="batch-progress-bar"]')).toBeVisible();
    
    // Should show success state
    await expect(page.locator('[data-testid="batch-success-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="batch-success-state"]')).toContainText('4 changes applied successfully');
    
    // Should show rollback option
    await expect(page.locator('[data-testid="rollback-button"]')).toBeVisible();
  });

  test('should handle rollback functionality', async ({ page }) => {
    // Set up a scenario where we have completed changes to rollback
    await page.addInitScript(() => {
      // Mock that we just completed a batch operation
      window.mockBatchResult = {
        success: true,
        succeeded: 2,
        failed: 0,
        rollbackId: 'rollback_456',
        results: [
          { success: true, data: { _id: 'page_1', title: 'Applied Title' } },
          { success: true, data: { _id: 'page_1', seo: { description: 'Applied Description' } } },
        ]
      };
    });
    
    // Navigate to a state where rollback is available
    await page.goto('/?mockBatchComplete=true');
    
    // Should show rollback button
    await expect(page.locator('[data-testid="rollback-button"]')).toBeVisible();
    
    // Click rollback
    await page.click('[data-testid="rollback-button"]');
    
    // Should show rollback confirmation
    await expect(page.locator('[data-testid="rollback-confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="rollback-confirmation-dialog"]')).toContainText('Rollback Changes?');
    await expect(page.locator('[data-testid="rollback-confirmation-dialog"]')).toContainText('undo all 2 changes');
    
    // Mock rollback API
    await page.route('**/api/rollback/rollback_456', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          rolledBack: 2,
          failed: 0,
        }),
      });
    });
    
    // Confirm rollback
    await page.click('[data-testid="confirm-rollback-button"]');
    
    // Should show rollback progress and success
    await expect(page.locator('[data-testid="rollback-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="rollback-success-message"]')).toContainText(/rollback completed successfully/i);
  });

  test('should handle editable AI recommendations', async ({ page }) => {
    // Navigate to analysis results
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    await page.click('[data-testid="page-item-page_1"]');
    await page.click('[data-testid="analyze-button"]');
    
    await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
    
    // Test editable title recommendation
    const titleInput = page.locator('[data-testid="editable-title-recommendation"]');
    await expect(titleInput).toBeVisible();
    
    // Click to edit
    await titleInput.click();
    
    // Should become editable
    await expect(titleInput).toBeFocused();
    
    // Modify the content
    await titleInput.fill('My Custom Optimized Title - Even Better Than AI');
    
    // Apply the custom title
    await page.click('[data-testid="apply-custom-title-button"]');
    
    // Mock API call with custom content
    await page.route('**/api/sites/site_123/pages/page_1', async (route) => {
      if (route.request().method() === 'PATCH') {
        const postData = JSON.parse(await route.request().postData() || '{}');
        expect(postData.title).toBe('My Custom Optimized Title - Even Better Than AI');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'page_1',
            title: postData.title,
          }),
        });
      } else {
        await route.continue();
      }
    });
    
    // Verify success with custom content
    await expect(page.locator('[data-testid="apply-success-message"]')).toContainText(/custom title applied successfully/i);
  });

  test('should display impact analysis for batch operations', async ({ page }) => {
    // Navigate to batch operation scenario
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    await page.click('[data-testid="page-checkbox-page_1"]');
    await page.click('[data-testid="page-checkbox-page_2"]');
    
    // Enable impact analysis
    await page.click('[data-testid="enable-impact-analysis"]');
    
    // Mock impact analysis endpoint
    await page.route('**/api/impact/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          affectedResources: { pages: 2, cmsItems: 0, totalOperations: 4 },
          seoImpact: {
            titleChanges: 2,
            descriptionChanges: 2,
            expectedScoreImprovement: 15,
            potentialTrafficIncrease: 8.5,
          },
          riskAssessment: {
            level: 'medium',
            factors: [
              {
                type: 'homepage_modification',
                severity: 'medium',
                description: 'Homepage modifications have high visibility impact',
              }
            ],
            recommendations: ['Consider testing homepage changes on staging first'],
          },
          estimatedTime: { seconds: 8, formattedTime: '8 seconds' },
        }),
      });
    });
    
    // Click batch apply
    await page.click('[data-testid="batch-apply-button"]');
    
    // Should show confirmation with impact analysis
    await expect(page.locator('[data-testid="batch-confirmation-dialog"]')).toBeVisible();
    
    // Show impact analysis
    await page.click('[data-testid="show-impact-analysis-button"]');
    await expect(page.locator('[data-testid="batch-impact-analysis"]')).toBeVisible();
    
    // Verify impact details
    await expect(page.locator('[data-testid="batch-impact-analysis"]')).toContainText('Expected score improvement: +15 points');
    await expect(page.locator('[data-testid="batch-impact-analysis"]')).toContainText('Potential traffic increase: +8.5%');
    await expect(page.locator('[data-testid="batch-impact-analysis"]')).toContainText('Risk Level: MEDIUM');
    await expect(page.locator('[data-testid="batch-impact-analysis"]')).toContainText('Consider testing homepage changes');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to analysis
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    await page.click('[data-testid="page-item-page_1"]');
    
    // Mock API error for analysis
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
          message: 'Failed to analyze page content',
        }),
      });
    });
    
    await page.click('[data-testid="analyze-button"]');
    
    // Should show error state
    await expect(page.locator('[data-testid="analysis-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-error"]')).toContainText(/failed to analyze|error occurred/i);
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-analysis-button"]')).toBeVisible();
  });

  test('should handle rate limiting scenarios', async ({ page }) => {
    // Navigate to batch operation
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    await page.click('[data-testid="page-checkbox-page_1"]');
    await page.click('[data-testid="batch-apply-button"]');
    
    // Mock rate limiting response
    await page.route('**/api/batch/apply', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate Limited',
          message: 'Too many requests. Please wait before retrying.',
          retryAfter: 60,
        }),
        headers: {
          'Retry-After': '60',
        },
      });
    });
    
    await page.click('[data-testid="proceed-batch-button"]');
    
    // Should show rate limit warning
    await expect(page.locator('[data-testid="rate-limit-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="rate-limit-warning"]')).toContainText(/rate limited|too many requests/i);
    await expect(page.locator('[data-testid="rate-limit-warning"]')).toContainText('60');
  });

  test('should support keyboard navigation and accessibility', async ({ page }) => {
    // Navigate to analysis results
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-site_123"]');
    await page.click('[data-testid="page-item-page_1"]');
    await page.click('[data-testid="analyze-button"]');
    
    await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
    
    // Test keyboard navigation through apply buttons
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="apply-title-button"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="apply-description-button"]')).toBeFocused();
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    
    // Should trigger the apply action
    await expect(page.locator('[data-testid="apply-success-message"]')).toBeVisible();
    
    // Check ARIA labels and roles
    await expect(page.locator('[data-testid="seo-score"]')).toHaveAttribute('role', 'status');
    await expect(page.locator('[data-testid="apply-title-button"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="batch-progress-bar"]')).toHaveAttribute('aria-label');
  });
});