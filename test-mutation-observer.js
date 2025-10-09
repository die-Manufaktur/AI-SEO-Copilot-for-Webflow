// Quick test to verify MutationObserver is working
const { JSDOM } = require('jsdom');

// Set up jsdom environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test">Initial</div></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Test MutationObserver
const observer = new window.MutationObserver((mutations) => {
  console.log('MutationObserver triggered:', mutations.length, 'mutations');
});

const testDiv = document.getElementById('test');
observer.observe(testDiv, { childList: true, subtree: true });

// Trigger a change
testDiv.textContent = 'Changed';

console.log('MutationObserver test completed');