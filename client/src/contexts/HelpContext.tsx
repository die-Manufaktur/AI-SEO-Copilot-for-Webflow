import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tips?: string[];
  relatedArticles?: string[];
  videoUrl?: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

interface TutorialStep {
  title: string;
  content: string;
  targetElement?: string;
  action?: 'click' | 'hover' | 'input';
}

interface TutorialProgress {
  id: string;
  currentStep: number;
  totalSteps: number;
  startedAt: number;
  completedAt?: number;
}

interface HelpAnalytics {
  articlesViewed: string[];
  searchQueries: string[];
  tutorialsCompleted: string[];
  totalViews: number;
  lastViewedAt?: number;
  effectiveness: {
    averageArticlesPerUser: number;
    tutorialCompletionRate: number;
    searchSuccessRate: number;
  };
}

interface HelpContextType {
  isHelpEnabled: boolean;
  toggleHelp: (enabled: boolean) => void;
  getHelp: (id: string) => HelpArticle | null;
  getHelpByCategory: (category: string) => HelpArticle[];
  searchHelp: (query: string) => Promise<HelpArticle[]>;
  startTutorial: (tutorialId: string) => void;
  nextTutorialStep: () => void;
  previousTutorialStep: () => void;
  completeTutorial: () => void;
  getCurrentTutorial: () => TutorialProgress | null;
  isTutorialCompleted: (tutorialId: string) => boolean;
  trackEvent: (event: string, data?: any) => void;
  getHelpAnalytics: () => HelpAnalytics;
  registerHelpTarget: (element: Element) => void;
  unregisterHelpTarget: (element: Element) => void;
  getActiveHelpTargets: () => string[];
  enableAutoDetection: () => void;
  disableAutoDetection: () => void;
}

const HelpContext = createContext<HelpContextType | null>(null);

// Help content database
const HELP_ARTICLES: HelpArticle[] = [
  // Getting Started
  {
    id: 'getting-started',
    title: "Getting Started with Roger's SEO Analysis Tool",
    content: "Welcome to Roger's SEO Analysis Tool for Webflow! This extension helps you optimize your Webflow pages for search engines.",
    category: 'getting-started',
    tips: [
      'Start by entering your target keywords',
      'Run an SEO analysis to identify issues',
      'Apply AI-powered recommendations with one click'
    ],
    relatedArticles: ['keyword-research', 'first-analysis']
  },
  {
    id: 'first-analysis',
    title: 'Running Your First Analysis',
    content: 'Learn how to run your first SEO analysis and understand the results.',
    category: 'getting-started',
    tips: [
      'Enter 1-3 target keywords',
      'Click "Analyze Page" button',
      'Review the color-coded results'
    ]
  },

  // SEO Optimization
  {
    id: 'page-title',
    title: 'Page Title',
    content: 'The page title appears in search results and browser tabs. It\'s one of the most important on-page SEO elements.',
    category: 'seo',
    tips: [
      'Keep it under 60 characters',
      'Include your primary keyword',
      'Make it compelling to click',
      'Place important words first'
    ]
  },
  {
    id: 'meta-description',
    title: 'Meta Description',
    content: 'The meta description appears under the title in search results. While not a direct ranking factor, it affects click-through rates.',
    category: 'seo',
    tips: [
      'Keep it between 120-160 characters',
      'Include target keywords naturally',
      'Write a compelling call-to-action',
      'Make it unique for each page'
    ]
  },
  {
    id: 'keyword-research',
    title: 'Keyword Research Basics',
    content: 'Understanding how to find and use the right keywords is essential for SEO success.',
    category: 'seo',
    tips: [
      'Use tools like Google Keyword Planner',
      'Focus on long-tail keywords',
      'Consider search intent',
      'Check competitor keywords'
    ],
    videoUrl: 'https://example.com/keyword-research-video'
  },
  {
    id: 'content-optimization',
    title: 'Content Optimization',
    content: 'Optimize your content to rank better for your target keywords while maintaining readability.',
    category: 'seo',
    tips: [
      'Use keywords naturally in content',
      'Include keywords in headings',
      'Aim for 300+ words of content',
      'Use related keywords and synonyms'
    ]
  },

  // Webflow Integration
  {
    id: 'webflow-collections',
    title: 'Optimizing CMS Collections',
    content: 'Learn how to optimize SEO for Webflow CMS collection pages.',
    category: 'webflow',
    tips: [
      'Set up SEO fields in your collection',
      'Use dynamic SEO titles and descriptions',
      'Create SEO-friendly URL structures',
      'Implement structured data'
    ]
  },
  {
    id: 'webflow-settings',
    title: 'Webflow SEO Settings',
    content: 'Configure your Webflow site settings for optimal SEO performance.',
    category: 'webflow',
    tips: [
      'Enable SSL certificate',
      'Set up 301 redirects properly',
      'Configure sitemap settings',
      'Enable auto-minification'
    ]
  },

  // Troubleshooting
  {
    id: 'common-issues',
    title: 'Common SEO Issues',
    content: 'Solutions to frequently encountered SEO problems in Webflow.',
    category: 'troubleshooting',
    tips: [
      'Check for duplicate content',
      'Verify robots.txt settings',
      'Fix broken internal links',
      'Resolve indexing issues'
    ]
  },
  {
    id: 'api-errors',
    title: 'API Connection Issues',
    content: 'Troubleshoot issues with OpenAI API connections and recommendations.',
    category: 'troubleshooting',
    tips: [
      'Verify API key is correct',
      'Check internet connection',
      'Review rate limit errors',
      'Contact support if issues persist'
    ]
  }
];

// Tutorials
const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started Tutorial',
    description: "Learn the basics of using Roger's SEO Analysis Tool",
    steps: [
      {
        title: 'Welcome',
        content: "Welcome to Roger's SEO Analysis Tool! This tutorial will guide you through the basics.",
        targetElement: '.help-button'
      },
      {
        title: 'Enter Keywords',
        content: 'Start by entering your target keywords in the input field.',
        targetElement: '[data-help-id="keywords-input"]',
        action: 'input'
      },
      {
        title: 'Run Analysis',
        content: 'Click the "Analyze Page" button to scan your page for SEO issues.',
        targetElement: '[data-help-id="analyze-button"]',
        action: 'click'
      },
      {
        title: 'Review Results',
        content: 'Review the analysis results. Green means good, yellow needs improvement, red requires attention.',
        targetElement: '.analysis-results'
      },
      {
        title: 'Apply Recommendations',
        content: 'Click on any recommendation to apply it directly to your page.',
        targetElement: '.recommendation-item',
        action: 'click'
      }
    ]
  },
  {
    id: 'advanced-optimization',
    title: 'Advanced SEO Optimization',
    description: 'Learn advanced techniques for better rankings',
    steps: [
      {
        title: 'Schema Markup',
        content: 'Add structured data to help search engines understand your content.',
        targetElement: '[data-help-id="schema-section"]'
      },
      {
        title: 'Content Analysis',
        content: 'Use the content intelligence feature to optimize your content.',
        targetElement: '[data-help-id="content-analysis"]'
      },
      {
        title: 'Batch Optimization',
        content: 'Optimize multiple pages at once using batch mode.',
        targetElement: '[data-help-id="batch-mode"]'
      }
    ]
  }
];

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHelpEnabled, setIsHelpEnabled] = useState(true);
  const [currentTutorial, setCurrentTutorial] = useState<TutorialProgress | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<HelpAnalytics>({
    articlesViewed: [],
    searchQueries: [],
    tutorialsCompleted: [],
    totalViews: 0,
    effectiveness: {
      averageArticlesPerUser: 0,
      tutorialCompletionRate: 0,
      searchSuccessRate: 0
    }
  });
  const [activeHelpTargets, setActiveHelpTargets] = useState<Set<string>>(new Set());
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    const savedHelpEnabled = localStorage.getItem('seo-copilot-help-enabled');
    if (savedHelpEnabled !== null) {
      setIsHelpEnabled(savedHelpEnabled === 'true');
    }

    const savedTutorials = localStorage.getItem('seo-copilot-completed-tutorials');
    if (savedTutorials) {
      setCompletedTutorials(JSON.parse(savedTutorials));
    }

    const savedAnalytics = localStorage.getItem('seo-copilot-help-analytics');
    if (savedAnalytics) {
      setAnalytics(JSON.parse(savedAnalytics));
    }

    // Load current tutorial progress
    const savedTutorialProgress = localStorage.getItem('seo-copilot-tutorial-progress');
    if (savedTutorialProgress) {
      try {
        const progress = JSON.parse(savedTutorialProgress);
        setCurrentTutorial(progress);
      } catch (error) {
        console.error('Failed to parse tutorial progress:', error);
        localStorage.removeItem('seo-copilot-tutorial-progress');
      }
    }
  }, []);

  // Cleanup MutationObserver on unmount
  useEffect(() => {
    return () => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
        mutationObserverRef.current = null;
      }
    };
  }, []);

  const toggleHelp = useCallback((enabled: boolean) => {
    setIsHelpEnabled(enabled);
    localStorage.setItem('seo-copilot-help-enabled', String(enabled));
  }, []);

  const getHelp = useCallback((id: string): HelpArticle | null => {
    return HELP_ARTICLES.find(article => article.id === id) || null;
  }, []);

  const getHelpByCategory = useCallback((category: string): HelpArticle[] => {
    return HELP_ARTICLES.filter(article => article.category === category);
  }, []);

  const searchHelp = useCallback(async (query: string): Promise<HelpArticle[]> => {
    const lowerQuery = query.toLowerCase();
    
    // Track search query
    setAnalytics(prev => ({
      ...prev,
      searchQueries: [...prev.searchQueries, query],
      lastViewedAt: Date.now()
    }));

    // Search in title and content
    const results = HELP_ARTICLES.filter(article => 
      article.title.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery) ||
      article.tips?.some(tip => tip.toLowerCase().includes(lowerQuery))
    ).map(article => {
      // Calculate relevance score
      let relevance = 0;
      if (article.title.toLowerCase().includes(lowerQuery)) relevance += 3;
      if (article.content.toLowerCase().includes(lowerQuery)) relevance += 1;
      if (article.tips?.some(tip => tip.toLowerCase().includes(lowerQuery))) relevance += 2;
      
      return { ...article, relevance };
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return results;
  }, []);

  const startTutorial = useCallback((tutorialId: string) => {
    const tutorial = TUTORIALS.find(t => t.id === tutorialId);
    if (tutorial) {
      const progress: TutorialProgress = {
        id: tutorialId,
        currentStep: 0,
        totalSteps: tutorial.steps.length,
        startedAt: Date.now()
      };
      setCurrentTutorial(progress);
      localStorage.setItem('seo-copilot-tutorial-progress', JSON.stringify(progress));
    }
  }, []);

  const nextTutorialStep = useCallback(() => {
    if (currentTutorial && currentTutorial.currentStep < currentTutorial.totalSteps - 1) {
      const updated = {
        ...currentTutorial,
        currentStep: currentTutorial.currentStep + 1
      };
      setCurrentTutorial(updated);
      localStorage.setItem('seo-copilot-tutorial-progress', JSON.stringify(updated));
    }
  }, [currentTutorial]);

  const previousTutorialStep = useCallback(() => {
    if (currentTutorial && currentTutorial.currentStep > 0) {
      const updated = {
        ...currentTutorial,
        currentStep: currentTutorial.currentStep - 1
      };
      setCurrentTutorial(updated);
      localStorage.setItem('seo-copilot-tutorial-progress', JSON.stringify(updated));
    }
  }, [currentTutorial]);

  const completeTutorial = useCallback(() => {
    if (currentTutorial) {
      setCompletedTutorials(prevCompleted => {
        const completed = [...prevCompleted, currentTutorial.id];
        localStorage.setItem('seo-copilot-completed-tutorials', JSON.stringify(completed));
        return completed;
      });
      
      // Track completion directly in analytics
      setAnalytics(prevAnalytics => {
        const updatedAnalytics = {
          ...prevAnalytics,
          tutorialsCompleted: [...prevAnalytics.tutorialsCompleted, currentTutorial.id],
          lastViewedAt: Date.now(),
          effectiveness: {
            ...prevAnalytics.effectiveness,
            tutorialCompletionRate: (prevAnalytics.tutorialsCompleted.length + 1) / TUTORIALS.length
          }
        };
        
        localStorage.setItem('seo-copilot-help-analytics', JSON.stringify(updatedAnalytics));
        return updatedAnalytics;
      });
      
      setCurrentTutorial(null);
      localStorage.removeItem('seo-copilot-tutorial-progress');
    }
  }, [currentTutorial]);

  const getCurrentTutorial = useCallback(() => currentTutorial, [currentTutorial]);

  const isTutorialCompleted = useCallback((tutorialId: string) => {
    return completedTutorials.includes(tutorialId);
  }, [completedTutorials]);

  const trackEvent = useCallback((event: string, data?: any) => {
    const updatedAnalytics = { ...analytics };
    
    switch (event) {
      case 'help_article_viewed':
        if (data?.articleId) {
          updatedAnalytics.articlesViewed.push(data.articleId);
          updatedAnalytics.totalViews++;
        }
        break;
      case 'help_search':
        if (data?.query) {
          updatedAnalytics.searchQueries.push(data.query);
        }
        break;
      case 'tutorial_completed':
        if (data?.tutorialId) {
          updatedAnalytics.tutorialsCompleted.push(data.tutorialId);
        }
        break;
    }
    
    // Calculate effectiveness metrics
    updatedAnalytics.effectiveness = {
      averageArticlesPerUser: updatedAnalytics.articlesViewed.length,
      tutorialCompletionRate: completedTutorials.length / TUTORIALS.length,
      searchSuccessRate: 0.75 // Placeholder - would track actual click-through
    };
    
    updatedAnalytics.lastViewedAt = Date.now();
    
    setAnalytics(updatedAnalytics);
    localStorage.setItem('seo-copilot-help-analytics', JSON.stringify(updatedAnalytics));
  }, [analytics, completedTutorials]);

  const getHelpAnalytics = useCallback(() => analytics, [analytics]);

  const registerHelpTarget = useCallback((element: Element) => {
    const helpId = element.getAttribute('data-help-id');
    if (helpId) {
      setActiveHelpTargets(prev => new Set(prev).add(helpId));
    }
  }, []);

  const unregisterHelpTarget = useCallback((element: Element) => {
    const helpId = element.getAttribute('data-help-id');
    if (helpId) {
      setActiveHelpTargets(prev => {
        const next = new Set(prev);
        next.delete(helpId);
        return next;
      });
    }
  }, []);

  const getActiveHelpTargets = useCallback(() => Array.from(activeHelpTargets), [activeHelpTargets]);

  const enableAutoDetection = useCallback(() => {
    if (!mutationObserverRef.current) {
      mutationObserverRef.current = new MutationObserver((mutations) => {
        const elementsToRegister: Element[] = [];
        
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              const helpTargets = node.querySelectorAll('[data-help-id]');
              helpTargets.forEach(element => elementsToRegister.push(element));
              if (node.hasAttribute('data-help-id')) {
                elementsToRegister.push(node);
              }
            }
          });
        });
        
        // Process all elements and update state immediately
        if (elementsToRegister.length > 0) {
          const helpIds = elementsToRegister
            .map(el => el.getAttribute('data-help-id'))
            .filter(Boolean) as string[];
          
          if (helpIds.length > 0) {
            // Use functional update to ensure state is updated correctly
            setActiveHelpTargets(prev => {
              const next = new Set(prev);
              helpIds.forEach(id => next.add(id));
              return next;
            });
          }
        }
      });

      mutationObserverRef.current.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }, []);

  const disableAutoDetection = useCallback(() => {
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }
  }, []);

  const value: HelpContextType = {
    isHelpEnabled,
    toggleHelp,
    getHelp,
    getHelpByCategory,
    searchHelp,
    startTutorial,
    nextTutorialStep,
    previousTutorialStep,
    completeTutorial,
    getCurrentTutorial,
    isTutorialCompleted,
    trackEvent,
    getHelpAnalytics,
    registerHelpTarget,
    unregisterHelpTarget,
    getActiveHelpTargets,
    enableAutoDetection,
    disableAutoDetection
  };

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};