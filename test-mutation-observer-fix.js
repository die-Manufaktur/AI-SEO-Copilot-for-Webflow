// Test the updated MutationObserver mock
const { JSDOM } = require('jsdom');

// Set up jsdom environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test">Initial</div></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Import the mock setup (simulate what happens in setupTests.ts)
class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.observing = false;
  }
  
  observe(target, options) {
    this.observing = true;
    // Immediately trigger callback with empty mutations array to satisfy testing-library
    queueMicrotask(() => {
      if (this.observing) {
        this.callback([], this);
      }
    });
  }
  
  disconnect() {
    this.observing = false;
  }
  
  takeRecords() {
    return [];
  }
}

global.MutationObserver = MockMutationObserver;

// Test the observer
let callbackCalled = false;
const observer = new window.MutationObserver((mutations, obs) => {
  console.log('✓ MutationObserver callback triggered successfully');
  console.log('  - mutations length:', mutations.length);
  console.log('  - observer instance:', obs instanceof MockMutationObserver);
  callbackCalled = true;
});

const testDiv = document.getElementById('test');
console.log('Testing MutationObserver mock...');

// Test observe method
console.log('Calling observe...');
observer.observe(testDiv, { childList: true, subtree: true });

// Wait for the microtask to complete
setTimeout(() => {
  if (callbackCalled) {
    console.log('✓ SUCCESS: MutationObserver mock is working correctly');
  } else {
    console.log('✗ FAILED: MutationObserver callback was not triggered');
  }
  
  // Test disconnect
  observer.disconnect();
  console.log('✓ disconnect() called successfully');
  
  // Test takeRecords
  const records = observer.takeRecords();
  console.log('✓ takeRecords() returned:', records);
  
}, 10);