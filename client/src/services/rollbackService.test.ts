/**
 * TDD Tests for Enhanced Rollback Service
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RollbackService } from './rollbackService';
import type { 
  WebflowInsertionRequest,
  WebflowInsertionResult,
  WebflowBatchInsertionResult
} from '../types/webflow-data-api';

// Mock WebflowInsertion
const mockWebflowInsertion = {
  rollback: vi.fn(),
  apply: vi.fn(),
  applyBatch: vi.fn(),
};

describe('Enhanced Rollback Service', () => {
  let rollbackService: RollbackService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage to ensure clean state
    localStorage.clear();
    rollbackService = new RollbackService();
  });

  afterEach(() => {
    rollbackService.cleanup();
  });

  describe('Change Tracking', () => {
    it('should track changes from batch operations', async () => {
      const batchResult: WebflowBatchInsertionResult = {
        success: true,
        results: [
          { success: true, data: { _id: 'page_1', title: 'New Title' } },
          { success: true, data: { _id: 'page_2', title: 'Another Title' } },
        ],
        succeeded: 2,
        failed: 0,
        rollbackId: 'rollback_123',
      };

      const originalData = {
        page_1: { title: 'Old Title', seo: { description: 'Old Desc' } },
        page_2: { title: 'Old Title 2', seo: { description: 'Old Desc 2' } },
      };

      rollbackService.trackBatchOperation(batchResult, originalData);

      const changeLog = rollbackService.getChangeLog('rollback_123');
      
      expect(changeLog).toEqual({
        rollbackId: 'rollback_123',
        timestamp: expect.any(Number),
        totalChanges: 2,
        changes: expect.arrayContaining([
          expect.objectContaining({
            resourceId: 'page_1',
            field: 'title',
            before: 'Old Title',
            after: 'New Title',
            changeType: 'update',
          }),
          expect.objectContaining({
            resourceId: 'page_2',
            field: 'title',
            before: 'Old Title 2',
            after: 'Another Title',
            changeType: 'update',
          }),
        ]),
        status: 'completed',
      });
    });

    it('should track partial failures in batch operations', async () => {
      const batchResult: WebflowBatchInsertionResult = {
        success: false,
        results: [
          { success: true, data: { _id: 'page_1', title: 'New Title' } },
          { success: false, error: { err: 'Validation Error', code: 400, msg: 'Invalid title' } },
        ],
        succeeded: 1,
        failed: 1,
        rollbackId: 'rollback_456',
      };

      const originalData = {
        page_1: { title: 'Old Title' },
        page_2: { title: 'Old Title 2' },
      };

      rollbackService.trackBatchOperation(batchResult, originalData);

      const changeLog = rollbackService.getChangeLog('rollback_456');
      
      expect(changeLog?.changes).toHaveLength(1); // Only successful change tracked
      expect(changeLog?.status).toBe('partial_failure');
    });
  });

  describe('Rollback Execution', () => {
    it('should execute rollback with progress tracking', async () => {
      const changeLog = {
        rollbackId: 'rollback_789',
        timestamp: Date.now(),
        totalChanges: 3,
        changes: [
          {
            resourceId: 'page_1',
            field: 'title',
            before: 'Old Title',
            after: 'New Title',
            changeType: 'update' as const,
          },
          {
            resourceId: 'page_1',
            field: 'seo.description',
            before: 'Old Description',
            after: 'New Description',
            changeType: 'update' as const,
          },
          {
            resourceId: 'page_2',
            field: 'title',
            before: 'Old Title 2',
            after: 'New Title 2',
            changeType: 'update' as const,
          },
        ],
        status: 'completed' as const,
      };

      // Setup service with change log
      rollbackService.trackChangeLog('rollback_789', changeLog);

      // Mock successful rollback
      mockWebflowInsertion.rollback.mockResolvedValue({
        success: true,
      });

      const progressCallback = vi.fn();
      
      const result = await rollbackService.executeRollback(
        'rollback_789',
        mockWebflowInsertion as any,
        progressCallback
      );

      expect(result).toEqual({
        success: true,
        totalChanges: 3,
        rolledBack: 3,
        failed: 0,
        duration: expect.any(Number),
      });

      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 3,
        percentage: 0,
        currentChange: changeLog.changes[0],
      });

      expect(progressCallback).toHaveBeenCalledWith({
        current: 3,
        total: 3,
        percentage: 100,
        currentChange: changeLog.changes[2],
      });

      expect(mockWebflowInsertion.rollback).toHaveBeenCalledWith('rollback_789');
    });

    it('should handle rollback failures gracefully', async () => {
      const changeLog = {
        rollbackId: 'rollback_fail',
        timestamp: Date.now(),
        totalChanges: 2,
        changes: [
          {
            resourceId: 'page_1',
            field: 'title',
            before: 'Old Title',
            after: 'New Title',
            changeType: 'update' as const,
          },
          {
            resourceId: 'page_2',
            field: 'title',
            before: 'Old Title 2',
            after: 'New Title 2',
            changeType: 'update' as const,
          },
        ],
        status: 'completed' as const,
      };

      rollbackService.trackChangeLog('rollback_fail', changeLog);

      // Mock failed rollback
      mockWebflowInsertion.rollback.mockResolvedValue({
        success: false,
        errors: ['Failed to rollback page_1', 'Failed to rollback page_2'],
      });

      const result = await rollbackService.executeRollback(
        'rollback_fail',
        mockWebflowInsertion as any
      );

      expect(result).toEqual({
        success: false,
        totalChanges: 2,
        rolledBack: 0,
        failed: 2,
        errors: ['Failed to rollback page_1', 'Failed to rollback page_2'],
        duration: expect.any(Number),
      });
    });

    it('should validate rollback eligibility', () => {
      const recentChangeLog = {
        rollbackId: 'rollback_recent',
        timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
        totalChanges: 1,
        changes: [],
        status: 'completed' as const,
      };

      const oldChangeLog = {
        rollbackId: 'rollback_old',
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        totalChanges: 1,
        changes: [],
        status: 'completed' as const,
      };

      rollbackService.trackChangeLog('rollback_recent', recentChangeLog);
      rollbackService.trackChangeLog('rollback_old', oldChangeLog);

      expect(rollbackService.isRollbackEligible('rollback_recent')).toBe(true);
      expect(rollbackService.isRollbackEligible('rollback_old')).toBe(false);
      expect(rollbackService.isRollbackEligible('nonexistent')).toBe(false);
    });
  });

  describe('Change History Management', () => {
    it('should provide change history for a resource', () => {
      const changeLog1 = {
        rollbackId: 'rollback_1',
        timestamp: Date.now() - 10000,
        totalChanges: 1,
        changes: [
          {
            resourceId: 'page_1',
            field: 'title',
            before: 'Original Title',
            after: 'First Change',
            changeType: 'update' as const,
          },
        ],
        status: 'completed' as const,
      };

      const changeLog2 = {
        rollbackId: 'rollback_2',
        timestamp: Date.now() - 5000,
        totalChanges: 1,
        changes: [
          {
            resourceId: 'page_1',
            field: 'title',
            before: 'First Change',
            after: 'Second Change',
            changeType: 'update' as const,
          },
        ],
        status: 'completed' as const,
      };

      rollbackService.trackChangeLog('rollback_1', changeLog1);
      rollbackService.trackChangeLog('rollback_2', changeLog2);

      const history = rollbackService.getResourceHistory('page_1');

      expect(history).toEqual({
        resourceId: 'page_1',
        changes: expect.arrayContaining([
          expect.objectContaining({
            rollbackId: 'rollback_2',
            timestamp: changeLog2.timestamp,
            field: 'title',
            before: 'First Change',
            after: 'Second Change',
          }),
          expect.objectContaining({
            rollbackId: 'rollback_1',
            timestamp: changeLog1.timestamp,
            field: 'title',
            before: 'Original Title',
            after: 'First Change',
          }),
        ]),
        totalChanges: 2,
      });
    });

    it('should support change log persistence', async () => {
      const changeLog = {
        rollbackId: 'rollback_persist',
        timestamp: Date.now(),
        totalChanges: 1,
        changes: [
          {
            resourceId: 'page_1',
            field: 'title',
            before: 'Old',
            after: 'New',
            changeType: 'update' as const,
          },
        ],
        status: 'completed' as const,
      };

      // Track and persist
      rollbackService.trackChangeLog('rollback_persist', changeLog);
      await rollbackService.persistChangeLog('rollback_persist');

      // Create new instance and restore
      const newService = new RollbackService();
      await newService.restoreChangeLog('rollback_persist');

      const restored = newService.getChangeLog('rollback_persist');
      expect(restored).toEqual(changeLog);

      newService.cleanup();
    });

    it('should cleanup old change logs automatically', () => {
      const oldLog = {
        rollbackId: 'rollback_old',
        timestamp: Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
        totalChanges: 1,
        changes: [],
        status: 'completed' as const,
      };

      const recentLog = {
        rollbackId: 'rollback_recent',
        timestamp: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
        totalChanges: 1,
        changes: [],
        status: 'completed' as const,
      };

      rollbackService.trackChangeLog('rollback_old', oldLog);
      rollbackService.trackChangeLog('rollback_recent', recentLog);

      rollbackService.cleanupOldChangeLogs();

      expect(rollbackService.getChangeLog('rollback_old')).toBeNull();
      expect(rollbackService.getChangeLog('rollback_recent')).not.toBeNull();
    });
  });

  describe('Rollback Preview', () => {
    it('should generate rollback preview', () => {
      const changeLog = {
        rollbackId: 'rollback_preview',
        timestamp: Date.now(),
        totalChanges: 2,
        changes: [
          {
            resourceId: 'page_1',
            field: 'title',
            before: 'Old Title',
            after: 'New Title',
            changeType: 'update' as const,
          },
          {
            resourceId: 'page_1',
            field: 'seo.description',
            before: 'Old Description',
            after: 'New Description',
            changeType: 'update' as const,
          },
        ],
        status: 'completed' as const,
      };

      rollbackService.trackChangeLog('rollback_preview', changeLog);

      const preview = rollbackService.generateRollbackPreview('rollback_preview');

      expect(preview).toEqual({
        rollbackId: 'rollback_preview',
        affectedResources: ['page_1'],
        totalChanges: 2,
        changes: [
          {
            resourceId: 'page_1',
            field: 'title',
            currentValue: 'New Title',
            willRestoreTo: 'Old Title',
          },
          {
            resourceId: 'page_1',
            field: 'seo.description',
            currentValue: 'New Description',
            willRestoreTo: 'Old Description',
          },
        ],
        estimatedTime: expect.any(Number),
        riskLevel: expect.stringMatching(/low|medium|high/),
      });
    });
  });
});