import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AlertTriangle, CircleAlert, Info } from 'lucide-react';
import React from 'react';

type Priority = 'high' | 'medium' | 'low' | 'unknown';

const getPriorityIcon = (priority: Priority, className: string = "h-4 w-4"): React.ReactElement | null => {
    switch (priority) {
        case 'high':
            return <AlertTriangle className={`${className} text-redText`} />;
        case 'medium':
            return <CircleAlert className={`${className} text-yellowText`} />;
        case 'low':
            return <Info className={`${className} text-blueText`} />;
        default:
            return null;
    }
};

describe('getPriorityIcon', () => {
    it('should return AlertTriangle icon for high priority', () => {
        const iconElement = getPriorityIcon('high');
        const { container } = render(iconElement);
        const svgElement = container.querySelector('svg');
        expect(svgElement).not.toBeNull();
        expect(svgElement).toHaveClass('lucide-triangle-alert');
        expect(svgElement).toHaveClass('h-4', 'w-4', 'text-redText');
    });

    it('should return CircleAlert icon for medium priority', () => {
        const iconElement = getPriorityIcon('medium');
        const { container } = render(iconElement);
        const svgElement = container.querySelector('svg');
        expect(svgElement).not.toBeNull();
        expect(svgElement).toHaveClass('lucide-circle-alert');
        expect(svgElement).toHaveClass('h-4', 'w-4', 'text-yellowText');
    });

    it('should return Info icon for low priority', () => {
        const iconElement = getPriorityIcon('low');
        const { container } = render(iconElement);
        const svgElement = container.querySelector('svg');
        expect(svgElement).not.toBeNull();
        expect(svgElement).toHaveClass('lucide-info');
        expect(svgElement).toHaveClass('h-4', 'w-4', 'text-blueText');
    });

    it('should return null for unknown priority', () => {
        const iconElement = getPriorityIcon('unknown');
        const { container } = render(iconElement);
        expect(container.firstChild).toBeNull();
        expect(iconElement).toBeNull();
    });

    it('should apply custom className when provided', () => {
        const customClass = 'custom-size text-custom';
        const iconElement = getPriorityIcon('high', customClass);
        const { container } = render(iconElement);
        const svgElement = container.querySelector('svg');
        expect(svgElement).not.toBeNull();
        expect(svgElement).toHaveClass('lucide-triangle-alert');
        expect(svgElement).toHaveClass(...customClass.split(' '));
        expect(svgElement).toHaveClass('text-redText');
        expect(svgElement).not.toHaveClass('h-4');
        expect(svgElement).not.toHaveClass('w-4');
    });

    it('should use default className if none is provided', () => {
        const iconElement = getPriorityIcon('medium');
        const { container } = render(iconElement);
        const svgElement = container.querySelector('svg');
        expect(svgElement).not.toBeNull();
        expect(svgElement).toHaveClass('h-4', 'w-4');
    });
});