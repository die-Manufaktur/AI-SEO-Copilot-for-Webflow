import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Home from "./pages/Home";
import WebflowAppWrapper from "./components/WebflowAppWrapper";
import { getPageSlug } from "./lib/get-page-slug";
// import { fetchOAuthToken } from "./lib/api";

// const isDevelopment = process.env.NODE_ENV === 'development';

export default function App() {
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // let oauthToken = localStorage.getItem('oauthToken');

        // if (isDevelopment) {
        //   // Use a mock token in development mode
        //   oauthToken = 'mock-access-token';
        // } else {
        //   // Step 1: Handle OAuth authorization
        //   const urlParams = new URLSearchParams(window.location.search);
        //   const authCode = urlParams.get('code');
        //   if (authCode) {
        //     oauthToken = await fetchOAuthToken(authCode);
        //     localStorage.setItem('oauthToken', oauthToken);
        //     window.history.replaceState({}, document.title, "/");
        //   } else if (!oauthToken) {
        //     throw new Error('Authorization code not found');
        //   }
        // }

        // setToken(oauthToken);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Critical failure: Unable to determine page slug.");
      }
    }
    initialize();
  }, []);

  // Critically fail if the slug cannot be determined.
  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>Critical Error: {error}</div>;
  }

  // Continue with the rest of your app, using the slug as needed.
  return (
    <QueryClientProvider client={queryClient}>
      <WebflowAppWrapper>
        <Home />
      </WebflowAppWrapper>
      <Toaster />
    </QueryClientProvider>
  );
}