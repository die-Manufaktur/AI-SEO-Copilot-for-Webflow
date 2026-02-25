import { describe, it, expect } from 'vitest';
import { stripWrappingQuotes } from './stringUtils';

describe('stripWrappingQuotes', () => {
  it('strips double-quote wrapping that LLMs add to responses', () => {
    expect(stripWrappingQuotes('"Test setup with default-32 configuration"'))
      .toBe('Test setup with default-32 configuration');
  });

  it('strips single-quote wrapping', () => {
    expect(stripWrappingQuotes("'Abstract background in shades of blue'"))
      .toBe('Abstract background in shades of blue');
  });

  it('strips backtick wrapping', () => {
    expect(stripWrappingQuotes('`Some alt text for image`'))
      .toBe('Some alt text for image');
  });

  it('preserves internal double-quotes in the text', () => {
    expect(stripWrappingQuotes('A "test" of patience'))
      .toBe('A "test" of patience');
  });

  it('preserves internal single-quotes in the text', () => {
    expect(stripWrappingQuotes("It's a beautiful day"))
      .toBe("It's a beautiful day");
  });

  it('does not strip mismatched wrapping characters', () => {
    expect(stripWrappingQuotes('"text\'')).toBe('"text\'');
    expect(stripWrappingQuotes('\'text"')).toBe('\'text"');
  });

  it('returns empty string unchanged', () => {
    expect(stripWrappingQuotes('')).toBe('');
  });

  it('returns plain unquoted text unchanged', () => {
    expect(stripWrappingQuotes('no quotes here')).toBe('no quotes here');
  });

  it('handles multiline content wrapped in quotes', () => {
    expect(stripWrappingQuotes('"first line\nsecond line"'))
      .toBe('first line\nsecond line');
  });

  it('does not strip a string that is only a single quote character', () => {
    expect(stripWrappingQuotes('"')).toBe('"');
    expect(stripWrappingQuotes("'")).toBe("'");
  });

  it('trims surrounding whitespace after stripping quotes', () => {
    expect(stripWrappingQuotes('"  spaced text  "'))
      .toBe('spaced text');
  });
});
