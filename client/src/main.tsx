import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

console.log("Main script executing");

try {
  const root = document.getElementById("root");
  
  if (!root) {
    console.error("Root element not found in DOM");
    document.body.innerHTML += "<div style='color:red;padding:20px;'>Error: Root element not found</div>";
  } else {
    console.log("Root element found, creating React root");
    const reactRoot = createRoot(root);
    reactRoot.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React rendered");
  }
} catch (error: unknown) {
  console.error("Error rendering React app:", error);
  document.body.innerHTML += `<div style='color:red;padding:20px;'>Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
}
