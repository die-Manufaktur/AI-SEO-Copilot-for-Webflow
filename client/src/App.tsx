import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Home from "./pages/Home";
import WebflowAppWrapper from "./components/WebflowAppWrapper";
import { useEffect } from "react";

export default function App() {
  console.log("App component mounting");

  useEffect(() => {
    console.log("App useEffect running");
    
    try {
      if (typeof window.webflow !== 'undefined') {
        console.log("Webflow API detected");
        if (typeof window.webflow.setExtensionSize === 'function') {
          console.log("Setting extension size");
          window.webflow.setExtensionSize({ width: 1140, height: 760 }).then(() => {
            console.log("Extension size set successfully");
          }).catch(err => {
            console.warn("Could not set extension size:", err);
          });
        } else {
          console.warn("webflow.setExtensionSize is not a function");
        }
      } else {
        console.log("Webflow API not detected, running in standalone mode");
      }
    } catch (error) {
      console.error("Error interacting with Webflow API:", error);
    }
  }, []);

  console.log("App rendering Home component");
  
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