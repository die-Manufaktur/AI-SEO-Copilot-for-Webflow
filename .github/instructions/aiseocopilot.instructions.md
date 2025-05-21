AI SEO Copilot Development Guide
Project Overview
AI SEO Copilot is a Webflow extension that performs comprehensive SEO analysis on webpages with AI-powered recommendations. The project consists of:

React frontend (client folder)
Cloudflare Workers backend (workers folder)
Shared libraries for common functionality (shared folder)
Development Workflow
Core Principles
Test-Driven Development: Always write tests before implementing new features
Code Reuse: Prefer existing methods/utilities over creating new ones
Type Safety: Use TypeScript types/interfaces consistently
Separation of Concerns: Keep UI, business logic, and API calls separate
When Adding New Features
Write test(s) first
Implement the feature
Verify tests pass
Refactor as needed while maintaining test coverage
Technology Stack Best Practices
TypeScript
Use strict typing with interfaces/types for all data structures
Leverage union types for values with finite possibilities
Use type guards for runtime type checking
Export shared types from the types directory

// Good example
interface SEOCheck {
  title: string;
  description: string;
  passed: boolean;
  priority: 'high' | 'medium' | 'low';
}

// Avoid
interface SEOCheck {
  title: string;
  description: string;
  passed: boolean;
  priority: string; // Too generic
}

React
Use functional components with hooks
Extract reusable UI components to components/ui directory
Extract complex logic to custom hooks in hooks directory
Use the existing utils (e.g., cn() for class name merging)

// Good example
export function MyComponent({ data }: { data: MyData }) {
  const { state, setState } = useState<State>(initialState);
  
  useEffect(() => {
    // Side effect logic
  }, [dependencies]);

  return (
    <div className={cn("base-classes", condition && "conditional-class")}>
      {/* Component JSX */}
    </div>
  );
}

// Avoid direct DOM manipulation, class components
Testing
Use Vitest for unit and component testing
Use React Testing Library for component testing
Mock external dependencies (API calls, Webflow API)
Test edge cases and error handling
CSS/Styling
Use Tailwind CSS utility classes via the cn() utility
Follow the existing design system for colors and spacing
For complex styling, use styled-components as demonstrated in the codebase

// Good example - using cn() utility
<div className={cn(
  "p-4 rounded-md", 
  isActive ? "bg-background3" : "bg-background2"
)}>

// For more complex components, use styled-components
const StyledComponent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

API Integration
Use the existing api.ts utilities for API calls
Handle errors consistently with proper error messages
Use React Query for data fetching where applicable
Cloudflare Workers
Follow the Hono.js pattern for API routes
Implement proper CORS handling
Include appropriate error handling and logging
Keep worker size minimal

Project Structure
Common Utilities
Prefer using these existing utilities:

cn(): For className composition (from utils.ts)
createLogger(): For namespaced logging (from utils.ts)
calculateSEOScore(): For determining SEO score (from seoUtils.ts)
getApiBaseUrl(): For API endpoint resolution (from api.ts)
copyToClipboard(): For clipboard operations (from Home.tsx)
Testing Guidelines
Component Testing
Test rendering without errors
Test interactions (clicks, form submissions)
Test conditional rendering
Test error states
Verify accessibility concerns

// Example component test
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders without errors', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<MyComponent />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Result after click')).toBeInTheDocument();
  });
});

Utility Testing
Test normal operation
Test edge cases
Test error handling
Mock dependencies when needed
Adding New Features
First, check if the functionality already exists in a utility or component
Write tests for the new functionality
Implement the feature using existing patterns and utilities
Ensure all tests pass
Update documentation if needed
Conclusion
When developing for the AI SEO Copilot project:
Start with tests
Reuse existing code wherever possible
Follow the established patterns and best practices
Maintain strict typing with TypeScript
Keep the UI components clean and focused
By following these guidelines, we'll maintain high code quality, good test coverage, and consistent development patterns across the project.