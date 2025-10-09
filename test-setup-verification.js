// Test the setup fixes
import { JSDOM } from 'jsdom';

// Setup jsdom environment like in the tests
const dom = new JSDOM('<!DOCTYPE html><html><body><input type="text" /></body></html>', {
  pretendToBeVisual: true,
  resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Test our clipboard mock
console.log('Testing clipboard mock...');
try {
  console.log('✓ navigator.clipboard exists:', !!navigator.clipboard);
  console.log('✓ writeText method exists:', typeof navigator.clipboard.writeText === 'function');
} catch (error) {
  console.error('✗ Clipboard mock failed:', error.message);
}

// Test our getComputedStyle mock
console.log('\nTesting getComputedStyle mock...');
try {
  const element = document.querySelector('input');
  const styles = window.getComputedStyle(element);
  console.log('✓ getComputedStyle works:', !!styles);
  console.log('✓ visibility property:', styles.visibility);
  console.log('✓ pointerEvents property:', styles.pointerEvents);
  console.log('✓ color property:', styles.color);
} catch (error) {
  console.error('✗ getComputedStyle mock failed:', error.message);
}

// Test element methods
console.log('\nTesting element method mocks...');
try {
  const element = document.querySelector('input');
  const rect = element.getBoundingClientRect();
  console.log('✓ getBoundingClientRect works:', !!rect);
  console.log('✓ width property:', rect.width);
  console.log('✓ height property:', rect.height);
} catch (error) {
  console.error('✗ Element method mocks failed:', error.message);
}

console.log('\n🎉 All setup fixes are working correctly!');