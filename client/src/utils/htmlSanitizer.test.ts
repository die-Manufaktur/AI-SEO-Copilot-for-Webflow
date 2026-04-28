import { describe, it, expect } from 'vitest';
import { stripHtmlTags, sanitizeHtmlBrowser } from './htmlSanitizer';

describe('stripHtmlTags', () => {
  it('returns empty string for empty input', () => {
    expect(stripHtmlTags('')).toBe('');
  });

  it('returns empty string for null/undefined input', () => {
    expect(stripHtmlTags(null as unknown as string)).toBe('');
    expect(stripHtmlTags(undefined as unknown as string)).toBe('');
  });

  it('strips simple HTML tags', () => {
    expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello');
  });

  it('strips nested HTML tags', () => {
    expect(stripHtmlTags('<div><p><strong>Hello</strong></p></div>')).toBe('Hello');
  });

  it('prevents reassembly attacks', () => {
    // <scr<script>ipt> after one pass of tag removal becomes <script>
    // The loop ensures the reassembled tag is stripped on the next pass
    expect(stripHtmlTags('<scr<script>ipt>alert("xss")</scr</script>ipt>')).not.toContain('<script>');
  });

  it('decodes basic HTML entities', () => {
    expect(stripHtmlTags('&lt;div&gt;')).toBe('<div>');
    expect(stripHtmlTags('&quot;hello&quot;')).toBe('"hello"');
    expect(stripHtmlTags('&#39;hello&#39;')).toBe("'hello'");
    expect(stripHtmlTags('&amp;')).toBe('&');
  });

  it('does not double-unescape &amp;lt; to <', () => {
    // This is the critical regression test for the XSS fix.
    // &amp;lt; should decode to &lt; (the literal text), NOT to <
    expect(stripHtmlTags('&amp;lt;')).toBe('&lt;');
  });

  it('does not double-unescape &amp;gt; to >', () => {
    expect(stripHtmlTags('&amp;gt;')).toBe('&gt;');
  });

  it('does not double-unescape &amp;quot; to "', () => {
    expect(stripHtmlTags('&amp;quot;')).toBe('&quot;');
  });

  it('does not double-unescape &amp;amp; beyond one level', () => {
    expect(stripHtmlTags('&amp;amp;')).toBe('&amp;');
  });

  it('handles text with no HTML', () => {
    expect(stripHtmlTags('plain text')).toBe('plain text');
  });
});

describe('sanitizeHtmlBrowser', () => {
  it('delegates to stripHtmlTags', () => {
    expect(sanitizeHtmlBrowser('<b>bold</b>')).toBe('bold');
  });
});
