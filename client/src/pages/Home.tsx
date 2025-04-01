import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import confetti from 'canvas-confetti';
import { Card, CardContent, CardHeader, CardTitle as OriginalCardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  AlertTriangle,
  CircleAlert,
  Info,
  ChevronLeft,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useToast } from "../hooks/use-toast";
import { getPageSlug } from "../lib/get-page-slug";
import { analyzeSEO, registerDomains, getApiBaseUrl } from "../lib/api";
import type { SEOAnalysisResult, SEOCheck } from "../lib/types";
import { ProgressCircle } from "../components/ui/progress-circle";
import { getLearnMoreUrl } from "../lib/docs-links";
import styled from 'styled-components';
import { createLogger } from "../lib/utils";
import Footer from "../components/Footer";

// Create a namespaced logger for the Home component
const logger = createLogger('Home');

const formSchema = z.object({
  keyphrase: z.string().min(2, "Keyphrase must be at least 2 characters")
});

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
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

const shouldShowCopyButton = (checkTitle: string) => {
  return !checkTitle.toLowerCase().includes("density") &&
         !checkTitle.toLowerCase().includes("image format") &&
         !checkTitle.toLowerCase().includes("content length") &&
         !checkTitle.toLowerCase().includes("og image") &&
         !checkTitle.toLowerCase().includes("heading hierarchy") &&
         !checkTitle.toLowerCase().includes("code minification") &&
         !checkTitle.toLowerCase().includes("schema markup") &&
         !checkTitle.toLowerCase().includes("image file size");
};

// Get priority icon based on priority level
const getPriorityIcon = (priority: string, className: string = "h-4 w-4") => {
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
const getPriorityText = (priority: string) => {
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
    "Meta SEO": ["Keyphrase in Title", "Keyphrase in Meta Description", "Keyphrase in URL", "Open Graph Title and Description"],
    "Content Optimisation": ["Content Length on page", "Keyphrase Density", "Keyphrase in Introduction", "Keyphrase in H1 Heading", "Keyphrase in H2 Headings", "Heading Hierarchy"],
    "Links": ["Internal Links", "Outbound Links"],
    "Images and Assets": ["Image Alt Attributes", "Next-Gen Image Formats", "OpenGraph Image", "Image File Size"],
    "Technical SEO": ["Code Minification", "Schema Markup"]
  };

  // Add a debug log only if checks exist
  if (checks && checks.length > 0) {
    logger.debug("Checks to categorize:", checks.map(c => c.title));
  }

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

  // Log the final categorization only if there are meaningful results
  const hasChecks = Object.values(grouped).some(categoryChecks => categoryChecks.length > 0);
  if (hasChecks) {
    logger.debug("Final categorization:", Object.entries(grouped).map(([category, checks]) => 
      `${category}: ${checks.length} items (${checks.map(c => c.title).join(', ')})`
    ));
  }

  return grouped;
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

// Calculate the overall SEO score based on check priorities
const calculateSEOScore = (checks: SEOCheck[]): number => {
  if (!checks || checks.length === 0) return 0;

  // Define weights for different priority levels
  const weights = {
    high: 3,
    medium: 2,
    low: 1
  };

  // Calculate total possible points
  let totalPossiblePoints = 0;
  checks.forEach(check => {
    totalPossiblePoints += weights[check.priority] || weights.medium;
  });

  // Calculate earned points
  let earnedPoints = 0;
  checks.forEach(check => {
    if (check.passed) {
      earnedPoints += weights[check.priority] || weights.medium;
    }
  });

  // Calculate percentage score (0-100)
  return Math.round((earnedPoints / totalPossiblePoints) * 100);
};

// Get score rating text
const getScoreRatingText = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Work";
  return "Poor";
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

// Add this function before the Home component
const fetchPageInfo = async (setSlug: (slug: string | null) => void, setIsHomePage: (isHome: boolean) => void) => {
  const currentSlug = await getPageSlug();
  setSlug(currentSlug);
  
  try {
    if (window.webflow) {
      const currentPage = await webflow.getCurrentPage();
      const isHome = await currentPage.isHomepage();
      setIsHomePage(isHome);
      logger.debug(`Current page homepage status: ${isHome}`);
    }
  } catch (error) {
    logger.error("Error checking if page is homepage:", error);
    setIsHomePage(false);
  }
};

export default function Home() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [isHomePage, setIsHomePage] = useState<boolean>(false);
  const [results, setResults] = useState<SEOAnalysisResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stagingName, setStagingName] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [urls, setUrls] = useState<string[]>([]);
  // Add state for perfect score celebration
  const [showedPerfectScoreMessage, setShowedPerfectScoreMessage] = useState<boolean>(false);
  
  // Calculate overall SEO score - moved up to avoid reference before declaration
  const seoScore = results ? calculateSEOScore(results.checks) : 0;
  const scoreRating = getScoreRatingText(seoScore);

  useEffect(() => {
    const fetchSlug = async () => {
      const currentSlug = await getPageSlug();
      setSlug(currentSlug);
      
      // Also check if the current page is the homepage
      try {
        if (window.webflow) {
          const currentPage = await webflow.getCurrentPage();
          const isHome = await currentPage.isHomepage();
          setIsHomePage(isHome);
          logger.debug(`Current page homepage status: ${isHome}`);
        }
      } catch (error) {
        logger.error("Error checking if page is homepage:", error);
        setIsHomePage(false);
      }
    };
    fetchSlug();
  }, []);

  // Move the event listener inside useEffect
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Ensure the message is coming from a trusted origin
      if (event.origin !== 'http://localhost:1337' && event.origin !== `https://${stagingName}.webflow.io`) {
        return;
      }

      if (event.data.name === 'copyToClipboard') {
        const text = event.data.data;
        navigator.clipboard.writeText(text).then(() => {
          logger.debug('Text copied to clipboard');
        }).catch(err => {
          logger.error('Failed to copy text to clipboard', err);
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [stagingName]);

  // Add direct DOM manipulation on first render to ensure visibility
  useEffect(() => {
    // Try to show a toast message to verify the component is working
    toast({
      title: "SEO Analyzer Ready",
      description: "Enter your target keyphrase to begin analysis",
      duration: 5000
    });
  }, []);

  // Add this effect near the other useEffect hooks
  useEffect(() => {
    // Subscribe to page changes in Webflow Designer
    if (window.webflow) {
      let currentPageId: string | null = null;
      
      // Get initial page ID
      const getCurrentPageId = async () => {
        try {
          const currentPage = await webflow.getCurrentPage();
          if (currentPage) {
            currentPageId = currentPage.id;
            logger.debug('Initial page ID:', currentPageId);
          }
        } catch (error) {
          logger.error('Error getting initial page ID:', error);
        }
      };
      
      getCurrentPageId();
      
      const unsubscribe = window.webflow.subscribe('currentpage', async (event) => {
        try {
          // Get updated page info
          const currentPage = await webflow.getCurrentPage();
          // getCurrentPage returns the current page directly, no need to find it
          const newCurrentPage = currentPage;
          
          if (newCurrentPage && newCurrentPage.id !== currentPageId) {
            // Page has actually changed, update currentPageId and reload
            logger.info('Page changed from', currentPageId, 'to', newCurrentPage.id);
            currentPageId = newCurrentPage.id;
            
            // Use a small timeout to prevent potential race conditions
            setTimeout(() => {
              window.location.reload();
            }, 100);
          } else {
            logger.debug('Ignoring currentpage event - same page or no page ID');
          }
        } catch (error) {
          logger.error('Error handling page change:', error);
        }
      });
      
      // Clean up subscription when component unmounts
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Update the page change subscription
  useEffect(() => {
    if (window.webflow) {
      // Subscribe to page changes in Webflow Designer
      const unsubscribe = window.webflow.subscribe('currentpage', async () => {
        try {
          // When page changes, fetch new page info
          await fetchPageInfo(setSlug, setIsHomePage);
          logger.debug('Page changed, updated page info');
        } catch (error) {
          logger.error('Error handling page change:', error);
        }
      });
      
      // Clean up subscription when component unmounts
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Add effect for perfect score celebration
  useEffect(() => {
    // Only run when we have results and the score is 100
    if (results && seoScore === 100 && !showedPerfectScoreMessage) {
      // Trigger confetti animation
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });

      // Remove toast notification - keep only the UI message
      // toast({
      //   title: "You are an absolute SEO legend!, well done!",
      //   description: "Feel free to take a screenshot and brag about it on Linkedin. We might have a special something for you in return.",
      //   duration: 10000, // Show this message longer
      // });

      // Mark as shown so we don't show it again
      setShowedPerfectScoreMessage(true);
    }
  }, [results, seoScore, showedPerfectScoreMessage, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyphrase: ""
    }
  });

  const mutation = useMutation({
    mutationFn: analyzeSEO,
    onMutate: () => {
      logger.info('Starting SEO analysis...');
      setIsLoading(true);
    },
    onSuccess: (data) => {
      logger.info('SEO analysis completed successfully');
      logger.debug('Analysis results:', data);
      setResults(data);
      setSelectedCategory(null); // Reset selected category on new analysis
      setIsLoading(false);
    },
    onError: (error: Error) => {
      logger.error('SEO analysis failed:', error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Please check your connection and try again"
      });
    }
  });

  const copyCleanToClipboard = async (text: string | undefined) => {
    if (!text) return;

    // Extract just the text of the suggestion, not the explanation
    let cleanText = "";

    // Try to extract the specific text suggestion from various formats
    if (text.includes("Here is a better")) {
      // Format: "Here is a better [element]: [example]"
      const match = text.match(/Here is a better [^:]+:\s*(.*)/);
      cleanText = match ? match[1].trim() : text;
    } else if (text.includes("Utilize") && text.includes("as an H")) {
      // Format: "Utilize 'Example text' as an H1/H2 heading..."
      const match = text.match(/Utilize ['"]([^'"]+)['"]/);
      cleanText = match ? match[1].trim() : text;
    } else if (text.includes("Add an H")) {
      // Format: "Add an H1/H2 with 'Example text'..."
      const match = text.match(/with ['"]([^'"]+)['"]/);
      cleanText = match ? match[1].trim() : text;
    } else {
      // Default extraction of text inside quotes
      const quotedText = text.match(/['"]([^'"]+)['"]/);
      cleanText = quotedText ? quotedText[1].trim() : text;
    }

    // Clean up any remaining quotes
    cleanText = cleanText.replace(/^"|"$/g, '');

    const success = await copyToClipboard(cleanText);
    if (success) {
      toast({
        title: "Copied to clipboard!",
        description: "You can now paste this into Webflow",
        duration: 2000
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy recommendation to clipboard"
      });
    }
  };
  
  const getSiteInfo = async (): Promise<WebflowSiteInfo | null> => {
    try {
      const siteInfo = await webflow.getSiteInfo();
      if (siteInfo?.shortName) {
        setStagingName(siteInfo.shortName);
      }
      return siteInfo as WebflowSiteInfo;
    } catch (error) {
      logger.error(`Error getting site info:`, error); // Keep error logs but use logger
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error getting site info"
      });
      return null;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Force a double-check of the API URL
      const apiBaseUrl = getApiBaseUrl();
      logger.debug("API base URL for request:", apiBaseUrl);

      const siteInfo = await getSiteInfo();
      if (!siteInfo || !siteInfo.domains || siteInfo.domains.length === 0) {
        logger.error("No domains found in site info");
        toast({
          variant: "destructive",
          title: "Error",
          description: "No domains found in site info"
        });
        return;
      }
  
      let url = "";
      if (siteInfo.domains.length === 1) {
        url = siteInfo.domains[0].url;
      } else {
        const defaultDomain = siteInfo.domains.find(domain => domain.default);
        if (defaultDomain) {
          url = defaultDomain.url;
        } else {
          logger.error("No default domain found in site info");
          toast({
            variant: "destructive",
            title: "Error",
            description: "No default domain found in site info"
          });
          return;
        }
      }
  
      if (url) {
        // Make sure URLs start with https:// for production compatibility
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        } else if (url.startsWith('http://')) {
          url = url.replace(/^http:/, 'https:');
        }
        
        // Append the slug to the URL if it exists
        if (slug) {
          // Remove trailing slash from URL if present
          url = url.replace(/\/$/, '');
          
          // Add the slug with leading slash
          url = `${url}/${slug}`;
          logger.debug("Full page URL with slug:", url);
        } else {
          logger.debug("No slug available, using domain URL only:", url);
        }
        
        // Add debugging message
        logger.debug(`Using API base URL: ${getApiBaseUrl()}`);
        logger.debug(`Using target URL: ${url}`);
        logger.debug(`Is homepage: ${isHomePage}`);
        
        // Wrap in try-catch and provide useful error message
        try {
          // Force a direct request to the Worker to test connectivity
          const testConnection = await fetch(`${apiBaseUrl}/api/analyze`, {
            method: "HEAD"
          }).catch(err => {
            logger.warn("Test connection to Worker failed:", err);
            return null;
          });
          
          logger.debug("Worker test connection result:", testConnection ? `${testConnection.status} ${testConnection.statusText}` : "Failed");
          
          // Pass isHomePage to the SEO analysis
          mutation.mutate({ keyphrase: values.keyphrase, url, isHomePage });
        } catch (apiError) {
          logger.error("API request failed:", apiError);
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Make sure the Cloudflare Worker is running with 'yarn dev:worker'"
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to determine the URL"
        });
      }
    } catch (error) {
      logger.error("Error submitting form:", error);
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Failed to analyze SEO. Please try again."
      });
    }
  };

  // Group checks for the overview
  const groupedChecks = results ? groupChecksByCategory(results.checks) : null;

  // Only log groupedChecks when it contains data
  if (groupedChecks) {
    logger.debug("Grouped checks data:", groupedChecks);
  }

  // Function to extract domains from URLs and register them
  const registerDetectedDomains = async (detectedUrls: string[]) => {
    if (!detectedUrls || detectedUrls.length === 0) return;

    try {
      // Extract unique domains from the URLs
      const domains = detectedUrls
        .filter(Boolean)
        .map(url => {
          try {
            // Handle URLs with or without protocol
            const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
            const urlObj = new URL(urlWithProtocol);
            return urlObj.hostname;
          } catch (e) {
            logger.warn("Invalid URL format:", url);
            return url; // Return original if parsing fails
          }
        })
        .filter(Boolean);

      if (domains.length > 0) {
        logger.debug("Processing domains for registration:", domains);
        
        try {
          const result = await registerDomains(domains);
          
          if (result.success) {
            logger.info(`Successfully registered ${domains.length} domains: ${domains.join(', ')}`);
          } else {
            logger.warn("Failed to register some domains:", result.message);
          }
        } catch (err) {
          // Don't block the app if domain registration fails (it will just use the API's default allowed domains)
          logger.warn("Domain registration failed, continuing with default allowed domains");
        }
      }
    } catch (error) {
      logger.error("Error registering domains:", error);
    }
  };

  useEffect(() => {
    // Get URLs from Webflow context
    const getUrls = async () => {
      try {
        // Initialize detectedUrls as an empty array
        const detectedUrls: string[] = [];
        
        // Try to get URL from Webflow context if available
        if (webflow && typeof webflow.getSiteInfo === 'function') {
          const siteInfo = await getSiteInfo();
          if (siteInfo?.domains && siteInfo.domains.length > 0) {
            siteInfo.domains.forEach(domain => {
              if (domain.url) {
                detectedUrls.push(domain.url);
              }
            });
          }
        }
        
        // After setting the URLs, register their domains
        if (detectedUrls && detectedUrls.length > 0) {
          setUrls(detectedUrls);
          await registerDetectedDomains(detectedUrls);
        }
      } catch (error) {
        logger.error("Error getting URLs:", error);
      }
    };

    getUrls();
  }, []);

  // Get checks for the selected category
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
      style={{ color: "#FFFFFF" }} // Force white text for visibility
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
                        <FormLabel className="mb-1">Target keyphrase</FormLabel>
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
                      </FormItem>
                    )}
                  />
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full h-11"
                    >
                      {mutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Analyze SEO
                    </Button>
                  </motion.div>
                  {/* Only show test button in development environments */}
                  {process.env.NODE_ENV !== 'production' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        // Mock a perfect score result
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
                          
                          // Trigger the confetti directly for immediate feedback
                          confetti({
                            particleCount: 200,
                            spread: 100,
                            origin: { y: 0.6 }
                          });
                          
                          // Keep toast for test button only to provide feedback about test mode
                          toast({
                            title: "Test Mode Activated",
                            description: "Perfect score simulation is now active.",
                            duration: 3000,
                          });
                          
                          // Set the state to prevent repeated toasts
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
                        
                        {/* Perfect score celebration message */}
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
                    // Show checks for the selected category
                    <ScrollArea className="h-[600px] pr-4 w-full">
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

                                  {/* Priority Icon */}
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
                                <div className="text-sm text-muted-foreground">
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
                                            // Use copyCleanToClipboard instead of direct copyToClipboard
                                            await copyCleanToClipboard(check.recommendation || '');
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
                              >
                                {check.recommendation}
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </ScrollArea>
                  ) : (
                    // Show overview categories
                    <div className="space-y-6">
                      {groupedChecks && Object.entries(groupedChecks).map(([category, checks]) => {
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

// Move copyToClipboard function inside the component as well

// Use the existing WebflowExtension type defined in global.d.ts
const copyToClipboard = async (text: string) => {
  try {
    // Try using Webflow's built-in clipboard method
    if (window.webflow?.clipboard) {
      await window.webflow.clipboard.writeText(text);
      return true;
    }
    
    // If Webflow's clipboard API is not available, try using the DOM method
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    
    try {
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      logger.error('DOM clipboard operation failed:', err);
      document.body.removeChild(textArea);
      return false;
    }
  } catch (error) {
    logger.error('Clipboard write failed:', error);
    return false;
  }
};