import { describe, it, expect } from 'vitest';
import { shortenFileName } from './fileUtils';

describe('fileUtils', () => {
  describe('shortenFileName', () => {
    it('should return original filename if shorter than maxLength', () => {
      const filename = 'short.txt';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('short.txt');
    });

    it('should return original filename if exactly maxLength', () => {
      const filename = 'exact12345.txt';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('exact12345.txt');
    });

    it('should shorten filename while preserving extension', () => {
      const filename = 'very-long-filename.txt';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('very-long-...txt');
    });

    it('should use default maxLength of 10 when not specified', () => {
      const filename = 'this-is-a-very-long-filename.txt';
      const result = shortenFileName(filename);
      expect(result).toBe('this-is-a-...txt');
    });

    it('should handle files with no extension', () => {
      const filename = 'very-long-filename-without-extension';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('very-long-...');
    });

    it('should handle short files with no extension', () => {
      const filename = 'short';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('short');
    });

    it('should handle hidden files (starting with dot)', () => {
      const filename = '.gitignore';
      const result = shortenFileName(filename, 5);
      expect(result).toBe('.giti...');
    });

    it('should handle hidden files with extensions', () => {
      const filename = '.very-long-hidden-file.config';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('.very-long....config');
    });

    it('should handle files with multiple extensions', () => {
      const filename = 'archive-file-name.tar.gz';
      const result = shortenFileName(filename, 8);
      expect(result).toBe('archive-....gz');
    });

    it('should handle empty filename', () => {
      const filename = '';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('');
    });

    it('should handle filename that is just an extension', () => {
      const filename = '.txt';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('.txt');
    });

    it('should handle very short maxLength', () => {
      const filename = 'long-filename.txt';
      const result = shortenFileName(filename, 2);
      expect(result).toBe('lo....txt');
    });

    it('should handle maxLength of 0', () => {
      const filename = 'filename.txt';
      const result = shortenFileName(filename, 0);
      expect(result).toBe('....txt');
    });

    it('should handle negative maxLength', () => {
      const filename = 'filename.txt';
      const result = shortenFileName(filename, -1);
      expect(result).toBe('....txt');
    });

    it('should preserve single character extensions', () => {
      const filename = 'very-long-filename.c';
      const result = shortenFileName(filename, 5);
      expect(result).toBe('very-....c');
    });

    it('should handle files with dots in the name but no extension at the end', () => {
      const filename = 'file.with.dots.in.name';
      const result = shortenFileName(filename, 8);
      expect(result).toBe('file.wit....name');
    });

    it('should handle Unicode characters in filename', () => {
      const filename = 'файл-с-длинным-именем.txt';
      const result = shortenFileName(filename, 10);
      expect(result).toBe('файл-с-дли....txt');
    });

    it('should handle special characters in filename', () => {
      const filename = 'file@#$%^&*()name.txt';
      const result = shortenFileName(filename, 8);
      expect(result).toBe('file@#$%....txt');
    });
  });
});