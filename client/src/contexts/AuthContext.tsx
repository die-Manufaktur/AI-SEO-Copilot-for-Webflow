/**
 * Authentication Context for Webflow OAuth
 * GREEN Phase: Minimal implementation to make tests pass
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { WebflowAuth } from '../lib/webflowAuth';
import type { WebflowOAuthToken, WebflowUser } from '../types/webflow-data-api';

export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error',
}

interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: WebflowUser | null;
  token: WebflowOAuthToken | null;
  status: AuthStatus;
  
  // Actions
  login: () => void;
  logout: () => void;
  hasPermission: (permission: string | string[]) => boolean;
  
  // Utils
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  webflowAuth?: WebflowAuth; // For testing
}

const WEBFLOW_CONFIG = {
  clientId: import.meta.env.VITE_WEBFLOW_CLIENT_ID || 'test-client-id',
  redirectUri: import.meta.env.VITE_WEBFLOW_REDIRECT_URI || 'http://localhost:1337/oauth/callback',
  scope: [
    'sites:read',
    'sites:write', 
    'cms:read',
    'cms:write',
    'pages:read',
    'pages:write'
  ],
};

const WORKER_BASE_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

export function AuthProvider({ children, webflowAuth: providedWebflowAuth }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [user, setUser] = useState<WebflowUser | null>(null);
  const [token, setToken] = useState<WebflowOAuthToken | null>(null);

  // Use refs for stable function dependencies
  const tokenRef = useRef<WebflowOAuthToken | null>(null);

  // Update ref when token changes
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Initialize WebflowAuth instance (use provided one for testing)
  const webflowAuth = useMemo(() => 
    providedWebflowAuth || new WebflowAuth(WEBFLOW_CONFIG), 
    [providedWebflowAuth]
  );

  // Fetch user info from Webflow API
  const fetchUserInfo = useCallback(async (authToken: WebflowOAuthToken, retries = 2): Promise<WebflowUser | null> => {
    try {
      const response = await fetch(`${WORKER_BASE_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${authToken.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status >= 500 && retries > 0) {
          // Retry on server errors
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserInfo(authToken, retries - 1);
        }
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserInfo(authToken, retries - 1);
      }
      throw error;
    }
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setStatus(AuthStatus.LOADING);
      
      // For Designer Extensions running within a logged-in Webflow Designer window,
      // authentication through OAuth may not be required since the extension 
      // can use Designer Extension APIs directly. However, we still check for
      // stored OAuth tokens for backwards compatibility.
      const validToken = await webflowAuth.getValidToken();
      
      if (!validToken) {
        // No stored OAuth token - this is expected for Designer Extensions
        // that use Designer APIs directly rather than Data API
        console.log('[AuthContext] No OAuth token found - Designer Extension will use Designer APIs directly');
        setStatus(AuthStatus.UNAUTHENTICATED);
        setUser(null);
        setToken(null);
        return;
      }

      setToken(validToken);

      // Fetch user info if we have a token
      try {
        const userInfo = await fetchUserInfo(validToken);
        setUser(userInfo);
        setStatus(AuthStatus.AUTHENTICATED);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setStatus(AuthStatus.ERROR);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setStatus(AuthStatus.ERROR);
      setUser(null);
      setToken(null);
    }
  }, [webflowAuth, fetchUserInfo]);

  // Initialize authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = useCallback(async () => {
    try {
      await webflowAuth.initiateOAuthFlow();
    } catch (error) {
      console.error('Login error:', error);
      setStatus(AuthStatus.ERROR);
    }
  }, [webflowAuth]);

  // Logout function
  const logout = useCallback(() => {
    webflowAuth.clearStoredToken();
    setStatus(AuthStatus.UNAUTHENTICATED);
    setUser(null);
    setToken(null);
  }, [webflowAuth]);

  // Check permissions - use ref for stable reference
  const hasPermission = useCallback((permission: string | string[]): boolean => {
    if (!tokenRef.current) {
      return false;
    }
    return webflowAuth.hasScope(tokenRef.current, permission);
  }, [webflowAuth]);

  // Refresh authentication
  const refreshAuth = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  // Derived state
  const isAuthenticated = status === AuthStatus.AUTHENTICATED;
  const isLoading = status === AuthStatus.LOADING;

  const contextValue = useMemo<AuthContextType>(() => ({
    // State
    isAuthenticated,
    isLoading,
    user,
    token,
    status,
    
    // Actions
    login,
    logout,
    hasPermission,
    
    // Utils
    refreshAuth,
  }), [
    isAuthenticated,
    isLoading,
    user,
    token,
    status,
    login,
    logout,
    hasPermission,
    refreshAuth,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}