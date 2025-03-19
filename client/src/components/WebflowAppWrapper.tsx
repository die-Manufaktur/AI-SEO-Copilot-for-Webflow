import React from "react";

// Remove any CSP meta tags that might be dynamically added here
export default function WebflowAppWrapper({ children }: { children: React.ReactNode }) {
  
  return (
    <div className="webflow-app-wrapper">
      {children}
    </div>
  );
}