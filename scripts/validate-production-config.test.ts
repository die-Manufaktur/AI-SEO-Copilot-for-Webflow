/**
 * Production Configuration Validation Tests
 * RED Phase: Write failing tests for production configuration validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Production Configuration Validation', () => {
  let webflowJson: any;
  let packageJson: any;
  
  beforeEach(() => {
    // Read configuration files
    const webflowPath = path.resolve('./webflow.json');
    const packagePath = path.resolve('./package.json');
    
    webflowJson = JSON.parse(fs.readFileSync(webflowPath, 'utf8'));
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  });

  describe('webflow.json Configuration', () => {
    it('should have Webflow Data API permissions', () => {
      const permissions = webflowJson.permissions;
      
      // Check for required Webflow Data API permissions
      expect(permissions).toHaveProperty('webflowDataApi:sites:read');
      expect(permissions).toHaveProperty('webflowDataApi:sites:write');
      expect(permissions).toHaveProperty('webflowDataApi:pages:read');
      expect(permissions).toHaveProperty('webflowDataApi:pages:write');
      expect(permissions).toHaveProperty('webflowDataApi:cms:read');
      expect(permissions).toHaveProperty('webflowDataApi:cms:write');
      
      // Verify permission descriptions
      expect(permissions['webflowDataApi:sites:read']).toContain('read site information');
      expect(permissions['webflowDataApi:sites:write']).toContain('modify site settings');
      expect(permissions['webflowDataApi:pages:read']).toContain('read page content');
      expect(permissions['webflowDataApi:pages:write']).toContain('update page content');
      expect(permissions['webflowDataApi:cms:read']).toContain('read CMS collections');
      expect(permissions['webflowDataApi:cms:write']).toContain('update CMS items');
    });

    it('should have OAuth permissions', () => {
      const permissions = webflowJson.permissions;
      
      expect(permissions).toHaveProperty('oauth:authorize');
      expect(permissions['oauth:authorize']).toContain('authenticate with Webflow');
    });

    it('should include worker API in external API permissions', () => {
      const permissions = webflowJson.permissions;
      
      // Should have both development and production worker URLs
      expect(permissions).toHaveProperty('externalApi:http://localhost:8787');
      expect(permissions).toHaveProperty('externalApi:https://seo-copilot-api-production.paul-130.workers.dev');
      
      expect(permissions['externalApi:http://localhost:8787']).toContain('development API');
      expect(permissions['externalApi:https://seo-copilot-api-production.paul-130.workers.dev']).toContain('production API');
    });

    it('should have correct redirect URI configuration', () => {
      expect(webflowJson).toHaveProperty('oauth');
      expect(webflowJson.oauth).toHaveProperty('redirectUri');
      expect(webflowJson.oauth.redirectUri).toBe('https://webflow.com/oauth/authorize');
    });

    it('should have proper version and API version', () => {
      expect(webflowJson.apiVersion).toBe('2');
      expect(webflowJson.schema_version).toBe('2.0.0');
      expect(webflowJson.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning
    });
  });

  describe('Environment Variables Configuration', () => {
    it('should have production environment variables template', () => {
      const envExamplePath = path.resolve('./.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
      
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      
      // Check for required environment variables
      expect(envExample).toContain('WEBFLOW_CLIENT_ID=');
      expect(envExample).toContain('WEBFLOW_CLIENT_SECRET=');
      expect(envExample).toContain('OAUTH_REDIRECT_URI=');
      expect(envExample).toContain('OPENAI_API_KEY=');
      expect(envExample).toContain('VITE_WORKER_URL=');
    });

    it('should have wrangler.toml configuration', () => {
      const wranglerPath = path.resolve('./wrangler.toml');
      expect(fs.existsSync(wranglerPath)).toBe(true);
      
      const wranglerConfig = fs.readFileSync(wranglerPath, 'utf8');
      
      // Check for required wrangler configuration
      expect(wranglerConfig).toContain('name = "seo-copilot-api"');
      expect(wranglerConfig).toContain('compatibility_date =');
      expect(wranglerConfig).toContain('[vars]');
    });
  });

  describe('Package.json Scripts', () => {
    it('should have production deployment scripts', () => {
      const scripts = packageJson.scripts;
      
      expect(scripts).toHaveProperty('deploy:worker');
      expect(scripts).toHaveProperty('deploy:staging');
      expect(scripts).toHaveProperty('deploy:production');
      
      // Verify deployment commands
      expect(scripts['deploy:worker']).toContain('wrangler deploy');
      expect(scripts['deploy:staging']).toContain('staging');
      expect(scripts['deploy:production']).toContain('production');
    });

    it('should have environment validation scripts', () => {
      const scripts = packageJson.scripts;
      
      expect(scripts).toHaveProperty('validate:config');
      expect(scripts).toHaveProperty('validate:env');
      
      expect(scripts['validate:config']).toContain('validate-production-config');
      expect(scripts['validate:env']).toContain('check-env-vars');
    });
  });

  describe('Security Configuration', () => {
    it('should not expose sensitive information in webflow.json', () => {
      const webflowString = JSON.stringify(webflowJson);
      
      // Should not contain actual secrets
      expect(webflowString).not.toContain('sk-');
      expect(webflowString).not.toContain('wf_');
      expect(webflowString).not.toContain('client_secret');
      expect(webflowString).not.toContain('api_key');
    });

    it('should have proper CORS configuration', () => {
      // Check that external API permissions are properly scoped
      const permissions = webflowJson.permissions;
      const externalApis = Object.keys(permissions).filter(key => key.startsWith('externalApi:'));
      
      externalApis.forEach(api => {
        const url = api.replace('externalApi:', '');
        // Verify URLs are HTTPS or localhost
        expect(url.startsWith('https://') || url.startsWith('http://localhost')).toBe(true);
      });
    });
  });

  describe('Hybrid App Configuration', () => {
    it('should be configured as hybrid app', () => {
      expect(webflowJson).toHaveProperty('extensionType');
      expect(webflowJson.extensionType).toBe('hybrid');
    });

    it('should have OAuth callback configuration', () => {
      expect(webflowJson).toHaveProperty('oauth');
      expect(webflowJson.oauth).toHaveProperty('callbackPath');
      expect(webflowJson.oauth.callbackPath).toBe('/oauth/callback');
    });

    it('should have proper scope configuration', () => {
      expect(webflowJson.oauth).toHaveProperty('scopes');
      const scopes = webflowJson.oauth.scopes;
      
      expect(scopes).toContain('sites:read');
      expect(scopes).toContain('sites:write');
      expect(scopes).toContain('pages:read');
      expect(scopes).toContain('pages:write');
      expect(scopes).toContain('cms:read');
      expect(scopes).toContain('cms:write');
    });
  });
});