import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { SchemaRecommendation } from '../../../../shared/types';
import { copyTextToClipboard } from '../../utils/clipboard';
import { useToast } from '../../hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface SchemaDisplayProps {
  pageType: string;
  schemas: SchemaRecommendation[];
  pageId?: string;
}

interface SchemaBlockProps {
  schema: SchemaRecommendation;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const SchemaBlock: React.FC<SchemaBlockProps> = ({ schema, isEnabled, onToggle }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const copySchemaToClipboard = async (text: string): Promise<boolean> => {
    // For schema code, we need to bypass sanitization that strips JSON formatting
    // Strategy 1: Try the modern Clipboard API directly
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Schema copied!",
        description: `${schema.name} schema has been copied to your clipboard.`,
      });
      return true;
    } catch (err) {
      // Modern clipboard API failed, continue to fallbacks
    }

    // Strategy 2: Try execCommand (legacy approach)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        toast({
          title: "Schema copied!",
          description: `${schema.name} schema has been copied to your clipboard.`,
        });
        return true;
      }
    } catch (err) {
      // Legacy clipboard execCommand failed
    }

    // Strategy 3: Use Webflow's messaging system
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'clipboardCopy',
          text: text
        }, '*');
        toast({
          title: "Schema copied!",
          description: `${schema.name} schema has been copied to your clipboard.`,
        });
        return true;
      }
    } catch (err) {
      // Parent window messaging failed
    }

    // All strategies failed
    toast({
      title: "Clipboard access denied",
      description: "Please press Ctrl+C (Cmd+C on Mac) to copy the selected text.",
      variant: "destructive",
    });
    return false;
  };

  const handleCopy = async () => {
    const codeWithScriptTags = `<script type="application/ld+json">
${schema.jsonLdCode}
</script>`;
    
    const success = await copySchemaToClipboard(codeWithScriptTags);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };



  const getGoogleSupportBadge = () => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    
    switch (schema.googleSupport) {
      case 'yes':
        return <span className={`${baseClasses}`} style={{ backgroundColor: 'var(--background5)', color: 'var(--greenText)' }}>Google Rich Results</span>;
      case 'partial':
        return <span className={`${baseClasses}`} style={{ backgroundColor: 'var(--background5)', color: 'var(--yellowText)' }}>Partial Google Support</span>;
      case 'no':
        return <span className={`${baseClasses}`} style={{ backgroundColor: 'var(--background5)', color: 'var(--text3)' }}>Descriptive Only</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`border rounded-lg p-4 transition-all ${isEnabled ? 'border-input' : 'border-input'}`}
      style={{ 
        backgroundColor: isEnabled ? 'var(--background3)' : 'var(--background2)',
        borderColor: isEnabled ? 'var(--blueText)' : 'var(--border)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text1)' }}>{schema.name}</h4>
            {getGoogleSupportBadge()}
            {!schema.isRequired && (
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => onToggle(e.target.checked)}
                  className="rounded border-input focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  style={{ accentColor: 'var(--blueText)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text3)' }}>Include</span>
              </label>
            )}
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--text2)' }}>{schema.description}</p>
          {schema.googleSupportNote && (
            <p className="text-xs mb-2" style={{ color: 'var(--yellowText)' }}>Note: {schema.googleSupportNote}</p>
          )}
          <a
            href={schema.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs hover:underline transition-colors"
            style={{ color: 'var(--blueText)' }}
          >
            View Documentation <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
      
      {(schema.isRequired || isEnabled) && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text1)' }}>JSON-LD Code:</span>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy schema code to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <pre 
            className="p-3 rounded text-xs overflow-x-auto font-mono"
            style={{ backgroundColor: 'var(--background4)', color: 'var(--text1)' }}
          >
            <code>{`<script type="application/ld+json">
${schema.jsonLdCode}
</script>`}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ pageType, schemas, pageId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [enabledOptionalSchemas, setEnabledOptionalSchemas] = useState<Set<string>>(new Set());

  const requiredSchemas = schemas.filter(s => s.isRequired);
  const optionalSchemas = schemas.filter(s => !s.isRequired);

  const toggleOptionalSchema = (schemaName: string, enabled: boolean) => {
    const newEnabled = new Set(enabledOptionalSchemas);
    if (enabled) {
      newEnabled.add(schemaName);
    } else {
      newEnabled.delete(schemaName);
    }
    setEnabledOptionalSchemas(newEnabled);
  };

  if (schemas.length === 0) return null;

  return (
    <div className="mt-4 border rounded-lg" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background2)' }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm" style={{ color: 'var(--text1)' }}>Schema Recommendations</h3>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>({schemas.length} available)</span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--text3)' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--text3)' }} />
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent style={{ borderTopColor: 'var(--border)' }} className="border-t">
          <div className="p-4 space-y-4">
            <div className="text-xs mb-4" style={{ color: 'var(--text2)' }}>
              Based on your selected page type (<strong style={{ color: 'var(--text1)' }}>{pageType}</strong>), here are the recommended schema markups:
            </div>
            
            {/* Required Schemas */}
            {requiredSchemas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text1)' }}>Required Schemas</h4>
                <div className="space-y-3">
                  {requiredSchemas.map((schema) => (
                    <SchemaBlock
                      key={schema.name}
                      schema={schema}
                      isEnabled={true}
                      onToggle={() => {}} // Required schemas are always enabled
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Optional Schemas */}
            {optionalSchemas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text1)' }}>Optional Schemas</h4>
                <div className="space-y-3">
                  {optionalSchemas.map((schema) => (
                    <SchemaBlock
                      key={schema.name}
                      schema={schema}
                      isEnabled={enabledOptionalSchemas.has(schema.name)}
                      onToggle={(enabled) => toggleOptionalSchema(schema.name, enabled)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div 
              className="mt-4 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--background3)', borderColor: 'var(--border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--blueText)' }}>💡 Tip:</strong> Copy the JSON-LD code and paste it into your page's HTML head section or use Webflow's custom code areas.
                Replace placeholder values (marked with {`{curly braces}`}) with your actual content.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};