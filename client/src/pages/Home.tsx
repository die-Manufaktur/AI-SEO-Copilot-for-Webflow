import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import confetti from 'canvas-confetti';
import { Card, CardContent, CardHeader, CardTitle as OriginalCardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  AlertTriangle,
  CircleAlert,
  Info,
  ChevronLeft,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useToast } from "../hooks/use-toast";
import { analyzeSEO } from "../lib/api";
import type { SEOCheck, SEOAnalysisResult, WebflowPageData, AnalyzeSEORequest } from "../lib/types";
import { ProgressCircle } from "../components/ui/progress-circle";
import { getLearnMoreUrl } from "../lib/docs-links";
import styled from 'styled-components';
import Footer from "../components/Footer";
import { createLogger } from "./../lib/utils";
import React from 'react';
import { calculateSEOScore } from '../../../shared/utils/seoUtils';
import { ImageSizeDisplay } from "../components/ImageSizeDisplay";
import { copyTextToClipboard } from "../utils/clipboard";
import { shouldShowCopyButton } from '../../../shared/utils/seoUtils';
import { generatePageId, saveKeywordsForPage, loadKeywordsForPage } from '../utils/keywordStorage';
import { saveAdvancedOptionsForPage, loadAdvancedOptionsForPage, type AdvancedOptions } from '../utils/advancedOptionsStorage';
import sanitizeHtml from 'sanitize-html';
import { sanitizeText } from '../../../shared/utils/stringUtils';

const logger = createLogger("Home");

// Page type options for the dropdown
const PAGE_TYPES = [
  'Homepage',
  'Category page',
  'Product page',
  'Blog post',
  'Landing page',
  'Contact page',
  'About page',
  'FAQ page',
  'Service page',
  'Portfolio/project page',
  'Testimonial page',
  'Location page',
  'Legal page',
  'Event page',
  'Press/News page',
  'Job/career page',
  'Thank you page',
  'Pillar page',
  'Cluster page'
];

const formSchema = z.object({
  keyphrase: z.string().min(2, "Keyphrase must be at least 2 characters")
});

// Additional context validation
const MAX_CONTEXT_LENGTH = 2000;
const validateAdditionalContext = (input: string): { isValid: boolean; message?: string; sanitized: string } => {
  if (!input) return { isValid: true, sanitized: '' };
  
  // Check for excessive length
  if (input.length > MAX_CONTEXT_LENGTH) {
    return { 
      isValid: false, 
      message: `Context too long. Maximum ${MAX_CONTEXT_LENGTH} characters allowed.`,
      sanitized: input.substring(0, MAX_CONTEXT_LENGTH)
    };
  }

  // Check for script tags and other dangerous content
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input)) {
    return { 
      isValid: false, 
      message: 'Script tags are not allowed in context.',
      sanitized: sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    };
  }

  // Check for HTML event handlers
  if (/<[^>]*on\w+\s*=/gi.test(input)) {
    return { 
      isValid: false, 
      message: 'HTML event handlers are not allowed.',
      sanitized: sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    };
  }

  // Sanitize the input
  const sanitized = sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });

  // Apply additional text sanitization
  const finalSanitized = sanitizeText(sanitized).trim();

  return { isValid: true, sanitized: finalSanitized };
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const iconAnimation = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20
    }
  }
};

// Get priority icon based on priority level
export const getPriorityIcon = (priority: string, className: string = "h-4 w-4") => {
  switch (priority) {
    case 'high':
      return <AlertTriangle className={`${className} text-redText`} style={{color: 'var(--redText)', stroke: 'var(--redText)'}} />;
    case 'medium':
      return <CircleAlert className={`${className} text-yellowText`} style={{color: 'var(--yellowText)', stroke: 'var(--yellowText)'}} />;
    case 'low':
      return <Info className={`${className} text-blueText`} style={{color: 'var(--blueText)', stroke: 'var(--blueText)'}} />;
    default:
      return null;
  }
};

// Get priority text based on priority level
export const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high':
      return "High Priority";
    case 'medium':
      return "Medium Priority";
    case 'low':
      return "Low Priority";
    default:
      return "";
  }
};

// Group checks by category
const groupChecksByCategory = (checks: SEOCheck[]) => {
  const categories = {
    "Meta SEO": ["Keyphrase in Title", "Keyphrase in Meta Description", "Keyphrase in URL", "OG Title and Description"],
    "Content Optimisation": ["Content Length", "Keyphrase Density", "Keyphrase in Introduction", "Keyphrase in H1 Heading", "Keyphrase in H2 Headings", "Heading Hierarchy"],
    "Links": ["Internal Links", "Outbound Links"],
    "Images and Assets": ["Image Alt Attributes", "Next-Gen Image Formats", "OG Image", "Image File Size"],
    "Technical SEO": ["Code Minification", "Schema Markup"]
  };

  const grouped: Record<string, SEOCheck[]> = {};

  // Initialize all categories
  Object.keys(categories).forEach(category => {
    grouped[category] = [];
  });

  // Group checks by category with fuzzy matching
  checks.forEach(check => {
    for (const category in categories) {
      if (categories[category as keyof typeof categories].includes(check.title)) {
        grouped[category].push(check);
        break;
      }
    }
  });

  return grouped;
};

// Helper function to fetch page info
const fetchPageInfo = async (
  setSlug: React.Dispatch<React.SetStateAction<string | null>>,
  setIsHomePage: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    if (webflow) {
      const currentPage = await webflow.getCurrentPage();
      // We still need these for basic page identification
      const currentSlug = await currentPage.getSlug();
      const isHome = await currentPage.isHomepage();
      setSlug(currentSlug);
      setIsHomePage(isHome);
    } else {
      console.warn("Webflow API not available for fetching page info.");
      setSlug(null);
      setIsHomePage(false);
    }
  } catch (error) {
    console.error("Error fetching page info:", error);
    setSlug(null);
    setIsHomePage(false);
  }
};


// Get status for a category
const getCategoryStatus = (checks: SEOCheck[]) => {
  if (!checks || checks.length === 0) return "neutral";

  const passedCount = checks.filter(check => check.passed).length;

  if (passedCount === checks.length) return "complete";
  if (passedCount === 0) return "todo";
  return "inprogress";
};

// Get status icon for a category
const getCategoryStatusIcon = (status: string) => {
  switch (status) {
    case "complete":
      return <CheckCircle className="h-6 w-6 text-greenText" style={{color: 'var(--greenText)', stroke: 'var(--greenText)'}} />;
    case "inprogress":
      return <CircleAlert className="h-6 w-6 text-yellowText" style={{color: 'var(--yellowText)', stroke: 'var(--yellowText)'}} />;
    case "todo":
      return <XCircle className="h-6 w-6 text-redText" style={{color: 'var(--redText)', stroke: 'var(--redText)'}} />;
    default:
      return <Info className="h-6 w-6 text-blueText" style={{color: 'var(--blueText)', stroke: 'var(--blueText)'}} />;
  }
};

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
  gap: 8px; /* Add some spacing between the chevron and title */

  &:focus {
    outline: 2px solid var(--primaryText); /* Add focus styling for accessibility */
    outline-offset: 2px;
  }
`;

const CardTitle = styled.h2`
  font-size: 20px;
  margin: 0;
  font-weight: 500;
`;

// Helper function to find the most recently published domain
const getMostRecentlyPublishedDomain = (domains: WebflowDomain[]): WebflowDomain | null => {
  if (!domains || domains.length === 0) {
    return null;
  }

  return domains.reduce((latest, current) => {
    if (!current.lastPublished) return latest; // Ignore domains never published
    if (!latest || !latest.lastPublished) return current; // If latest wasn't published, current is newer

    const latestDate = new Date(latest.lastPublished);
    const currentDate = new Date(current.lastPublished);

    return currentDate > latestDate ? current : latest;
  }, null as WebflowDomain | null); // Start with null
};

// Helper function to get text rating based on score
const getScoreRatingText = (score: number): string => {
  if (score >= 91) return "Excellent - Your site is highly optimized! Keep up the great work.";
  if (score >= 76) return "Very Good - Your SEO is strong! Just a few tweaks can make it even better.";
  if (score >= 61) return "Good - You're on the right track! Focus on key refinements to improve further.";
  if (score >= 41) return "Fair - A solid start! Addressing key SEO areas will boost your rankings.";
  if (score >= 21) return "Needs Work - There's potential! Improving key areas will make a big impact.";
  return "Poor - No worries! Focus on essential fixes to see quick improvements.";
};

export default function Home() {
  const { toast } = useToast();
  // Using underscore prefix for state variables that are set but not directly read
  const [_isLoading, setIsLoading] = useState(false);
  const [_slug, setSlug] = useState<string | null>(null);
  const [isHomePage, setIsHomePage] = useState<boolean>(false);
  const [results, setResults] = useState<SEOAnalysisResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stagingName, setStagingName] = useState<string>('');
  const [_urls, setUrls] = useState<string[]>([]);
  const [showedPerfectScoreMessage, setShowedPerfectScoreMessage] = useState<boolean>(false);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [keywordSaveStatus, setKeywordSaveStatus] = useState<'saved' | 'saving' | 'none'>('none');
  
  // Advanced options state
  const [advancedOptionsEnabled, setAdvancedOptionsEnabled] = useState<boolean>(false);
  const [pageType, setPageType] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [additionalContextError, setAdditionalContextError] = useState<string>('');
  const [advancedOptionsSaveStatus, setAdvancedOptionsSaveStatus] = useState<'saved' | 'saving' | 'none'>('none');
  
  const seoScore = results ? calculateSEOScore(results.checks) : 0;
  const scoreRating = getScoreRatingText(seoScore);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      const success = await copyTextToClipboard(text);
      
      if (success) {
        toast({
          title: "Copied!",
          description: "The recommendation has been copied to your clipboard.",
        });
        return true;
      } else {
        // Show manual copy instructions if automation fails
        toast({
          title: "Clipboard access denied",
          description: "Please press Ctrl+C (Cmd+C on Mac) to copy the selected text.",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      console.error("Error in clipboard operation:", err);
      toast({
        title: "Unable to copy",
        description: "Please select the text manually and copy.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Valid origin check - in production, only allow Webflow origins
      if (import.meta.env.PROD) {
        if (!event.origin.endsWith('.webflow.io')) {
          return;
        }
      } else {
        // Development: allow localhost and Webflow origins
        const isDev = event.origin.includes('localhost') || event.origin.includes('127.0.0.1');
        const isWebflow = event.origin.endsWith('.webflow.io');
        if (!isDev && !isWebflow) {
          return;
        }
      }

      if (event.data.name === 'copyToClipboard' || event.data.type === 'clipboardCopy') {
        const text = event.data.data || event.data.text;
        copyToClipboard(text)
          .then(success => {
            logger.info("Copy result:", success ? "success" : "failed");
          })
          .catch(error => {
            console.error("Copy error:", error);
          });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    toast({
      title: "SEO Analyzer Ready",
      description: "Enter your target keyphrase to begin analysis",
      duration: 5000
    });
  }, []);

  useEffect(() => {
    // Store the current page path to detect actual changes
    let currentPagePath: string | null = null;
    
    // Check if webflow is available before proceeding
    if (!webflow) {
      console.warn("Webflow API not available");
      return;
    }
    
    // Initialize on mount
    const initCurrentPage = async () => {
      try {
        const page = await webflow.getCurrentPage();
        currentPagePath = await page.getPublishPath();
      } catch (error) {
        console.error("Failed to get initial page path:", error);
      }
    };
    initCurrentPage();
    
    const unsubscribe = webflow.subscribe('currentpage', async () => {
      try {
        // Get the new page
        const newPage = await webflow.getCurrentPage();
        const newPagePath = await newPage.getPublishPath();
        
        // Only reload if the page path has actually changed
        if (newPagePath !== currentPagePath) {
          currentPagePath = newPagePath;
          logger.info(`Page changed to: ${newPagePath} - reloading app`);
          
          // Give Webflow a moment to complete the page change
          setTimeout(() => {
            window.location.reload();
          }, 300); // Slightly longer delay for stability
        }
      } catch (error) {
        console.error("Error handling page change:", error);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (results && seoScore === 100 && !showedPerfectScoreMessage) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });

      setShowedPerfectScoreMessage(true);
    }
  }, [results, seoScore, showedPerfectScoreMessage, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyphrase: ""
    }
  });

  // Load saved keywords when page context is available
  useEffect(() => {
    const initializePageKeywords = async () => {
      try {
        const page = await webflow.getCurrentPage();
        const publishPath = await page.getPublishPath();
        const isHomepage = await page.isHomepage();
        
        const pageId = generatePageId(publishPath, isHomepage);
        setCurrentPageId(pageId);
        
        // Load saved keywords for this page
        const savedKeywords = loadKeywordsForPage(pageId);
        if (savedKeywords) {
          form.setValue('keyphrase', savedKeywords);
          setKeywordSaveStatus('saved');
        } else {
          setKeywordSaveStatus('none');
        }
        
        // Load saved advanced options for this page
        const savedAdvancedOptions = loadAdvancedOptionsForPage(pageId);
        if (savedAdvancedOptions.pageType || savedAdvancedOptions.additionalContext) {
          setPageType(savedAdvancedOptions.pageType);
          setAdditionalContext(savedAdvancedOptions.additionalContext);
          setAdvancedOptionsEnabled(true);
          setAdvancedOptionsSaveStatus('saved');
        } else {
          setPageType('');
          setAdditionalContext('');
          setAdvancedOptionsEnabled(false);
          setAdvancedOptionsSaveStatus('none');
        }
      } catch (error) {
        console.warn('Failed to initialize page keywords:', error);
      }
    };

    if (webflow) {
      initializePageKeywords();
    }
  }, [form]);

  // Watch for keyphrase changes to update save status
  const watchedKeyphrase = form.watch('keyphrase');
  useEffect(() => {
    if (currentPageId) {
      const savedKeywords = loadKeywordsForPage(currentPageId);
      if (watchedKeyphrase === savedKeywords && watchedKeyphrase) {
        setKeywordSaveStatus('saved');
      } else if (watchedKeyphrase && watchedKeyphrase !== savedKeywords) {
        setKeywordSaveStatus('none');
      } else if (!watchedKeyphrase) {
        setKeywordSaveStatus('none');
      }
    }
  }, [watchedKeyphrase, currentPageId]);

  // Watch for advanced options changes to update save status
  useEffect(() => {
    if (currentPageId && advancedOptionsEnabled) {
      const savedAdvancedOptions = loadAdvancedOptionsForPage(currentPageId);
      const currentOptions = { pageType, additionalContext };
      
      // Only show 'saved' status if there are actual values saved
      const hasSavedValues = savedAdvancedOptions.pageType || savedAdvancedOptions.additionalContext;
      const hasCurrentValues = pageType || additionalContext;
      
      if (hasSavedValues && JSON.stringify(currentOptions) === JSON.stringify(savedAdvancedOptions)) {
        setAdvancedOptionsSaveStatus('saved');
      } else if (hasCurrentValues) {
        setAdvancedOptionsSaveStatus('none');
      } else {
        setAdvancedOptionsSaveStatus('none');
      }
    } else {
      setAdvancedOptionsSaveStatus('none');
    }
  }, [pageType, additionalContext, currentPageId, advancedOptionsEnabled]);

  const mutation = useMutation<SEOAnalysisResult, Error, AnalyzeSEORequest>({
    mutationFn: analyzeSEO,
    onMutate: () => {
      setIsLoading(true);
      setResults(null); // Clear previous results
    },
    onSuccess: (data) => {
      let modifiedData = { ...data }; // Clone the data to avoid direct mutation

      // Check if it's the homepage and modify the URL check result accordingly
      if (isHomePage) {
        const urlCheckIndex = modifiedData.checks.findIndex(check => check.title === "Keyphrase in URL");

        if (urlCheckIndex !== -1) {
          // Create a mutable copy of the checks array
          const newChecks = [...modifiedData.checks];
          const originalCheck = newChecks[urlCheckIndex];

          // Check if the status is changing from failed to passed
          const wasFailed = !originalCheck.passed;

          // Update the specific check
          newChecks[urlCheckIndex] = {
            ...originalCheck,
            passed: true,
            description: "This is the homepage URL, so the keyphrase is not required in the URL ✨",
            // Keep original priority, recommendation might become irrelevant but leave it for now
          };

          // Update the overall counts if the status changed
          if (wasFailed) {
            modifiedData.passedChecks = (modifiedData.passedChecks ?? 0) + 1;
            modifiedData.failedChecks = Math.max(0, (modifiedData.failedChecks ?? 0) - 1);
            // Recalculate score based on the modified checks
            modifiedData.score = calculateSEOScore(newChecks);
          }

          // Assign the modified checks array back to the data
          modifiedData.checks = newChecks;
        }
      }

      setResults(modifiedData); // Set state with potentially modified data
      setSelectedCategory(null);
      setIsLoading(false);

      // Trigger confetti only if the *final* score is 100
      if (modifiedData.score === 100 && !showedPerfectScoreMessage) {
         confetti({
           particleCount: 200,
           spread: 100,
           origin: { y: 0.6 }
         });
         setShowedPerfectScoreMessage(true); // Ensure flag is set here too
      }
    },
    onError: (error: Error) => {
      setIsLoading(false);
      
      if (error.message.includes('Failed to fetch page') || error.message.includes('500')) {
        toast({
          variant: "destructive",
          title: "Unpublished Page",
          description: "It seems the page you are trying to analyze is empty. Can you make sure you published the page (top right corner button) and try again.",
          duration: 6000,
          className: "bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-800",
          style: {
            fontWeight: 500
          }
        });
      } else {
        toast({
          variant: "destructive", 
          title: "Analysis Failed",
          description: error.message || "Please check your connection and try again"
        });
      }
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Save keywords for current page
    if (currentPageId && values.keyphrase) {
      setKeywordSaveStatus('saving');
      saveKeywordsForPage(currentPageId, values.keyphrase);
      setKeywordSaveStatus('saved');
    }
    
    // Save advanced options for current page
    if (currentPageId && advancedOptionsEnabled && (pageType || additionalContext)) {
      setAdvancedOptionsSaveStatus('saving');
      saveAdvancedOptionsForPage(currentPageId, { pageType, additionalContext });
      setAdvancedOptionsSaveStatus('saved');
    }
    
    try {
      let siteInfo: WebflowSiteInfo;
      siteInfo = await webflow.getSiteInfo();
      if (siteInfo?.shortName) {
        setStagingName(siteInfo.shortName);
      }

      if (!siteInfo || !siteInfo.domains || siteInfo.domains.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No domains found in site info"
        });
        return;
      }

      const mostRecentDomain = getMostRecentlyPublishedDomain(siteInfo.domains);

      if (!mostRecentDomain) {
        toast({
          variant: "destructive",
          title: "No Published Domain Found",
          description: "Cannot perform analysis as no domain appears to have been published."
        });
        return;
      }

      const baseUrl = mostRecentDomain.url.startsWith('http') ? mostRecentDomain.url : `https://${mostRecentDomain.url}`;

      let publishPath = "";
      let currentPage;
      let rawPageData: WebflowPageData;

      try {
        currentPage = await webflow.getCurrentPage();
        publishPath = (await currentPage.getPublishPath()) ?? "";
        setIsHomePage(await currentPage.isHomepage());

        rawPageData = {
          title: "",
          metaDescription: "",
          openGraphImage: (await currentPage.getOpenGraphImage()) ?? '',
          usesTitleAsOpenGraphTitle: await currentPage.usesTitleAsOpenGraphTitle(),
          usesDescriptionAsOpenGraphDescription: await currentPage.usesDescriptionAsOpenGraphDescription()
        };
        logger.info("[Home onSubmit] Fetched Raw Webflow Page Data:", rawPageData);

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error Fetching Page Info",
          description: error instanceof Error ? error.message : "Failed to get page info from Webflow"
        });
        return;
      }

      const finalUrlPath = publishPath === '/' ? '' : publishPath;
      const url = `${baseUrl}${finalUrlPath.startsWith('/') ? '' : '/'}${finalUrlPath}`;

      const pageDataForApi: Partial<WebflowPageData> = { ...rawPageData };
      
      const mappedSiteInfo = {
        ...siteInfo,
        domains: siteInfo.domains.map(domain => ({
          ...domain,
          id: domain.url,
          name: domain.url.split('://').pop() || '',
          host: domain.url.replace(/^https?:\/\//i, ''),
          publicUrl: domain.url,
          publishedOn: domain.lastPublished || ''
        }))
      };

      const analysisData: AnalyzeSEORequest = {
        keyphrase: values.keyphrase,
        url,
        isHomePage,
        siteInfo: mappedSiteInfo,
        publishPath,
        webflowPageData: pageDataForApi as WebflowPageData,
        ...(advancedOptionsEnabled && (pageType || additionalContext) && {
          advancedOptions: {
            pageType: pageType || undefined,
            additionalContext: additionalContext || undefined
          }
        })
      };

      logger.info("[Home onSubmit] Sending data to API:", analysisData);
      mutation.mutate(analysisData);

    } catch (error) {
      // Ensure isLoading is reset even if errors occur before mutation starts
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error Preparing Analysis",
        description: error instanceof Error ? error.message : "Failed to analyze SEO. Please try again."
      });
    }
  };

  const groupedChecks = results ? groupChecksByCategory(results.checks) : null;

  useEffect(() => {
    const getUrls = async () => {
      try {
        const detectedUrls: string[] = [];
        
        if (webflow) {
          const siteInfo = await webflow.getSiteInfo();
          if (siteInfo?.domains && siteInfo.domains.length > 0) {
            siteInfo.domains.forEach(domain => {
              if (domain.url) {
                detectedUrls.push(domain.url);
              }
            });
          }
        }
        
        if (detectedUrls && detectedUrls.length > 0) {
          setUrls(detectedUrls);
        }
      } catch (error) {
      }
    };

    getUrls();
  }, []);

  const selectedCategoryChecks = selectedCategory && results ? 
    results.checks.filter(check => {
      const categories = groupChecksByCategory(results.checks);
      return categories[selectedCategory]?.includes(check);
    }) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 md:p-6 flex flex-col"
      style={{ color: "#FFFFFF" }}
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 flex-grow">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="w-full">
            <CardHeader>
              <OriginalCardTitle className="text-center">SEO Analysis Tool</OriginalCardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full">
                  <FormField
                    control={form.control}
                    name="keyphrase"
                    render={({ field }: { field: any }) => (
                      <FormItem className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <FormLabel className="mb-0">Target keyphrase</FormLabel>
                          {/* Keyword Save Status Indicator */}
                          <span className="text-xs font-medium" style={{
                            color: keywordSaveStatus === 'saved' ? 'var(--greenText)' :
                                   keywordSaveStatus === 'saving' ? 'var(--yellowText)' :
                                   'var(--redText)'
                          }}>
                            {keywordSaveStatus === 'saved' ? 'Keyword saved for this page' :
                             keywordSaveStatus === 'saving' ? 'Saving...' :
                             'No keyword saved'}
                          </span>
                        </div>
                        <FormControl>
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full mt-2"
                          >
                            <Input
                              placeholder="Enter your target keyphrase"
                              {...field}
                              className="w-full"
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Advanced Tab Section */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Advanced Analysis</h3>
                        <p className="text-sm text-muted-foreground">
                          Get more accurate, tailored recommendations for your specific page type
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={advancedOptionsEnabled}
                          onCheckedChange={(checked) => {
                            setAdvancedOptionsEnabled(checked);
                            // Clear advanced options when toggled off
                            if (!checked) {
                              setPageType('');
                              setAdditionalContext('');
                              setAdvancedOptionsSaveStatus('none');
                              // Also clear saved options from storage
                              if (currentPageId) {
                                saveAdvancedOptionsForPage(currentPageId, { pageType: '', additionalContext: '' });
                              }
                            }
                          }}
                        />
                        <span className="text-sm">{advancedOptionsEnabled ? 'On' : 'Off'}</span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {advancedOptionsEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          {/* Page Type Dropdown */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Page Type</label>
                            <Select value={pageType} onValueChange={setPageType}>
                              <SelectTrigger className="w-full border border-input bg-background">
                                <SelectValue placeholder="Select a page type" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border border-input shadow-md">
                                {PAGE_TYPES.map((type) => (
                                  <SelectItem 
                                    key={type} 
                                    value={type}
                                    className="cursor-pointer focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                  >
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Additional Context Textarea */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Additional Context
                              <span className="text-xs text-muted-foreground ml-2">
                                ({additionalContext.length}/{MAX_CONTEXT_LENGTH} characters)
                              </span>
                            </label>
                            <textarea
                              value={additionalContext}
                              onChange={(e) => {
                                const input = e.target.value;
                                const validation = validateAdditionalContext(input);
                                
                                if (validation.isValid) {
                                  setAdditionalContext(validation.sanitized);
                                  setAdditionalContextError('');
                                } else {
                                  // For invalid input, set the sanitized version and show error
                                  setAdditionalContext(validation.sanitized);
                                  setAdditionalContextError(validation.message || 'Invalid input detected');
                                }
                              }}
                              placeholder="Provide additional context about your page or goal (e.g., target audience, business model, competitive landscape, etc.)"
                              rows={4}
                              className={`w-full px-3 py-2 border rounded-md text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                additionalContextError 
                                  ? 'border-red-500 focus:ring-red-500' 
                                  : 'border-input bg-background focus:ring-ring'
                              }`}
                              maxLength={MAX_CONTEXT_LENGTH}
                            />
                            {additionalContextError && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {additionalContextError}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              This information helps AI generate more targeted, relevant SEO recommendations. 
                              HTML tags and scripts are automatically removed for security.
                            </p>
                          </div>

                          {/* Advanced Options Save Status */}
                          {(pageType || additionalContext || advancedOptionsSaveStatus === 'saving') && (
                            <div className="flex justify-end">
                              <span className="text-xs font-medium" style={{
                                color: advancedOptionsSaveStatus === 'saved' ? 'var(--greenText)' :
                                       advancedOptionsSaveStatus === 'saving' ? 'var(--yellowText)' :
                                       'var(--redText)'
                              }}>
                                {advancedOptionsSaveStatus === 'saved' ? 'Advanced options saved for this page' :
                                 advancedOptionsSaveStatus === 'saving' ? 'Saving...' :
                                 'Advanced options not saved'}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full h-11 cursor-pointer"
                    >
                      {mutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Start optimizing your SEO
                    </Button>
                  </motion.div>
                  {process.env.NODE_ENV !== 'production' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const mockPerfectResult = results ? {
                          ...results,
                          checks: results.checks.map(check => ({
                            ...check,
                            passed: true
                          })),
                          passedChecks: results.checks.length,
                          failedChecks: 0
                        } : null;
                        
                        if (mockPerfectResult) {
                          setResults(mockPerfectResult);
                          
                          confetti({
                            particleCount: 200,
                            spread: 100,
                            origin: { y: 0.6 }
                          });
                          
                          toast({
                            title: "Test Mode Activated",
                            description: "Perfect score simulation is now active.",
                            duration: 3000,
                          });
                          
                          setShowedPerfectScoreMessage(true);
                        } else {
                          toast({
                            title: "Test Failed",
                            description: "Please run an analysis first to have result data to modify.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      🧪 Test 100 Score
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <Card className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {selectedCategory ? (
                      <CategoryHeader>
                        <BackButton onClick={() => setSelectedCategory(null)}>
                          <ChevronLeft />
                          <CardTitle>{selectedCategory}</CardTitle>
                        </BackButton>
                      </CategoryHeader>
                    ) : (
                      <OriginalCardTitle className="text-center">Analysis Results</OriginalCardTitle>
                    )}
                  </div>
                  {!selectedCategory && (
                    <div className="flex flex-col items-center justify-center mt-4">
                      <ProgressCircle 
                        value={seoScore} 
                        size={140} 
                        strokeWidth={10}
                        scoreText="SEO Score" 
                      />
                      <div className="mt-2 text-center">
                        <p className="text-lg font-medium">{scoreRating}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {results.passedChecks} passed <CheckCircle className="inline-block h-4 w-4 text-greenText" style={{color: 'var(--greenText)', stroke: 'var(--greenText)'}} /> • {results.failedChecks} to improve <XCircle className="inline-block h-4 w-4 text-redText" style={{color: 'var(--redText)', stroke: 'var(--redText)'}} />
                        </p>
                        
                        {seoScore === 100 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-md text-green-800 dark:text-green-100 font-medium"
                          >
                            You are an absolute SEO legend, well done! 🎉
                            <p className="text-sm font-normal mt-1">
                              Feel free to take a screenshot and brag about it on Linkedin. We might have a special something for you in return.
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedCategory && (
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-sm text-muted-foreground text-center"
                    >
                      {results.passedChecks} passes <CheckCircle className="inline-block h-4 w-4 text-greenText" style={{color: 'var(--greenText)', stroke: 'var(--greenText)'}} /> • {results.failedChecks} improvements needed <XCircle className="inline-block h-4 w-4 text-redText" style={{color: 'var(--redText)', stroke: 'var(--redText)'}} />
                    </motion.div>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedCategory ? (
                    <ScrollArea className="h-[600px] w-full scrollarea-fix">
                      <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-5 w-full pt-5"
                      >
                        {selectedCategoryChecks.map((check, index) => (
                          <motion.div
                            key={index}
                            variants={item}
                            className="border p-4 w-full rounded-lg hover:bg-background2 transition-colors"
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div className="space-y-2 flex-1">
                                <motion.div
                                  className="font-medium flex items-center gap-2"
                                >
                                  <motion.div
                                    variants={iconAnimation}
                                    initial="initial"
                                    animate="animate"
                                  >
                                    {check.passed ? (
                                      <CheckCircle className="h-5 w-5 text-greenText flex-shrink-0" style={{color: 'var(--greenText)', stroke: 'var(--greenText)'}} />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-redText flex-shrink-0" style={{color: 'var(--redText)', stroke: 'var(--redText)'}} />
                                    )}
                                  </motion.div>
                                  {check.title}

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <motion.div
                                          variants={iconAnimation}
                                          initial="initial"
                                          animate="animate"
                                          className="ml-2"
                                        >
                                          {getPriorityIcon(check.priority)}
                                        </motion.div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>SEO Impact: {getPriorityText(check.priority)}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </motion.div>
                                <div className="text-sm text-muted-foreground text-break">
                                  <p className="inline">{check.description}</p>
                                  {!check.passed && (
                                    <a 
                                      href={getLearnMoreUrl(check.title)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="ml-1 inline-flex items-center text-primaryText hover:underline"
                                    >
                                      Learn more
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              {!check.passed && check.recommendation && shouldShowCopyButton(check.title) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="ml-4"
                                      >
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                          onClick={async () => {
                                            await copyToClipboard(check.recommendation || '');
                                          }}
                                        >
                                          <Copy className="h-4 w-4" />
                                          Copy
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy recommendation to clipboard</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {!check.passed && check.recommendation && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 text-sm p-4 bg-background3 rounded-md w-full"
                                style={{ backgroundColor: 'var(--background3)' }}
                              >
                                {check.imageData && check.imageData.length > 0 ? (
                                  <>
                                    <ImageSizeDisplay 
                                      images={check.imageData}
                                      showMimeType={check.title === "Next-Gen Image Formats"}
                                      showFileSize={check.title === "Image File Size" || check.title !== "Image Alt Attributes"}
                                      showAltText={check.title === "Image Alt Attributes"}
                                      className="mt-2"
                                    />
                                  </>
                                ) : (
                                  // Keep current rendering for all other checks
                                  check.recommendation
                                )}
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </ScrollArea>
                  ) : (
                    <div className="space-y-6">
                      {groupedChecks && Object.entries(groupChecksByCategory(results.checks)).map(([category, checks]) => {
                        const status = getCategoryStatus(checks);
                        const passedCount = checks.filter(check => check.passed).length;
                        return (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-lg p-4 hover:bg-background2 transition-colors cursor-pointer"
                            onClick={() => setSelectedCategory(category)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-medium">{category}</h3>
                              <div className="flex items-center gap-2">
                                {getCategoryStatusIcon(status)}
                                <span className="text-sm text-muted-foreground">
                                  {passedCount}/{checks.length} passed
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              {checks.map((check, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  {check.passed ? 
                                    <CheckCircle className="h-4 w-4 text-greenText flex-shrink-0" style={{color: 'var(--greenText)', stroke: 'var(--greenText)'}} /> : 
                                    <XCircle className="h-4 w-4 text-redText flex-shrink-0" style={{color: 'var(--redText)', stroke: 'var(--redText)'}} />
                                  }
                                  <span>{check.title}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </motion.div>
  );
}