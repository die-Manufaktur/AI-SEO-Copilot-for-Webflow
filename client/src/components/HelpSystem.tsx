import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  HelpCircle, 
  X, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  Lightbulb,
  Settings,
  Play,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useHelp } from '../contexts/HelpContext';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

interface HelpSystemProps {
  className?: string;
}

export const HelpSystem: React.FC<HelpSystemProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const {
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
    enableAutoDetection,
    registerHelpTarget,
    unregisterHelpTarget
  } = useHelp();

  // Categories
  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'seo', label: 'SEO Optimization', icon: Lightbulb },
    { id: 'webflow', label: 'Webflow Integration', icon: Settings },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertCircle }
  ];

  // Enable auto-detection on mount
  useEffect(() => {
    enableAutoDetection();
  }, [enableAutoDetection]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    if (searchQuery) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchHelp(searchQuery);
        setSearchResults(results);
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchHelp]);

  // Handle contextual help tooltips
  useEffect(() => {
    if (!isHelpEnabled) return;

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as Element;
      const helpId = target.getAttribute('data-help-id');
      if (helpId) {
        const help = getHelp(helpId);
        if (help) {
          setActiveTooltip(helpId);
          trackEvent('help_tooltip_shown', { helpId });
        }
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.getAttribute('data-help-id')) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
    };
  }, [isHelpEnabled, getHelp, trackEvent]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
    setSearchQuery('');
  };

  const handleArticleClick = (article: any) => {
    setSelectedArticle(article);
    trackEvent('help_article_viewed', {
      articleId: article.id,
      title: article.title,
      category: article.category
    });
  };

  const handleStartTutorial = (tutorialId: string) => {
    startTutorial(tutorialId);
    setIsOpen(false);
  };

  const currentTutorial = getCurrentTutorial();

  // Render contextual tooltip
  const renderTooltip = () => {
    if (!activeTooltip || !isHelpEnabled) return null;

    const help = getHelp(activeTooltip);
    if (!help) return null;

    const targetElement = document.querySelector(`[data-help-id="${activeTooltip}"]`);
    if (!targetElement) return null;

    const rect = targetElement.getBoundingClientRect();

    return (
      <div
        className="fixed z-50 max-w-xs p-3 bg-popover border rounded-lg shadow-lg"
        style={{
          top: rect.bottom + 8,
          left: rect.left,
          minWidth: '250px'
        }}
      >
        <h4 className="font-semibold text-sm mb-1">{help.title}</h4>
        <p className="text-xs text-muted-foreground mb-2">{help.content}</p>
        {help.tips && help.tips.length > 0 && (
          <ul className="text-xs space-y-1">
            {help.tips.slice(0, 2).map((tip, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // Render tutorial overlay
  const renderTutorial = () => {
    if (!currentTutorial) return null;

    const tutorial = {
      id: 'getting-started',
      title: 'Getting Started Tutorial',
      steps: [
        { title: 'Welcome', content: "Welcome to Roger's SEO Analysis Tool!" },
        { title: 'Enter Keywords', content: 'Start by entering your target keywords.' },
        { title: 'Run Analysis', content: 'Click "Analyze Page" to scan for SEO issues.' },
        { title: 'Review Results', content: 'Review the color-coded results.' },
        { title: 'Apply Recommendations', content: 'Click recommendations to apply them.' }
      ]
    };

    const currentStep = tutorial.steps[currentTutorial.currentStep];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="max-w-md p-6 bg-card border rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{tutorial.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={completeTutorial}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2">{currentStep.title}</h4>
            <p className="text-sm text-muted-foreground">{currentStep.content}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Step {currentTutorial.currentStep + 1} of {currentTutorial.totalSteps}
            </span>
            <div className="flex gap-2">
              {currentTutorial.currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousTutorialStep}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              {currentTutorial.currentStep < currentTutorial.totalSteps - 1 ? (
                <Button
                  size="sm"
                  onClick={nextTutorialStep}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={completeTutorial}
                >
                  Complete
                  <CheckCircle className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Help Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("fixed bottom-4 right-4 z-40", className)}
              onClick={() => setIsOpen(!isOpen)}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="ml-1">Help</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Get help and tutorials</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Help Center</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 px-4">
            {searchQuery && searchResults.length > 0 ? (
              // Search Results
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  Search Results
                </h3>
                {searchResults.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <h4 className="font-medium text-sm">{article.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.content}
                    </p>
                  </button>
                ))}
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              // No Results
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No help articles found for "{searchQuery}"
                </p>
              </div>
            ) : selectedArticle ? (
              // Article View
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedArticle.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedArticle.content}
                  </p>
                  {selectedArticle.tips && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Tips:</h4>
                      <ul className="space-y-1">
                        {selectedArticle.tips.map((tip: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedCategory ? (
              // Category Articles
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to categories
                </button>
                {getHelpByCategory(selectedCategory).map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <h4 className="font-medium text-sm">{article.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.content}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              // Main Menu
              <div className="space-y-4">
                {/* Tutorials */}
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">
                    Interactive Tutorials
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStartTutorial('getting-started')}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Play className="h-4 w-4" />
                        <span className="text-sm font-medium">Start Tutorial</span>
                      </div>
                      {isTutorialCompleted('getting-started') && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">
                    Help Topics
                  </h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <category.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{category.label}</span>
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <label
                htmlFor="help-toggle"
                className="text-sm font-medium"
              >
                Show contextual help
              </label>
              <Switch
                id="help-toggle"
                checked={isHelpEnabled}
                onCheckedChange={toggleHelp}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contextual Tooltip */}
      {renderTooltip()}

      {/* Tutorial Overlay */}
      {renderTutorial()}
    </>
  );
};