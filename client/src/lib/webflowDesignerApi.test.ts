/**
 * Webflow Designer API Tests
 * TDD approach for fixing API loading issues
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebflowDesignerExtensionAPI } from './webflowDesignerApi';

// Mock window.webflow
const mockWebflow = {
  getCurrentPage: vi.fn().mockReturnValue({ id: 'test-page' }),
  setPageSetting: vi.fn(),
  updateCMSItem: vi.fn(),
  getAllElements: vi.fn().mockResolvedValue([]),
};

describe('WebflowDesignerExtensionAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup window.webflow mock
    Object.defineProperty(global, 'window', {
      value: {
        webflow: mockWebflow,
      },
      writable: true,
    });
  });

  describe('Basic API Functionality', () => {
    it('should create API instance', () => {
      const api = new WebflowDesignerExtensionAPI();
      expect(api).toBeDefined();
    });

    it('should be properly instantiated', () => {
      const api = new WebflowDesignerExtensionAPI();
      expect(api).toBeInstanceOf(WebflowDesignerExtensionAPI);
    });
  });

  describe('API Method Coverage', () => {
    beforeEach(() => {
      mockWebflow.getCurrentPage.mockReturnValue({ id: 'test-page' });
      mockWebflow.setPageSetting.mockResolvedValue(undefined);
      mockWebflow.updateCMSItem.mockResolvedValue(undefined);
    });

    it('should handle updatePageTitle correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      
      const mockPage = {
        setTitle: vi.fn().mockResolvedValue(undefined)
      };
      mockWebflow.getCurrentPage.mockResolvedValue(mockPage);
      
      await expect(api.updatePageTitle('test-page-id', 'New Title')).resolves.not.toThrow();
      expect(mockPage.setTitle).toHaveBeenCalledWith('New Title');
    });

    it('should handle updatePageMetaDescription correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      
      const mockPage = {
        setMetadata: vi.fn().mockResolvedValue(undefined)
      };
      mockWebflow.getCurrentPage.mockResolvedValue(mockPage);
      
      await expect(api.updatePageMetaDescription('test-page-id', 'New Description')).resolves.not.toThrow();
      expect(mockPage.setMetadata).toHaveBeenCalledWith({ description: 'New Description' });
    });

    it('should handle updatePageSlug correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      
      const mockPage = {
        setSlug: vi.fn().mockResolvedValue(undefined)
      };
      mockWebflow.getCurrentPage.mockResolvedValue(mockPage);
      
      await expect(api.updatePageSlug('test-page-id', 'new-slug')).resolves.not.toThrow();
      expect(mockPage.setSlug).toHaveBeenCalledWith('new-slug');
    });
  });

  describe('updateImageAltText', () => {
    function makeImageElement(assetUrl: string) {
      return {
        id: `img-${assetUrl}`,
        type: 'Image',
        getAsset: vi.fn().mockResolvedValue({ url: assetUrl, name: assetUrl.split('/').pop() }),
        setAltText: vi.fn().mockResolvedValue(undefined),
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
      };
    }

    it('sets alt text on the image element matching the exact URL via getAsset', async () => {
      const imgEl = makeImageElement('https://cdn.example.com/photo.jpg');
      mockWebflow.getAllElements.mockResolvedValue([imgEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText('https://cdn.example.com/photo.jpg', 'A beautiful photo');

      expect(result).toBe(true);
      expect(imgEl.setAltText).toHaveBeenCalledWith('A beautiful photo');
    });

    it('matches image element by filename when asset URL differs', async () => {
      const imgEl = makeImageElement('https://assets.webflow.com/images/photo.jpg');
      mockWebflow.getAllElements.mockResolvedValue([imgEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText('https://cdn.example.com/images/photo.jpg', 'Landscape');

      expect(result).toBe(true);
      expect(imgEl.setAltText).toHaveBeenCalledWith('Landscape');
    });

    it('falls back to getAttribute(src) when getAsset is not available', async () => {
      const fallbackEl = {
        id: 'fallback-img',
        type: 'Image',
        getAttribute: vi.fn((name: string) => (name === 'src' ? 'https://cdn.example.com/hero.jpg' : null)),
        setAltText: vi.fn().mockResolvedValue(undefined),
        setAttribute: vi.fn(),
      };
      mockWebflow.getAllElements.mockResolvedValue([fallbackEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText('https://cdn.example.com/hero.jpg', 'Hero image');

      expect(result).toBe(true);
      expect(fallbackEl.setAltText).toHaveBeenCalledWith('Hero image');
    });

    it('throws when no image element matches the URL', async () => {
      const imgEl = makeImageElement('https://cdn.example.com/other.jpg');
      mockWebflow.getAllElements.mockResolvedValue([imgEl]);

      const api = new WebflowDesignerExtensionAPI();
      await expect(
        api.updateImageAltText('https://cdn.example.com/missing.jpg', 'alt text')
      ).rejects.toThrow(/No image element found/);
    });

    it('only sets alt on the matching image, not others', async () => {
      const imgA = makeImageElement('https://cdn.example.com/a.jpg');
      const imgB = makeImageElement('https://cdn.example.com/b.jpg');
      mockWebflow.getAllElements.mockResolvedValue([imgA, imgB]);

      const api = new WebflowDesignerExtensionAPI();
      await api.updateImageAltText('https://cdn.example.com/b.jpg', 'Image B');

      expect(imgA.setAltText).not.toHaveBeenCalled();
      expect(imgB.setAltText).toHaveBeenCalledWith('Image B');
    });

    it('falls back to setAttribute when setAltText is not available', async () => {
      const legacyEl = {
        id: 'legacy-img',
        type: 'Image',
        getAsset: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/old.jpg' }),
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
      };
      mockWebflow.getAllElements.mockResolvedValue([legacyEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText('https://cdn.example.com/old.jpg', 'Old image');

      expect(result).toBe(true);
      expect(legacyEl.setAttribute).toHaveBeenCalledWith('alt', 'Old image');
    });

    // --- Strategy 3: Asset ID matching (id-only assets) ---

    function makeImageElementWithIdOnlyAsset(assetId: string) {
      return {
        id: `el-${assetId}`,
        type: 'Image',
        getAsset: vi.fn().mockResolvedValue({ id: assetId }),
        setAltText: vi.fn().mockResolvedValue(undefined),
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
        getChildren: vi.fn().mockResolvedValue([]),
      };
    }

    function makeContainerElement(type: string, children: any[]) {
      return {
        id: `container-${type}-${Math.random().toString(36).slice(2, 6)}`,
        type: type,
        getChildren: vi.fn().mockResolvedValue(children),
        getAsset: vi.fn().mockResolvedValue(null),
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
      };
    }

    it('matches image element when getAsset returns only id (no url/name) by matching asset id in CDN URL', async () => {
      const imgEl = makeImageElementWithIdOnlyAsset('68c211e5313bc4211ca80d70');
      mockWebflow.getAllElements.mockResolvedValue([imgEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText(
        'https://cdn.prod.website-files.com/68c21170aff0f4d27d738f9e/68c211e5313bc4211ca80d70_Logo-wide.svg',
        'New alt text'
      );

      expect(result).toBe(true);
      expect(imgEl.setAltText).toHaveBeenCalledWith('New alt text');
    });

    it('matches asset id in URL regardless of file extension or query params', async () => {
      const assetId = 'abc123def456789012345678';

      const urls = [
        `https://cdn.prod.website-files.com/site123/${assetId}_photo.jpg`,
        `https://cdn.prod.website-files.com/site123/${assetId}_photo.webp?quality=80`,
        `https://cdn.prod.website-files.com/site123/${assetId}_image.svg`,
      ];

      for (const url of urls) {
        vi.clearAllMocks();
        const imgEl = makeImageElementWithIdOnlyAsset(assetId);
        mockWebflow.getAllElements.mockResolvedValue([imgEl]);

        const api = new WebflowDesignerExtensionAPI();
        const result = await api.updateImageAltText(url, 'Alt text');

        expect(result).toBe(true);
        expect(imgEl.setAltText).toHaveBeenCalledWith('Alt text');
      }
    });

    it('does not match when asset id is not found in the target URL', async () => {
      const imgEl = makeImageElementWithIdOnlyAsset('aaaaaaaaaaaaaaaaaaaaaaaa');
      mockWebflow.getAllElements.mockResolvedValue([imgEl]);

      const api = new WebflowDesignerExtensionAPI();
      await expect(
        api.updateImageAltText(
          'https://cdn.prod.website-files.com/site123/bbbbbbbbbbbbbbbbbbbbbbbb_photo.jpg',
          'alt text'
        )
      ).rejects.toThrow(/No image element found/);
    });

    it('prefers getAsset URL match (Strategy 1) over asset ID match (Strategy 3) when URL is available', async () => {
      const urlMatchEl = makeImageElement('https://cdn.prod.website-files.com/site123/abc123_photo.jpg');
      const idMatchEl = makeImageElementWithIdOnlyAsset('abc123');
      mockWebflow.getAllElements.mockResolvedValue([urlMatchEl, idMatchEl]);

      const api = new WebflowDesignerExtensionAPI();
      await api.updateImageAltText(
        'https://cdn.prod.website-files.com/site123/abc123_photo.jpg',
        'Preferred'
      );

      expect(urlMatchEl.setAltText).toHaveBeenCalledWith('Preferred');
      expect(idMatchEl.setAltText).not.toHaveBeenCalled();
    });

    it('handles getAsset returning null gracefully and falls through to next strategy', async () => {
      const nullAssetEl = {
        id: 'null-asset',
        type: 'Image',
        getAsset: vi.fn().mockResolvedValue(null),
        setAltText: vi.fn().mockResolvedValue(undefined),
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
      };
      const idMatchEl = makeImageElementWithIdOnlyAsset('68c211e5313bc4211ca80d70');
      mockWebflow.getAllElements.mockResolvedValue([nullAssetEl, idMatchEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText(
        'https://cdn.prod.website-files.com/site123/68c211e5313bc4211ca80d70_Logo.svg',
        'Fallthrough alt'
      );

      expect(result).toBe(true);
      expect(nullAssetEl.setAltText).not.toHaveBeenCalled();
      expect(idMatchEl.setAltText).toHaveBeenCalledWith('Fallthrough alt');
    });

    it('selects the correct image from multiple elements when all have id-only assets', async () => {
      const img1 = makeImageElementWithIdOnlyAsset('aaaa11112222333344445555');
      const img2 = makeImageElementWithIdOnlyAsset('bbbb11112222333344445555');
      const img3 = makeImageElementWithIdOnlyAsset('cccc11112222333344445555');
      mockWebflow.getAllElements.mockResolvedValue([img1, img2, img3]);

      const api = new WebflowDesignerExtensionAPI();
      await api.updateImageAltText(
        'https://cdn.prod.website-files.com/site123/bbbb11112222333344445555_banner.webp',
        'Banner image'
      );

      expect(img1.setAltText).not.toHaveBeenCalled();
      expect(img2.setAltText).toHaveBeenCalledWith('Banner image');
      expect(img3.setAltText).not.toHaveBeenCalled();
    });

    // --- Strategy 4: Nested image traversal via getChildren() ---

    it('finds image element nested inside a Link element by traversing children', async () => {
      const nestedImg = makeImageElementWithIdOnlyAsset('68c211e5313bc4211ca80d70');
      const linkEl = makeContainerElement('Link', [nestedImg]);
      // Only the Link is in the top-level elements — the Image is nested
      mockWebflow.getAllElements.mockResolvedValue([linkEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText(
        'https://cdn.prod.website-files.com/site123/68c211e5313bc4211ca80d70_Logo-wide.svg',
        'Logo alt text'
      );

      expect(result).toBe(true);
      expect(nestedImg.setAltText).toHaveBeenCalledWith('Logo alt text');
    });

    it('finds image element nested inside a ComponentInstance by traversing children recursively', async () => {
      const deepImg = makeImageElementWithIdOnlyAsset('aabb11223344556677889900');
      const innerBlock = makeContainerElement('Block', [deepImg]);
      const componentEl = makeContainerElement('ComponentInstance', [innerBlock]);
      mockWebflow.getAllElements.mockResolvedValue([componentEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText(
        'https://cdn.prod.website-files.com/site123/aabb11223344556677889900_hero.webp',
        'Hero image'
      );

      expect(result).toBe(true);
      expect(deepImg.setAltText).toHaveBeenCalledWith('Hero image');
    });

    it('prefers top-level Image match over nested Image when both exist', async () => {
      const topLevelImg = makeImageElementWithIdOnlyAsset('deadbeef12345678abcdef00');
      const nestedImg = makeImageElementWithIdOnlyAsset('deadbeef12345678abcdef00');
      const linkEl = makeContainerElement('Link', [nestedImg]);
      mockWebflow.getAllElements.mockResolvedValue([topLevelImg, linkEl]);

      const api = new WebflowDesignerExtensionAPI();
      await api.updateImageAltText(
        'https://cdn.prod.website-files.com/site123/deadbeef12345678abcdef00_photo.jpg',
        'Top level wins'
      );

      expect(topLevelImg.setAltText).toHaveBeenCalledWith('Top level wins');
      expect(nestedImg.setAltText).not.toHaveBeenCalled();
    });

    it('handles elements where getChildren is not available or throws', async () => {
      const noChildrenEl = {
        id: 'no-children',
        type: 'Link',
        getAsset: vi.fn().mockResolvedValue(null),
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
        // No getChildren method
      };
      const throwingEl = {
        id: 'throwing',
        type: 'Block',
        getChildren: vi.fn().mockRejectedValue(new Error('API error')),
        getAsset: vi.fn().mockResolvedValue(null),
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
      };
      const validImg = makeImageElementWithIdOnlyAsset('ff00ff00ff00ff00ff00ff00');
      const linkWithImg = makeContainerElement('Link', [validImg]);
      mockWebflow.getAllElements.mockResolvedValue([noChildrenEl, throwingEl, linkWithImg]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText(
        'https://cdn.prod.website-files.com/site123/ff00ff00ff00ff00ff00ff00_icon.svg',
        'Icon alt'
      );

      expect(result).toBe(true);
      expect(validImg.setAltText).toHaveBeenCalledWith('Icon alt');
    });
  });

  describe('getApplyableImageAssetIds', () => {
    it('returns a Set of asset IDs from all top-level Image elements', async () => {
      const img1 = {
        id: 'el-1', type: 'Image',
        getAsset: vi.fn().mockResolvedValue({ id: 'abc123' }),
        getAttribute: vi.fn(() => null),
      };
      const img2 = {
        id: 'el-2', type: 'Image',
        getAsset: vi.fn().mockResolvedValue({ id: 'def456' }),
        getAttribute: vi.fn(() => null),
      };
      const img3 = {
        id: 'el-3', type: 'Image',
        getAsset: vi.fn().mockResolvedValue({ id: 'ghi789' }),
        getAttribute: vi.fn(() => null),
      };
      const blockEl = {
        id: 'block-1', type: 'Block',
        getAttribute: vi.fn(() => null),
      };
      mockWebflow.getAllElements.mockResolvedValue([img1, blockEl, img2, img3]);

      const api = new WebflowDesignerExtensionAPI();
      const ids = await api.getApplyableImageAssetIds();

      expect(ids).toEqual(new Set(['abc123', 'def456', 'ghi789']));
    });

    it('returns empty set when no Image elements exist', async () => {
      const blockEl = { id: 'block-1', type: 'Block', getAttribute: vi.fn(() => null) };
      mockWebflow.getAllElements.mockResolvedValue([blockEl]);

      const api = new WebflowDesignerExtensionAPI();
      const ids = await api.getApplyableImageAssetIds();

      expect(ids).toEqual(new Set());
    });

    it('skips Image elements where getAsset fails or returns null', async () => {
      const throwingImg = {
        id: 'el-throw', type: 'Image',
        getAsset: vi.fn().mockRejectedValue(new Error('API error')),
        getAttribute: vi.fn(() => null),
      };
      const nullImg = {
        id: 'el-null', type: 'Image',
        getAsset: vi.fn().mockResolvedValue(null),
        getAttribute: vi.fn(() => null),
      };
      const validImg = {
        id: 'el-valid', type: 'Image',
        getAsset: vi.fn().mockResolvedValue({ id: 'valid123' }),
        getAttribute: vi.fn(() => null),
      };
      mockWebflow.getAllElements.mockResolvedValue([throwingImg, nullImg, validImg]);

      const api = new WebflowDesignerExtensionAPI();
      const ids = await api.getApplyableImageAssetIds();

      expect(ids).toEqual(new Set(['valid123']));
    });
  });
});