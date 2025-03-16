import React from 'react';

const WebflowAppWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="webflow-react-app-wrapper">
      <style>{`
        /* CSS Reset and Base Styles */
        .webflow-react-app-wrapper * {
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Re-establish your CSS variables */
        .webflow-react-app-wrapper {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --primary: 221.2 83.2% 53.3%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --ring: 221.2 83.2% 53.3%;
          --radius: 0.5rem;
          
          /* Add your custom color variables that were missing */
          --background2: #f8f9fa;
          --background3: #f1f3f5;
          --primaryText: #0066FF;
          --redText: #ff4d4f;
          --yellowText: #faad14;
          --blueText: #1890ff;
          --greenText: #52c41a;
          
          /* Add any other variables your app needs */
          
          /* Ensure proper containment */
          contain: content;
          isolation: isolate;
        }

        /* Import fonts directly if needed */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        /* Target specific components that need fixing */
        .webflow-react-app-wrapper .progress-circle circle {
          transition: stroke-dashoffset 0.3s ease;
        }
        
        /* Fix SVG color inheritance */
        .webflow-react-app-wrapper svg {
          color: inherit;
          stroke: currentColor;
        }
        
        /* Ensure icons in specific components get proper colors */
        .webflow-react-app-wrapper button svg,
        .webflow-react-app-wrapper a svg,
        .webflow-react-app-wrapper .icon svg {
          color: currentColor;
        }
      `}</style>
      {children}
    </div>
  );
};

export default WebflowAppWrapper;