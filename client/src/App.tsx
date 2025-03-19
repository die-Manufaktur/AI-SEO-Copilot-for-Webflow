import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Home from "./pages/Home";
import WebflowAppWrapper from "./components/WebflowAppWrapper";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // Set the desired size for the extension UI
    const newSize = {width: 1140, height: 760}; // You can change this to "default," "comfortable," or provide { width, height }
    // Set the Extension UI size
    webflow.setExtensionSize(newSize).catch((error) => {
      console.error("Error setting extension size:", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WebflowAppWrapper>
        <Switch>
          <Route path="/" component={Home} />
        </Switch>
      </WebflowAppWrapper>
      <Toaster />
    </QueryClientProvider>
  );
}