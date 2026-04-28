/**
 * Debug utilities for Webflow Designer API
 * Helps investigate the actual structure of elements returned by getAllElements()
 */

export async function debugWebflowElements(): Promise<void> {
  if (typeof window === 'undefined' || !window.webflow) {
    console.log('[DEBUG] No Webflow API available');
    return;
  }

  try {
    console.log('[DEBUG] === WEBFLOW ELEMENTS STRUCTURE INVESTIGATION ===');
    
    const elements = await window.webflow.getAllElements();
    console.log('[DEBUG] getAllElements() returned:', elements);
    console.log('[DEBUG] Total elements count:', elements?.length || 0);
    
    if (elements && elements.length > 0) {
      elements.slice(0, 5).forEach((element, index) => {
        console.log(`[DEBUG] Element ${index}:`, {
          element,
          type: typeof element,
          constructor: element?.constructor?.name,
          keys: element ? Object.keys(element) : 'null/undefined',
          tagName: element?.tagName,
          tagNameType: typeof element?.tagName,
          textContent: element?.textContent,
          hasSetTextContent: typeof element?.setTextContent === 'function',
          hasGetTextContent: typeof element?.getTextContent === 'function',
        });
      });
    }
    
    // Test getting textContent from first element
    if (elements && elements.length > 0 && elements[0]) {
      const firstElement = elements[0];
      console.log('[DEBUG] Testing first element methods:');
      
      if (typeof firstElement.getTextContent === 'function') {
        try {
          const textContent = await firstElement.getTextContent();
          console.log('[DEBUG] getTextContent() returned:', textContent);
        } catch (error) {
          console.log('[DEBUG] getTextContent() failed:', error);
        }
      } else {
        console.log('[DEBUG] getTextContent() method not available');
      }
    }
    
  } catch (error) {
    console.error('[DEBUG] Error investigating elements:', error);
  }
}

export function logElementPropertiesSafely(element: any, index: number): void {
  console.log(`[DEBUG] Element ${index} safe analysis:`, {
    exists: !!element,
    type: typeof element,
    isNull: element === null,
    isUndefined: element === undefined,
    tagName: element?.tagName,
    tagNameExists: 'tagName' in (element || {}),
    tagNameType: typeof element?.tagName,
    hasTextContent: 'textContent' in (element || {}),
    textContentType: typeof element?.textContent,
    hasSetTextContent: typeof element?.setTextContent === 'function',
    hasGetTextContent: typeof element?.getTextContent === 'function',
    allKeys: element ? Object.keys(element) : 'N/A'
  });
}