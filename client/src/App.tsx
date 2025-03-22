import React from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Home from "./pages/Home";
import WebflowAppWrapper from "./components/WebflowAppWrapper";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebflowAppWrapper>
        <Home />
      </WebflowAppWrapper>
      <Toaster />
    </QueryClientProvider>
  );
}