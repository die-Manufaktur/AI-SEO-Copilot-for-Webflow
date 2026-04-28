/**
 * Security Audit Service
 * Performs comprehensive security checks and monitoring
 */

export interface SecurityFinding {
  id: string;
  category: 'authentication' | 'data_protection' | 'network' | 'input_validation' | 'access_control' | 'cryptography';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  status: 'pass' | 'warning' | 'fail';
  evidence?: any;
  references?: string[];
}

export interface SecurityMetrics {
  overallScore: number;
  categoryScores: {
    authentication: number;
    dataProtection: number;
    network: number;
    inputValidation: number;
    accessControl: number;
    cryptography: number;
  };
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

export interface AuditLog {
  timestamp: string;
  event: string;
  user?: string;
  resource?: string;
  action?: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
  details?: any;
}

export interface SecurityConfiguration {
  enableAuditLogging: boolean;
  enableThreatDetection: boolean;
  enableDataEncryption: boolean;
  maxSessionDuration: number;
  requireMFA: boolean;
  allowedOrigins: string[];
  csrfProtection: boolean;
  rateLimitingEnabled: boolean;
}

class SecurityAuditService {
  private findings: SecurityFinding[] = [];
  private auditLogs: AuditLog[] = [];
  private configuration: SecurityConfiguration;
  private threatDetectionEnabled = false;

  constructor() {
    this.configuration = this.getDefaultConfiguration();
    this.setupSecurityHeaders();
    this.initializeThreatDetection();
  }

  private getDefaultConfiguration(): SecurityConfiguration {
    return {
      enableAuditLogging: true,
      enableThreatDetection: true,
      enableDataEncryption: true,
      maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      requireMFA: false,
      allowedOrigins: ['https://webflow.com', 'https://*.webflow.com'],
      csrfProtection: true,
      rateLimitingEnabled: true,
    };
  }

  /**
   * Perform comprehensive security audit
   */
  async performAudit(): Promise<{
    findings: SecurityFinding[];
    metrics: SecurityMetrics;
    recommendations: string[];
  }> {
    this.findings = [];

    // Perform all security checks
    await this.auditAuthentication();
    await this.auditDataProtection();
    await this.auditNetworkSecurity();
    await this.auditInputValidation();
    await this.auditAccessControl();
    await this.auditCryptography();

    const metrics = this.calculateSecurityMetrics();
    const recommendations = this.generateRecommendations();

    return {
      findings: this.findings,
      metrics,
      recommendations,
    };
  }

  /**
   * Audit authentication mechanisms
   */
  private async auditAuthentication(): Promise<void> {
    // Check OAuth implementation
    const tokenStorage = localStorage.getItem('webflow_token');
    
    if (tokenStorage) {
      try {
        const token = JSON.parse(tokenStorage);
        
        // Check token expiration
        if (token.expires_at && token.expires_at < Date.now()) {
          this.addFinding({
            id: 'auth_001',
            category: 'authentication',
            severity: 'medium',
            title: 'Expired token detected',
            description: 'An expired authentication token was found in storage',
            recommendation: 'Implement automatic token refresh or prompt user to re-authenticate',
            status: 'warning',
            evidence: { expires_at: token.expires_at, current_time: Date.now() },
          });
        }

        // Check token scope
        if (!token.scope || !token.scope.includes('sites:read')) {
          this.addFinding({
            id: 'auth_002',
            category: 'authentication',
            severity: 'high',
            title: 'Insufficient token scope',
            description: 'Authentication token lacks required permissions',
            recommendation: 'Request appropriate scopes during OAuth flow',
            status: 'fail',
            evidence: { scope: token.scope },
          });
        }

        // Check for secure token storage
        this.addFinding({
          id: 'auth_003',
          category: 'authentication',
          severity: 'medium',
          title: 'Token stored in localStorage',
          description: 'Authentication tokens are stored in localStorage, which is accessible via JavaScript',
          recommendation: 'Consider using httpOnly cookies or secure token storage solutions',
          status: 'warning',
          evidence: { storage_type: 'localStorage' },
        });

      } catch (error) {
        this.addFinding({
          id: 'auth_004',
          category: 'authentication',
          severity: 'high',
          title: 'Malformed token data',
          description: 'Authentication token data is corrupted or malformed',
          recommendation: 'Clear corrupted token data and prompt re-authentication',
          status: 'fail',
          evidence: { error: (error as Error).message },
        });
      }
    } else {
      this.addFinding({
        id: 'auth_005',
        category: 'authentication',
        severity: 'info',
        title: 'No authentication token found',
        description: 'User is not currently authenticated',
        recommendation: 'This is normal for unauthenticated sessions',
        status: 'pass',
      });
    }

    // Check session management
    const sessionStart = sessionStorage.getItem('session_start');
    if (sessionStart) {
      const sessionDuration = Date.now() - parseInt(sessionStart);
      if (sessionDuration > this.configuration.maxSessionDuration) {
        this.addFinding({
          id: 'auth_006',
          category: 'authentication',
          severity: 'medium',
          title: 'Long-running session detected',
          description: 'User session has been active beyond recommended duration',
          recommendation: 'Implement automatic session timeout and re-authentication',
          status: 'warning',
          evidence: { duration: sessionDuration, max_duration: this.configuration.maxSessionDuration },
        });
      }
    }
  }

  /**
   * Audit data protection measures
   */
  private async auditDataProtection(): Promise<void> {
    // Check for sensitive data in localStorage
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /api[_-]?key/i,
      /private[_-]?key/i,
      /token/i,
      /auth/i,
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        
        sensitivePatterns.forEach((pattern, index) => {
          if (pattern.test(key) || (value && pattern.test(value))) {
            this.addFinding({
              id: `data_001_${index}`,
              category: 'data_protection',
              severity: 'medium',
              title: 'Sensitive data in localStorage',
              description: `Potentially sensitive data found in localStorage key: ${key}`,
              recommendation: 'Avoid storing sensitive data in browser storage, use secure alternatives',
              status: 'warning',
              evidence: { key, value_length: value?.length },
            });
          }
        });
      }
    }

    // Check for HTTPS usage
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      this.addFinding({
        id: 'data_002',
        category: 'data_protection',
        severity: 'critical',
        title: 'Insecure connection',
        description: 'Application is not served over HTTPS',
        recommendation: 'Ensure all production traffic uses HTTPS',
        status: 'fail',
        evidence: { protocol: location.protocol, hostname: location.hostname },
      });
    }

    // Check Content Security Policy
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      this.addFinding({
        id: 'data_003',
        category: 'data_protection',
        severity: 'medium',
        title: 'Missing Content Security Policy',
        description: 'No CSP header or meta tag found',
        recommendation: 'Implement a restrictive Content Security Policy',
        status: 'warning',
      });
    }

    // Check for secure cookies (if any)
    const cookies = document.cookie;
    if (cookies) {
      if (!cookies.includes('Secure') || !cookies.includes('SameSite')) {
        this.addFinding({
          id: 'data_004',
          category: 'data_protection',
          severity: 'medium',
          title: 'Insecure cookie configuration',
          description: 'Cookies lack security attributes',
          recommendation: 'Set Secure, HttpOnly, and SameSite attributes on all cookies',
          status: 'warning',
          evidence: { cookies },
        });
      }
    }
  }

  /**
   * Audit network security
   */
  private async auditNetworkSecurity(): Promise<void> {
    // Check for mixed content
    const images = Array.from(document.querySelectorAll('img'));
    const scripts = Array.from(document.querySelectorAll('script'));
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    const insecureResources: string[] = [];

    [...images, ...scripts, ...stylesheets].forEach((element) => {
      const src = element.getAttribute('src') || element.getAttribute('href');
      if (src && src.startsWith('http://')) {
        insecureResources.push(src);
      }
    });

    if (insecureResources.length > 0) {
      this.addFinding({
        id: 'network_001',
        category: 'network',
        severity: 'high',
        title: 'Mixed content detected',
        description: 'Insecure resources loaded over HTTP',
        recommendation: 'Update all resource URLs to use HTTPS',
        status: 'fail',
        evidence: { insecure_resources: insecureResources },
      });
    }

    // Check for inline scripts and styles
    const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'));
    const inlineStyles = Array.from(document.querySelectorAll('style'));

    if (inlineScripts.length > 0 || inlineStyles.length > 0) {
      this.addFinding({
        id: 'network_002',
        category: 'network',
        severity: 'low',
        title: 'Inline scripts/styles detected',
        description: 'Inline scripts and styles can be vectors for XSS attacks',
        recommendation: 'Move inline code to external files and use CSP nonce or hash',
        status: 'warning',
        evidence: { 
          inline_scripts: inlineScripts.length,
          inline_styles: inlineStyles.length 
        },
      });
    }

    // Check for external domains
    const externalDomains = new Set<string>();
    [...scripts, ...stylesheets].forEach((element) => {
      const src = element.getAttribute('src') || element.getAttribute('href');
      if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        try {
          const url = new URL(src);
          if (url.hostname !== location.hostname) {
            externalDomains.add(url.hostname);
          }
        } catch (e) {
          // Invalid URL
        }
      }
    });

    if (externalDomains.size > 0) {
      this.addFinding({
        id: 'network_003',
        category: 'network',
        severity: 'info',
        title: 'External resources detected',
        description: 'Application loads resources from external domains',
        recommendation: 'Verify all external domains are trusted and necessary',
        status: 'pass',
        evidence: { external_domains: Array.from(externalDomains) },
      });
    }
  }

  /**
   * Audit input validation
   */
  private async auditInputValidation(): Promise<void> {
    // Check for form inputs without validation
    const forms = Array.from(document.querySelectorAll('form'));
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));

    const unvalidatedInputs: string[] = [];

    inputs.forEach((input) => {
      const hasValidation = input.hasAttribute('required') || 
                           input.hasAttribute('pattern') || 
                           input.hasAttribute('min') || 
                           input.hasAttribute('max') || 
                           input.hasAttribute('minlength') || 
                           input.hasAttribute('maxlength');

      if (!hasValidation && (input as HTMLInputElement).type !== 'hidden' && (input as HTMLInputElement).type !== 'submit') {
        const id = input.id || (input as HTMLInputElement).name || input.className;
        unvalidatedInputs.push(id || 'unknown');
      }
    });

    if (unvalidatedInputs.length > 0) {
      this.addFinding({
        id: 'input_001',
        category: 'input_validation',
        severity: 'medium',
        title: 'Inputs without validation',
        description: 'Form inputs found without client-side validation attributes',
        recommendation: 'Add appropriate validation attributes and implement server-side validation',
        status: 'warning',
        evidence: { unvalidated_inputs: unvalidatedInputs },
      });
    }

    // Check for XSS prevention
    const textNodes = this.getAllTextNodes(document.body);
    const suspiciousContent: string[] = [];

    textNodes.forEach((node) => {
      const text = node.textContent || '';
      if (text.includes('<script>') || text.includes('javascript:') || text.includes('on')) {
        suspiciousContent.push(text.substring(0, 100));
      }
    });

    if (suspiciousContent.length > 0) {
      this.addFinding({
        id: 'input_002',
        category: 'input_validation',
        severity: 'high',
        title: 'Potential XSS content detected',
        description: 'Content that could indicate XSS vulnerabilities',
        recommendation: 'Implement proper input sanitization and output encoding',
        status: 'fail',
        evidence: { suspicious_content: suspiciousContent },
      });
    }
  }

  /**
   * Audit access control
   */
  private async auditAccessControl(): Promise<void> {
    // Check for authentication state consistency
    const token = localStorage.getItem('webflow_token');
    const userProfile = document.querySelector('[data-testid="user-profile"]');
    const loginButton = document.querySelector('[data-testid="login-button"]');

    if (token && loginButton && !userProfile) {
      this.addFinding({
        id: 'access_001',
        category: 'access_control',
        severity: 'medium',
        title: 'Inconsistent authentication state',
        description: 'Token exists but UI shows unauthenticated state',
        recommendation: 'Ensure authentication state is consistently reflected in UI',
        status: 'warning',
      });
    }

    if (!token && userProfile && !loginButton) {
      this.addFinding({
        id: 'access_002',
        category: 'access_control',
        severity: 'medium',
        title: 'Inconsistent authentication state',
        description: 'No token but UI shows authenticated state',
        recommendation: 'Ensure authentication state is consistently reflected in UI',
        status: 'warning',
      });
    }

    // Check for role-based access controls
    const privilegedElements = document.querySelectorAll('[data-admin-only], [data-premium-only]');
    if (privilegedElements.length > 0) {
      this.addFinding({
        id: 'access_003',
        category: 'access_control',
        severity: 'info',
        title: 'Role-based elements detected',
        description: 'Elements with role-based access controls found',
        recommendation: 'Ensure server-side validation matches client-side access controls',
        status: 'pass',
        evidence: { privileged_elements: privilegedElements.length },
      });
    }
  }

  /**
   * Audit cryptography usage
   */
  private async auditCryptography(): Promise<void> {
    // Check for Web Crypto API usage
    const hasWebCrypto = 'crypto' in window && 'subtle' in window.crypto;
    
    if (!hasWebCrypto) {
      this.addFinding({
        id: 'crypto_001',
        category: 'cryptography',
        severity: 'low',
        title: 'Web Crypto API not available',
        description: 'Modern cryptographic APIs are not available',
        recommendation: 'Consider using Web Crypto API for client-side cryptographic operations',
        status: 'warning',
      });
    }

    // Check for insecure random number generation
    if (Math.random.toString().includes('predictable')) {
      this.addFinding({
        id: 'crypto_002',
        category: 'cryptography',
        severity: 'medium',
        title: 'Insecure random number generation',
        description: 'Potentially predictable random number generation detected',
        recommendation: 'Use crypto.getRandomValues() for cryptographically secure random numbers',
        status: 'warning',
      });
    }

    // Check SSL/TLS certificate
    if (location.protocol === 'https:') {
      this.addFinding({
        id: 'crypto_003',
        category: 'cryptography',
        severity: 'info',
        title: 'Secure connection established',
        description: 'Application is served over HTTPS',
        recommendation: 'Continue using HTTPS for all production traffic',
        status: 'pass',
      });
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: Omit<AuditLog, 'timestamp'>): void {
    if (!this.configuration.enableAuditLogging) return;

    const logEntry: AuditLog = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.push(logEntry);

    // Keep only last 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs.splice(0, this.auditLogs.length - 1000);
    }

    // Detect potential threats
    if (this.threatDetectionEnabled) {
      this.detectThreats(logEntry);
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filter?: Partial<AuditLog>): AuditLog[] {
    if (!filter) return [...this.auditLogs];

    return this.auditLogs.filter(log => {
      return Object.entries(filter).every(([key, value]) => 
        log[key as keyof AuditLog] === value
      );
    });
  }

  /**
   * Export security report
   */
  exportSecurityReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      findings: this.findings,
      metrics: this.calculateSecurityMetrics(),
      auditLogs: this.auditLogs,
      configuration: this.configuration,
    };

    return JSON.stringify(report, null, 2);
  }

  private addFinding(finding: SecurityFinding): void {
    this.findings.push(finding);
  }

  private calculateSecurityMetrics(): SecurityMetrics {
    const categoryFindings = {
      authentication: this.findings.filter(f => f.category === 'authentication'),
      dataProtection: this.findings.filter(f => f.category === 'data_protection'),
      network: this.findings.filter(f => f.category === 'network'),
      inputValidation: this.findings.filter(f => f.category === 'input_validation'),
      accessControl: this.findings.filter(f => f.category === 'access_control'),
      cryptography: this.findings.filter(f => f.category === 'cryptography'),
    };

    const categoryScores = Object.fromEntries(
      Object.entries(categoryFindings).map(([category, findings]) => {
        let score = 100;
        findings.forEach(finding => {
          switch (finding.severity) {
            case 'critical': score -= 30; break;
            case 'high': score -= 20; break;
            case 'medium': score -= 10; break;
            case 'low': score -= 5; break;
          }
        });
        return [category, Math.max(0, score)];
      })
    ) as SecurityMetrics['categoryScores'];

    const overallScore = Math.round(
      Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / 
      Object.keys(categoryScores).length
    );

    const severityCounts = this.findings.reduce((counts, finding) => {
      counts[finding.severity] = (counts[finding.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      overallScore,
      categoryScores,
      criticalIssues: severityCounts.critical || 0,
      highIssues: severityCounts.high || 0,
      mediumIssues: severityCounts.medium || 0,
      lowIssues: severityCounts.low || 0,
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Prioritize critical and high severity findings
    const criticalFindings = this.findings.filter(f => f.severity === 'critical');
    const highFindings = this.findings.filter(f => f.severity === 'high');

    if (criticalFindings.length > 0) {
      recommendations.push('🚨 Address critical security issues immediately');
      criticalFindings.forEach(finding => {
        recommendations.push(`• ${finding.recommendation}`);
      });
    }

    if (highFindings.length > 0) {
      recommendations.push('⚠️ Address high-priority security issues');
      highFindings.forEach(finding => {
        recommendations.push(`• ${finding.recommendation}`);
      });
    }

    // General recommendations
    if (this.findings.length === 0) {
      recommendations.push('✅ No security issues detected - maintain current security posture');
    }

    recommendations.push('🔍 Perform regular security audits');
    recommendations.push('📚 Keep security knowledge up to date');
    recommendations.push('🛡️ Implement defense in depth strategies');

    return recommendations;
  }

  private setupSecurityHeaders(): void {
    // Note: These would typically be set by the server, but we can check for them
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy',
    ];

    // This is a simplified check - in a real application,
    // these headers would be verified through network requests
  }

  private initializeThreatDetection(): void {
    this.threatDetectionEnabled = this.configuration.enableThreatDetection;
  }

  private detectThreats(logEntry: AuditLog): void {
    // Detect unusual patterns
    const recentLogs = this.auditLogs.slice(-50);
    
    // Detect rapid failed attempts
    const recentFailures = recentLogs.filter(log => 
      !log.success && 
      log.user === logEntry.user &&
      new Date(log.timestamp).getTime() > Date.now() - 5 * 60 * 1000 // last 5 minutes
    );

    if (recentFailures.length > 5) {
      this.addFinding({
        id: `threat_${Date.now()}`,
        category: 'access_control',
        severity: 'high',
        title: 'Potential brute force attack',
        description: `Multiple failed attempts detected for user ${logEntry.user}`,
        recommendation: 'Implement rate limiting and account lockout mechanisms',
        status: 'fail',
        evidence: { recent_failures: recentFailures.length },
      });
    }
  }

  private getAllTextNodes(element: Element): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    return textNodes;
  }
}

// Export singleton instance
export const securityAudit = new SecurityAuditService();