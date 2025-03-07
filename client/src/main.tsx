import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css'; // Ensure the path is correct

// Create a QueryClient instance
const queryClient = new QueryClient();

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
