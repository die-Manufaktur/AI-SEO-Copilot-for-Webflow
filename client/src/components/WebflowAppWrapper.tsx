import React, { useEffect } from "react";

export default function WebflowAppWrapper({ children }: { children: React.ReactNode }) {
  console.log("WebflowAppWrapper rendering with children:", children ? "Has children" : "No children");
  
  useEffect(() => {
    console.log("WebflowAppWrapper useEffect running");
    
    try {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.fontFamily = 'system-ui, sans-serif';
      document.body.style.backgroundColor = 'var(--background1, #1E1E1E)';
      document.body.style.color = 'var(--text1, #F5F5F5)';
      
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.height = '100%';
        rootElement.style.width = '100%';
      }
    } catch (error) {
      console.error("Error applying styles:", error);
    }
  }, []);
  
  // Add more visibility to make sure wrapper is rendering properly
  return (
    <div 
      id="webflow-app-wrapper"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1E1E1E',
        color: '#F5F5F5',
        overflow: 'auto'
      }}
    >
      {children ? (
        <>
          {/* Ensure children are visible */}
          {children}
        </>
      ) : (
        <div style={{padding: "20px", color: "red", border: "1px solid red"}}>
          No children provided to WebflowAppWrapper
        </div>
      )}
    </div>
  );
}