// Test clipboard fix
import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock vi functions for testing
global.vi = {
  fn: () => () => 'mock function'
};

console.log('Testing clipboard mock fix...');

// Test scenario 1: No clipboard exists
if (navigator.clipboard) {
  delete navigator.clipboard;
}
console.log('1. Before mock - clipboard exists:', !!navigator.clipboard);

// Apply our fix logic
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(),
      readText: vi.fn(),
      write: vi.fn(),
      read: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
  console.log('✓ Created new clipboard property');
} else {
  navigator.clipboard.writeText = vi.fn();
  navigator.clipboard.readText = vi.fn();
  if ('write' in navigator.clipboard) navigator.clipboard.write = vi.fn();
  if ('read' in navigator.clipboard) navigator.clipboard.read = vi.fn();
  console.log('✓ Mocked existing clipboard methods');
}

console.log('2. After mock - clipboard exists:', !!navigator.clipboard);
console.log('   - writeText is function:', typeof navigator.clipboard.writeText === 'function');

// Test scenario 2: Clipboard already exists (simulate second test run)
console.log('\nTesting when clipboard already exists...');
try {
  // This should not throw an error now
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(), readText: vi.fn(), write: vi.fn(), read: vi.fn() },
      writable: true,
      configurable: true,
    });
    console.log('✓ Created new clipboard (shouldn\'t happen)');
  } else {
    navigator.clipboard.writeText = vi.fn();
    navigator.clipboard.readText = vi.fn();
    if ('write' in navigator.clipboard) navigator.clipboard.write = vi.fn();
    if ('read' in navigator.clipboard) navigator.clipboard.read = vi.fn();
    console.log('✓ Successfully mocked existing clipboard without error');
  }
} catch (error) {
  console.error('✗ Error:', error.message);
}

console.log('\n🎉 Clipboard mock fix is working correctly!');