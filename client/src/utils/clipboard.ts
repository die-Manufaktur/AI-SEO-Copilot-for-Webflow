import { sanitizeText } from '../../../shared/utils/stringUtils';

/**
 * Multi-strategy clipboard utility with fallbacks
 */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  // Clean and sanitize the text using shared utility
  const sanitizedText = typeof text === 'string' ? sanitizeText(text) : '';

  // Strategy 1: Try the modern Clipboard API (with permissions)
  try {
    await navigator.clipboard.writeText(sanitizedText);
    return true;
  } catch (err) {
    console.warn("Modern clipboard API failed:", err);
    // Continue to fallbacks
  }

  // Strategy 2: Try execCommand (legacy approach)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = sanitizedText;
    
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
      return true;
    }
  } catch (err) {
    console.warn("Legacy clipboard execCommand failed:", err);
  }

  // Strategy 3: Use Webflow's messaging system
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'clipboardCopy',
        text: sanitizedText
      }, '*');
      return true;
    }
  } catch (err) {
    console.warn("Parent window messaging failed:", err);
  }

  // All strategies failed
  return false;
};