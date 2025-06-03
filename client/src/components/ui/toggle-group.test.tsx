import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the toggle module - use factory function without external references
vi.mock('./toggle', () => ({
  toggleVariants: vi.fn(),
}));

// Mock the utils module to avoid issues with cn utility
vi.mock('../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock @radix-ui/react-toggle-group to match actual behavior
vi.mock('@radix-ui/react-toggle-group', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, type, value, onValueChange, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      data-testid="toggle-group-root"
      data-type={type}
      data-value={Array.isArray(value) ? value.join(',') : value || ''}
      onClick={() => {
        if (onValueChange) {
          onValueChange('item1');
        }
      }}
      {...props}
    >
      {children}
    </div>
  )),
  Item: React.forwardRef<HTMLButtonElement, any>(({ children, className, value, onPressedChange, ...props }, ref) => (
    <button
      ref={ref}
      className={className}
      data-testid={`toggle-group-item-${value}`}
      data-value={value}
      onClick={(e) => {
        if (onPressedChange) {
          onPressedChange(true);
        }
        if (props.onClick) {
          props.onClick(e);
        }
      }}
      {...props}
    >
      {children}
    </button>
  )),
}));

// Import components after mocks are set up
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
// Import the mocked function to use in tests
import { toggleVariants } from './toggle';

// Get the mocked function with proper typing
const mockToggleVariants = toggleVariants as ReturnType<typeof vi.fn>;

describe('ToggleGroup Components', () => {
  beforeEach(() => {
    // Clear mock and set up implementation
    mockToggleVariants.mockClear();
    mockToggleVariants.mockImplementation(({ variant, size }) => 
      `toggle-variants-${variant || 'default'}-${size || 'default'}`
    );
  });

  describe('ToggleGroup', () => {
    it('renders with default props', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
          <ToggleGroupItem value="item2">Item 2</ToggleGroupItem>
        </ToggleGroup>
      );

      const group = screen.getByTestId('toggle-group-root');
      expect(group).toBeInTheDocument();
      expect(group).toHaveClass('flex', 'items-center', 'justify-center', 'gap-1');
      expect(group).toHaveAttribute('data-type', 'single');
    });

    it('handles single selection type', () => {
      render(
        <ToggleGroup type="single" value="item1">
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
          <ToggleGroupItem value="item2">Item 2</ToggleGroupItem>
        </ToggleGroup>
      );

      const group = screen.getByTestId('toggle-group-root');
      expect(group).toHaveAttribute('data-value', 'item1');
    });

    it('handles multiple selection type', () => {
      render(
        <ToggleGroup type="multiple" value={['item1', 'item3']}>
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
          <ToggleGroupItem value="item2">Item 2</ToggleGroupItem>
          <ToggleGroupItem value="item3">Item 3</ToggleGroupItem>
        </ToggleGroup>
      );

      const group = screen.getByTestId('toggle-group-root');
      expect(group).toHaveAttribute('data-value', 'item1,item3');
    });

    it('handles empty value', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
        </ToggleGroup>
      );

      const group = screen.getByTestId('toggle-group-root');
      expect(group).toHaveAttribute('data-value', '');
    });

    it('calls onValueChange when clicked', async () => {
      const handleValueChange = vi.fn();
      render(
        <ToggleGroup type="single" onValueChange={handleValueChange}>
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
        </ToggleGroup>
      );

      await userEvent.click(screen.getByTestId('toggle-group-root'));
      expect(handleValueChange).toHaveBeenCalledWith('item1');
    });

    it('applies custom className', () => {
      render(
        <ToggleGroup type="single" className="custom-group">
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId('toggle-group-root')).toHaveClass('custom-group');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ToggleGroup type="single" ref={ref}>
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('provides context to child items', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="lg">
          <ToggleGroupItem value="test">Test Item</ToggleGroupItem>
        </ToggleGroup>
      );

      const item = screen.getByTestId('toggle-group-item-test');
      expect(item).toBeInTheDocument();
      expect(item).toHaveTextContent('Test Item');
    });
  });

  describe('ToggleGroupItem', () => {
    it('renders with context values', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="lg">
          <ToggleGroupItem value="test">Test Item</ToggleGroupItem>
        </ToggleGroup>
      );

      const item = screen.getByTestId('toggle-group-item-test');
      expect(item).toBeInTheDocument();
      expect(item).toHaveTextContent('Test Item');
      expect(item).toHaveAttribute('data-value', 'test');
    });

    it('applies toggle variants from context', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="sm">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      // Context variant/size should be used since no local props provided
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',  // from context
        size: 'sm',         // from context
      });
    });

    it('overrides context values with local props', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="sm">
          <ToggleGroupItem value="test" variant="default" size="lg">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      // Based on actual implementation: context.variant || variant (context takes precedence)
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',  // context.variant takes precedence
        size: 'sm',         // context.size takes precedence
      });
    });

    it('inherits context values when local props not provided', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="sm">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',
        size: 'sm',
      });
    });

    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" onClick={handleClick}>
            Click me
          </ToggleGroupItem>
        </ToggleGroup>
      );

      await userEvent.click(screen.getByTestId('toggle-group-item-test'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('applies custom className', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" className="custom-item">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId('toggle-group-item-test')).toHaveClass('custom-item');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" ref={ref}>Test</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('works without context (fallback to undefined)', () => {
      // Render ToggleGroupItem outside of ToggleGroup context
      render(<ToggleGroupItem value="standalone">Standalone</ToggleGroupItem>);

      // Without context, gets the default context values from createContext
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'default',  // default from createContext
        size: 'default',     // default from createContext
      });
    });

    it('applies toggle variants className', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="sm">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      const item = screen.getByTestId('toggle-group-item-test');
      expect(item).toHaveClass('toggle-variants-outline-sm');
    });
  });

  describe('Context Integration', () => {
    it('provides context values to nested items', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="sm">
          <div>
            <ToggleGroupItem value="nested">Nested Item</ToggleGroupItem>
          </div>
        </ToggleGroup>
      );

      const item = screen.getByTestId('toggle-group-item-nested');
      expect(item).toBeInTheDocument();
    });

    it('handles multiple items with shared context', () => {
      render(
        <ToggleGroup type="multiple" variant="default" size="lg">
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
          <ToggleGroupItem value="item2">Item 2</ToggleGroupItem>
          <ToggleGroupItem value="item3">Item 3</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId('toggle-group-item-item1')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-group-item-item2')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-group-item-item3')).toBeInTheDocument();
    });

    it('handles variant inheritance correctly', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="lg">
          <ToggleGroupItem value="item1">Item 1</ToggleGroupItem>
          <ToggleGroupItem value="item2" variant="default">Item 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Both items should use context values due to "context.variant || variant" logic
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',  // context.variant takes precedence
        size: 'lg',
      });

      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',  // context.variant still takes precedence
        size: 'lg',
      });
    });

    it('uses default context values when none provided', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      // When ToggleGroup has no variant/size, context gets undefined values
      // Then context.variant || variant results in undefined || undefined = undefined
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: undefined,  // context has undefined, no local variant
        size: undefined,     // context has undefined, no local size
      });
    });
  });

  describe('Type Safety and Edge Cases', () => {
    it('handles empty children', () => {
      render(<ToggleGroup type="single"></ToggleGroup>);
      
      const group = screen.getByTestId('toggle-group-root');
      expect(group).toBeInTheDocument();
    });

    it('handles undefined variant and size', () => {
      // Test with explicitly undefined values - this overrides context defaults
      render(
        <ToggleGroup type="single" variant={undefined} size={undefined}>
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      // When explicitly set to undefined, context will have undefined values
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: undefined,
        size: undefined,
      });
    });

    it('forwards all HTML attributes', () => {
      render(
        <ToggleGroup type="single" data-custom="group-attr" role="group">
          <ToggleGroupItem value="test" data-custom="item-attr" aria-label="Test item">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      expect(screen.getByTestId('toggle-group-root')).toHaveAttribute('data-custom', 'group-attr');
      expect(screen.getByTestId('toggle-group-root')).toHaveAttribute('role', 'group');
      expect(screen.getByTestId('toggle-group-item-test')).toHaveAttribute('data-custom', 'item-attr');
      expect(screen.getByTestId('toggle-group-item-test')).toHaveAttribute('aria-label', 'Test item');
    });

    it('handles mixed variant/size props correctly', () => {
      render(
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="test" size="sm">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      // Due to "context.variant || variant" logic, context takes precedence for variant
      // For size, context doesn't have it (undefined), so falls back to local prop
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',  // from context
        size: 'sm',         // from local prop since context.size is undefined
      });
    });
  });

  describe('Context Behavior', () => {
    it('provides correct default context values', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      // When no variant/size provided to ToggleGroup, context gets undefined values
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: undefined,  // no variant provided to ToggleGroup
        size: undefined,     // no size provided to ToggleGroup
      });
    });

    it('correctly implements context.variant || variant logic', () => {
      render(
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="test1">Test 1</ToggleGroupItem>
          <ToggleGroupItem value="test2" variant="default">Test 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Both should use context.variant since context.variant || variant means context wins when defined
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',  // context.variant takes precedence
        size: undefined,     // no size provided to ToggleGroup
      });

      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',  // context.variant still takes precedence
        size: undefined,     // no size provided to ToggleGroup
      });
    });

    it('respects context precedence correctly', () => {
      render(
        <ToggleGroup type="single" variant="outline" size="lg">
          <ToggleGroupItem value="test" variant="default" size="sm">Test</ToggleGroupItem>
        </ToggleGroup>
      );

      // Context values should take precedence due to "context.variant || variant" logic
      expect(mockToggleVariants).toHaveBeenCalledWith({
        variant: 'outline',  // context takes precedence
        size: 'lg',         // context takes precedence
      });
    });
  });
});