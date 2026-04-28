/**
 * End-to-end tests for OAuth authentication flow
 * Tests the complete user journey from login to authenticated state
 */

import { test, expect } from '@playwright/test';

test.describe('OAuth Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean state
    await page.goto('/');
  });

  test('should display login button when not authenticated', async ({ page }) => {
    // Wait for the extension to load
    await page.waitForSelector('[data-testid="webflow-app-wrapper"]', { timeout: 10000 });
    
    // Should show login button for unauthenticated state
    const loginButton = page.locator('[data-testid="login-button"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveText(/connect to webflow|login|authorize/i);
  });

  test('should handle OAuth initialization', async ({ page }) => {
    // Mock OAuth flow since we can't test real OAuth in E2E
    await page.route('**/oauth/authorize**', async (route) => {
      // Simulate OAuth redirect
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/oauth/callback?code=test_auth_code&state=test_state',
        },
      });
    });

    // Mock token exchange
    await page.route('**/oauth/access_token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
        }),
      });
    });

    // Click login button
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to OAuth callback
    await page.waitForURL(/oauth\/callback/);
    
    // Should handle callback and return to main app
    await page.waitForURL('/');
    
    // Should now show authenticated state
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should handle OAuth error scenarios', async ({ page }) => {
    // Mock OAuth error response
    await page.route('**/oauth/authorize**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/oauth/callback?error=access_denied&error_description=User%20denied%20access',
        },
      });
    });

    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(/access denied|authorization failed/i);
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Set up authenticated state in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('webflow_token', JSON.stringify({
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000, // 1 hour from now
      }));
    });

    // Mock user info endpoint
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

    await page.reload();
    
    // Should maintain authenticated state
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).not.toBeVisible();
  });

  test('should handle token expiration and refresh', async ({ page }) => {
    // Set up expired token
    await page.addInitScript(() => {
      localStorage.setItem('webflow_token', JSON.stringify({
        access_token: 'expired_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() - 1000, // Expired 1 second ago
      }));
    });

    // Mock refresh token endpoint
    await page.route('**/oauth/access_token', async (route) => {
      const postData = await route.request().postData();
      if (postData?.includes('refresh_token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'new_access_token',
            refresh_token: 'new_refresh_token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock user info with new token
    await page.route('**/api/user', async (route) => {
      const authHeader = route.request().headers()['authorization'];
      if (authHeader === 'Bearer new_access_token') {
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
      } else {
        await route.fulfill({ status: 401 });
      }
    });

    await page.reload();
    
    // Should automatically refresh token and maintain authentication
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should handle logout functionality', async ({ page }) => {
    // Set up authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('webflow_token', JSON.stringify({
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
      }));
    });

    await page.reload();
    
    // Should show logout option
    await page.click('[data-testid="user-menu-trigger"]');
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
    
    // Click logout
    await page.click('[data-testid="logout-button"]');
    
    // Should clear authentication and show login button
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-profile"]')).not.toBeVisible();
    
    // Should clear localStorage
    const token = await page.evaluate(() => localStorage.getItem('webflow_token'));
    expect(token).toBeNull();
  });

  test('should handle insufficient permissions gracefully', async ({ page }) => {
    // Set up authenticated state with limited permissions
    await page.addInitScript(() => {
      localStorage.setItem('webflow_token', JSON.stringify({
        access_token: 'limited_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
        scope: 'sites:read pages:read', // Read-only permissions
      }));
    });

    // Mock user info
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

    await page.reload();
    
    // Should show authenticated state but with limited functionality
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Should show permission warning
    await expect(page.locator('[data-testid="permission-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="permission-warning"]')).toContainText(/limited permissions|read.only/i);
    
    // Apply buttons should be disabled or hidden
    const applyButtons = page.locator('[data-testid^="apply-button"]');
    const count = await applyButtons.count();
    
    if (count > 0) {
      // If apply buttons exist, they should be disabled
      for (let i = 0; i < count; i++) {
        await expect(applyButtons.nth(i)).toBeDisabled();
      }
    }
  });

  test('should show upgrade prompt for premium features', async ({ page }) => {
    // Set up authenticated state with basic permissions
    await page.addInitScript(() => {
      localStorage.setItem('webflow_token', JSON.stringify({
        access_token: 'basic_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
        scope: 'sites:read cms:read', // Basic permissions
      }));
    });

    await page.reload();
    
    // Try to access premium feature
    await page.click('[data-testid="bulk-apply-button"]');
    
    // Should show upgrade dialog
    await expect(page.locator('[data-testid="upgrade-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-dialog"]')).toContainText(/upgrade|premium|advanced features/i);
    
    // Should have upgrade CTA
    await expect(page.locator('[data-testid="upgrade-cta"]')).toBeVisible();
  });
});