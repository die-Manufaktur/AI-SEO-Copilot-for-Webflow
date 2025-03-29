# COPILOT EDITS OPERATIONAL GUIDELINES
                
## PRIME DIRECTIVE
	Avoid working on more than one file at a time.
	Multiple simultaneous edits to a file will cause corruption.
	Be chatting and teach about what you are doing while coding.

## LARGE FILE & COMPLEX CHANGE PROTOCOL

### MANDATORY PLANNING PHASE
	When working with large files (>300 lines) or complex changes:
		1. ALWAYS start by creating a detailed plan BEFORE making any edits
            2. Your plan MUST include:
                   - All functions/sections that need modification
                   - The order in which changes should be applied
                   - Dependencies between changes
                   - Estimated number of separate edits required
                
            3. Format your plan as:
## PROPOSED EDIT PLAN
	Working with: [filename]
	Total planned edits: [number]

### MAKING EDITS
	- Focus on one conceptual change at a time
	- Show clear "before" and "after" snippets when proposing changes
	- Include concise explanations of what changed and why
	- Always check if the edit maintains the project's coding style

### Edit sequence:
	1. [First specific change] - Purpose: [why]
	2. [Second specific change] - Purpose: [why]
	3. Do you approve this plan? I'll proceed with Edit [number] after your confirmation.
	4. WAIT for explicit user confirmation before making ANY edits when user ok edit [number]
            
### EXECUTION PHASE
	- After each individual edit, clearly indicate progress:
		"✅ Completed edit [#] of [total]. Ready for next edit?"
	- If you discover additional needed changes during editing:
	- STOP and update the plan
	- Get approval before continuing
                
### REFACTORING GUIDANCE
	When refactoring large files:
	- Break work into logical, independently functional chunks
	- Ensure each intermediate state maintains functionality
	- Consider temporary duplication as a valid interim step
	- Always indicate the refactoring pattern being applied
                
### RATE LIMIT AVOIDANCE
	- For very large files, suggest splitting changes across multiple sessions
	- Prioritize changes that are logically complete units
	- Always provide clear stopping points
            
## General Requirements
	Use modern technologies as described below for all code suggestions. Prioritize clean, maintainable code with appropriate comments.
	You may optimize the code but absolutely do not change how the app looks.
            
### Accessibility
	- Ensure compliance with **WCAG 2.1** AA level minimum, AAA whenever feasible.
	- Always suggest:
	- Labels for form fields.
	- Proper **ARIA** roles and attributes.
	- Adequate color contrast.
	- Alternative texts (`alt`, `aria-label`) for media elements.
	- Semantic HTML for clear structure.
	- Tools like **Lighthouse** for audits.
        
## Browser Compatibility
	- Prioritize feature detection (`if ('fetch' in window)` etc.).
        - Support latest two stable releases of major browsers:
	- Firefox, Chrome, Edge, Safari (macOS/iOS)
        - Emphasize progressive enhancement with polyfills or bundlers (e.g., **Babel**, **Vite**) as needed.
            
## HTML/CSS Requirements
	- **HTML**:
	- Use HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<search>`, etc.)
	- Include appropriate ARIA attributes for accessibility
	- Ensure valid markup that passes W3C validation
	- Use responsive design practices
	- Optimize images using modern formats (`WebP`, `AVIF`)
	- Include `loading="lazy"` on images where applicable
	- Generate `srcset` and `sizes` attributes for responsive images when relevant
	- Prioritize SEO-friendly elements (`<title>`, `<meta description>`, Open Graph tags)
            
	- **CSS**:
	- Use modern CSS features including:
	- CSS Grid and Flexbox for layouts
	- CSS Custom Properties (variables)
	- CSS animations and transitions
	- Media queries for responsive design
	- Logical properties (`margin-inline`, `padding-block`, etc.)
	- Modern selectors (`:is()`, `:where()`, `:has()`)
	- Follow BEM or similar methodology for class naming
	- Use CSS nesting where appropriate
	- Include dark mode support with `prefers-color-scheme`
	- Prioritize modern, performant fonts and variable fonts for smaller file sizes
	- Use modern units (`rem`, `vh`, `vw`) instead of traditional pixels (`px`) for better responsiveness
            
## JavaScript Requirements
		    
	- **Minimum Compatibility**: ECMAScript 2020 (ES11) or higher
	- **Features to Use**:
	- Arrow functions
	- Template literals
	- Destructuring assignment
	- Spread/rest operators
	- Async/await for asynchronous code
	- Classes with proper inheritance when OOP is needed
	- Object shorthand notation
	- Optional chaining (`?.`)
	- Nullish coalescing (`??`)
	- Dynamic imports
	- BigInt for large integers
	- `Promise.allSettled()`
	- `String.prototype.matchAll()`
	- `globalThis` object
	- Private class fields and methods
	- Export * as namespace syntax
	- Array methods (`map`, `filter`, `reduce`, `flatMap`, etc.)
	- **Avoid**:
	- `var` keyword (use `const` and `let`)
	- jQuery or any external libraries
	- Callback-based asynchronous patterns when promises can be used
	- Internet Explorer compatibility
	- Legacy module formats (use ES modules)
	- Limit use of `eval()` due to security risks
	- **Performance Considerations:**
	- Recommend code splitting and dynamic imports for lazy loading
	**Error Handling**:
	- Use `try-catch` blocks **consistently** for asynchronous and API calls, and handle promise rejections explicitly.
	- Differentiate among:
	- **Network errors** (e.g., timeouts, server errors, rate-limiting)
	- **Functional/business logic errors** (logical missteps, invalid user input, validation failures)
	- **Runtime exceptions** (unexpected errors such as null references)
	- Provide **user-friendly** error messages (e.g., “Something went wrong. Please try again shortly.”) and log more technical details to dev/ops (e.g., via a logging service).
	- Consider a central error handler function or global event (e.g., `window.addEventListener('unhandledrejection')`) to consolidate reporting.
	- Carefully handle and validate JSON responses, incorrect HTTP status codes, etc.

## TypeScript Requirements

- **Type Safety**:
    - Use strict type checking with `"strict": true` in tsconfig.json
    - Avoid using `any` type whenever possible, prefer explicit types
    - Leverage TypeScript's type inference where appropriate[^8]
    - Use discriminated unions instead of boolean flags for state management[^10]
    - Apply precise typing for props and state in React components[^10]
    - Implement proper error handling with typed error responses
- **TypeScript Features**:
    - Use interfaces for object shapes and API contracts[^8]
    - Leverage type aliases for unions, intersections, and complex types[^8]
    - Implement generics for reusable components and functions[^8]
    - Utilize built-in utility types (`Partial<T>`, `Readonly<T>`, `Pick<T>`, `Omit<T>`, etc.)[^8]
    - Apply type guards for runtime type checking (`instanceof`, `typeof`, user-defined guards)[^8]
    - Use mapped types and conditional types for advanced type transformations
    - Implement module augmentation when extending third-party types
- **Best Practices**:
    - Follow consistent naming conventions for types and interfaces
    - Write JSDoc comments to improve type inference and documentation[^8]
    - Use ESLint with TypeScript-specific rules to enforce code quality[^8]
    - Implement Prettier for consistent code formatting[^8]
    - Create barrel files judiciously, considering Vite's performance implications[^6]
    - Use TypeScript for unit and integration tests[^8]
- **Avoid**:
    - Type assertions (`as` keyword) when proper type guards can be used
    - Non-null assertions (`!`) when safer alternatives exist
    - Excessive type complexity that hinders readability
    - Namespace syntax (prefer ES modules)
    - Enums where string literal unions would suffice


## React Requirements

- **Component Architecture**:
    - Use functional components with hooks instead of class components[^11]
    - Follow single responsibility principle for components[^4]
    - Create reusable and modular components with focused responsibilities[^11]
    - Implement controlled components for form handling[^11]
    - Use React.memo, useMemo, and useCallback for performance optimization[^11]
    - Leverage code splitting and lazy loading with React.lazy and Suspense[^11]
- **State Management**:
    - Keep UI state separate from network/data state[^4]
    - Use appropriate state management solutions based on application size[^5]:
        - For small to medium apps: React Context + hooks or Zustand
        - For large enterprise applications: Redux (with Redux Toolkit and RTK Query)[^5]
    - Implement proper data fetching with React Query or similar solutions[^4]
    - Apply proper error and loading state handling
- **Performance Optimization**:
    - Implement virtualization for large lists and tables[^11]
    - Use code splitting based on routes and components[^11]
    - Apply memoization techniques to prevent unnecessary re-renders[^11]
    - Implement effective key strategies for list rendering
    - Consider server-side rendering for improved SEO and initial load performance[^11][^3]
- **Testing**:
    - Write comprehensive unit tests for components and hooks[^4][^11]
    - Implement integration tests for component interactions[^11]
    - Use end-to-end testing for critical user flows[^11]
    - Leverage testing libraries like Jest, React Testing Library, or Vitest[^4]
- **Avoid**:
    - Excessive prop drilling (use context or state management)
    - Direct DOM manipulation
    - Side effects in render functions
    - Inline function definitions in render methods
    - Complex state logic within components


## Vite Requirements

- **Project Setup**:
    - Use Vite's official scaffolding for React projects[^2]
    - Configure TypeScript integration with proper tsconfig settings
    - Implement SWC instead of Babel for faster compilation and HMR[^2][^9]
    - Set up proper ESLint and Prettier configuration[^8]
    - Configure proper path aliases for improved imports
- **Development Optimization**:
    - Leverage Vite's Hot Module Replacement (HMR) capabilities[^12]
    - Configure pre-bundling optimizations for dependencies (`optimizeDeps`)[^2][^9]
    - Use proper caching strategies for faster builds[^12]
    - Implement intelligent code splitting strategies[^12]
    - Consider alternatives to barrel files for improved performance[^6]
- **Build Configuration**:
    - Set up proper production build optimization[^2][^7]
    - Configure code splitting and chunking strategies[^3]
    - Implement tree-shaking for unused code elimination[^8]
    - Set up proper asset handling and optimization
    - Configure appropriate browser compatibility targets
- **Performance Features**:
    - Implement lazy loading for routes and components[^3][^12]
    - Use dynamic imports for code splitting[^3]
    - Configure proper caching strategies for assets[^12]
    - Implement WebAssembly support for performance-critical operations when needed[^3]
    - Set up server-side rendering (SSR) or static site generation (SSG) where appropriate[^3]
- **Plugins and Extensions**:
    - Integrate only necessary Vite plugins to avoid bloat
    - Configure plugins for optimized asset handling
    - Set up proper PostCSS and CSS pre-processor integration
    - Implement PWA capabilities when required[^12]
    - Configure visualization tools for bundle analysis
- **Avoid**:
    - Unnecessary dependencies that increase bundle size
    - Complex webpack configurations ported directly to Vite[^7]
    - CommonJS imports (use ES modules instead)[^12]
    - Excessive plugin usage that slows down build time
    - Ignoring build warnings and performance recommendations

## Webflow
- Never use webflow.
- Always use the official Webflow Designer API or Webflow Data API

## Folder Structure
	Follow this structured directory layout:

		project-root/
		├── api/                  # API handlers and routes
		├── config/               # Configuration files and environment variables
		├── data/                 # Databases, JSON files, and other storage
		├── public/               # Publicly accessible files (served by web server)
		│   ├── assets/
		│   │   ├── css/
		│   │   ├── js/
		│   │   ├── images/
		│   │   ├── fonts/
		│   └── index.html
		├── src/                  # Application source code
		│   ├── controllers/
		│   ├── models/
		│   ├── views/
		│   └── utilities/
		├── tests/                # Unit and integration tests
		├── docs/                 # Documentation (Markdown files)
		├── logs/                 # Server and application logs
		├── scripts/              # Scripts for deployment, setup, etc.
		└── temp/                 # Temporary/cache files


## Documentation Requirements
	- Include JSDoc comments for JavaScript/TypeScript.
	- Document complex functions with clear examples.
	- Maintain concise Markdown documentation.
	- Minimum docblock info: `param`, `return`, `throws`, `author`
    
## Database Requirements (SQLite 3.46+)
	- Leverage JSON columns, generated columns, strict mode, foreign keys, check constraints, and transactions.
    
## Security Considerations
	- Sanitize all user inputs thoroughly.
	- Parameterize database queries.
	- Enforce strong Content Security Policies (CSP).
	- Use CSRF protection where applicable.
	- Ensure secure cookies (`HttpOnly`, `Secure`, `SameSite=Strict`).
	- Limit privileges and enforce role-based access control.
	- Implement detailed internal logging and monitoring.

## Sources
Use these to understand proper usage and structure.
https://developers.webflow.com/designer/reference/introduction
https://developers.webflow.com/designer/docs/getting-started-designer-extensions
https://developers.webflow.com/designer/reference/webflow-cli
https://developers.webflow.com/designer/reference/app-structure
https://developers.webflow.com/designer/reference/app-settings
https://developers.webflow.com/designer/reference/error-handling
https://developers.webflow.com/designer/reference/app-modes
https://developers.webflow.com/designer/reference/app-intents-and-connections
https://developers.webflow.com/designer/reference/get-site-info
https://developers.webflow.com/designer/reference/resize-extension
https://developers.webflow.com/designer/reference/get-users-designer-capabilities
https://developers.webflow.com/designer/reference/get-launch-context
https://developers.webflow.com/designer/reference/notify-user
https://developers.webflow.com/designer/reference/user-changes-current-page
https://developers.webflow.com/designer/reference/get-all-assets
https://developers.webflow.com/designer/reference/get-alt-text
https://developers.webflow.com/designer/reference/get-asset-mime-type
https://developers.webflow.com/designer/reference/get-all-pages-and-folders
https://developers.webflow.com/designer/reference/get-page-title
https://developers.webflow.com/designer/reference/get-page-slug
https://developers.webflow.com/designer/reference/get-page-description
https://developers.webflow.com/designer/reference/get-page-publish-path
https://developers.webflow.com/designer/reference/get-utility-page-key
https://developers.webflow.com/designer/reference/get-search-title
https://developers.webflow.com/designer/reference/check-if-page-uses-title-as-search-title
https://developers.webflow.com/designer/reference/get-search-description
https://developers.webflow.com/designer/reference/check-description-is-used-as-search-description
https://developers.webflow.com/designer/reference/get-search-image
https://developers.webflow.com/designer/reference/check-if-page-is-excluded-from-search
https://www.npmjs.com/package/@webflow/designer-extension-typings?activeTab=code
https://developers.webflow.com/designer/reference/get-open-graph-title
https://developers.webflow.com/designer/reference/uses-title-as-open-graph-title
https://developers.webflow.com/designer/reference/get-open-graph-description
https://developers.webflow.com/designer/reference/uses-description-as-open-graph-description
https://developers.webflow.com/designer/reference/get-open-graph-image
https://developers.webflow.com/designer/reference/get-folder-name
https://developers.webflow.com/designer/reference/get-folder-slug