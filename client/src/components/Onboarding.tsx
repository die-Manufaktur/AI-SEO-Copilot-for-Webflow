import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Search,
  MousePointerClick,
  Zap,
  Key,
  BookOpen,
  X,
  RotateCcw
} from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';

interface OnboardingProps {
  showResetOption?: boolean;
}

export const Onboarding: React.FC<OnboardingProps> = ({ showResetOption = false }) => {
  const {
    currentStep,
    totalSteps,
    isComplete,
    shouldShowOnboarding,
    apiKey,
    completeStep,
    goToPreviousStep,
    skipOnboarding,
    resetOnboarding,
    setApiKey,
    validateApiKey,
    getStepInfo
  } = useOnboarding();

  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');
  const [apiKeyError, setApiKeyError] = useState('');
  const [demoKeywords, setDemoKeywords] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);

  // Handle reset option for returning users
  if (showResetOption && isComplete) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={resetOnboarding}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Restart Tour
      </Button>
    );
  }

  if (!shouldShowOnboarding) {
    return null;
  }

  const currentStepInfo = getStepInfo(currentStep);
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleApiKeySubmit = () => {
    if (!apiKeyInput) {
      completeStep(currentStep);
      return;
    }

    const validation = validateApiKey(apiKeyInput);
    if (!validation.isValid) {
      setApiKeyError(validation.error || 'Invalid API key format');
      return;
    }

    setApiKey(apiKeyInput);
    setApiKeyError('');
    completeStep(currentStep);
  };

  const handleDemoAnalyze = async () => {
    if (!demoKeywords.trim()) return;

    setIsAnalyzing(true);
    // Simulate analysis with shorter timeout for tests
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAnalyzing(false);
    setDemoComplete(true);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to AI SEO Copilot</h2>
              <p className="text-muted-foreground">
                Let's get you set up in just a few steps
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <Search className="h-8 w-8 mx-auto text-blue-500" />
                <p className="font-medium">SEO Analysis</p>
                <p className="text-xs text-muted-foreground">
                  18-point SEO check
                </p>
              </div>
              <div className="space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-purple-500" />
                <p className="font-medium">AI Recommendations</p>
                <p className="text-xs text-muted-foreground">
                  Smart suggestions
                </p>
              </div>
              <div className="space-y-2">
                <MousePointerClick className="h-8 w-8 mx-auto text-green-500" />
                <p className="font-medium">One-Click Apply</p>
                <p className="text-xs text-muted-foreground">
                  Direct to Webflow
                </p>
              </div>
            </div>
            <Button
              onClick={() => completeStep(currentStep)}
              className="w-full"
              size="lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 1: // API Key Setup
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">OpenAI API Key</h2>
              <p className="text-muted-foreground text-sm">
                Add your API key to enable AI-powered recommendations
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setApiKeyError('');
                  }}
                  className={cn(apiKeyError && "border-red-500")}
                />
                {apiKeyError && (
                  <p className="text-sm text-red-500">{apiKeyError}</p>
                )}
              </div>
              
              <Alert>
                <AlertDescription>
                  Don't have an API key? Get one from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    OpenAI Platform
                  </a>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => completeStep(currentStep)}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleApiKeySubmit}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        );

      case 2: // Features Overview
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Key Features</h2>
              <p className="text-muted-foreground text-sm">
                Here's what you can do with AI SEO Copilot
              </p>
            </div>

            <div className="space-y-3">
              <Card 
                data-testid="feature-card"
                className="animate-fade-in border-blue-200 dark:border-blue-800"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    SEO Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    Comprehensive 18-point SEO check including titles, meta descriptions,
                    headings, content structure, and more.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                data-testid="feature-card"
                className="animate-fade-in animation-delay-200 border-purple-200 dark:border-purple-800"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    Get smart, contextual recommendations powered by AI to improve
                    your content and SEO performance.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                data-testid="feature-card"
                className="animate-fade-in animation-delay-400 border-green-200 dark:border-green-800"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    One-Click Apply
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    Apply recommendations directly to your Webflow pages with a single
                    click. No copy-pasting required.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={() => completeStep(currentStep)}
              className="w-full"
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 3: // Interactive Demo
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Try It Yourself</h2>
              <p className="text-muted-foreground text-sm">
                Let's run a quick analysis to see how it works
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="demo-keywords">Enter Keywords</Label>
                <Input
                  id="demo-keywords"
                  placeholder="e.g., web design agency, UI/UX services"
                  value={demoKeywords}
                  onChange={(e) => setDemoKeywords(e.target.value)}
                  disabled={isAnalyzing || demoComplete}
                />
              </div>

              {!demoComplete ? (
                <Button
                  onClick={handleDemoAnalyze}
                  disabled={!demoKeywords.trim() || isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze
                    </>
                  )}
                </Button>
              ) : (
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium">Analysis Complete!</p>
                        <p className="text-sm text-muted-foreground">
                          Great job! You're ready to start optimizing.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(demoComplete || !demoKeywords) && (
                <Button
                  onClick={() => completeStep(currentStep)}
                  variant={demoComplete ? "default" : "outline"}
                  className="w-full"
                >
                  {demoComplete ? 'Continue' : 'Skip Demo'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );

      case 4: // Completion
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-muted-foreground">
                You're ready to start optimizing your Webflow pages
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => completeStep(currentStep)}
                className="w-full"
                size="lg"
              >
                Start Optimizing
                <Zap className="ml-2 h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a
                  href="https://docs.example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  View Documentation
                </a>
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isMobile = window.innerWidth < 640;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        data-testid="onboarding-modal"
        role="dialog"
        aria-label="Onboarding"
        className={cn(
          "bg-background border rounded-lg shadow-lg p-6",
          isMobile ? "max-w-full mx-4" : "max-w-2xl w-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <Progress 
              value={progress} 
              className="h-2"
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={skipOnboarding}
            className="ml-4"
          >
            <X className="h-4 w-4 mr-1" />
            Skip Tour
          </Button>
        </div>

        {/* Content */}
        <div className="min-h-[400px] flex items-center justify-center">
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        {currentStep > 0 && currentStep < 4 && (
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};