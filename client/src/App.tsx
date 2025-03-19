import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Home from "./pages/Home";
import WebflowAppWrapper from "./components/WebflowAppWrapper";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    try {
      if (typeof window.webflow !== 'undefined') {
        if (typeof window.webflow.setExtensionSize === 'function') {
          window.webflow.setExtensionSize({ width: 1140, height: 760 }).catch(err => {
            console.warn("Could not set extension size:", err);
          });
        }
      }
    } catch (error) {
      console.error("Error interacting with Webflow API:", error);
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <WebflowAppWrapper>
        {/* Render Home component directly to bypass routing */}
        <Home />
      </WebflowAppWrapper>
      <Toaster />
    </QueryClientProvider>
  );
}