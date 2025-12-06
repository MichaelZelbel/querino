import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Polyfill PointerEvent for Radix UI
window.PointerEvent = class PointerEvent extends Event {
    constructor(type: string, props: PointerEventInit = {}) {
        super(type, props);
        (this as any).pointerId = props.pointerId || 0;
        (this as any).width = props.width || 0;
        (this as any).height = props.height || 0;
        (this as any).pressure = props.pressure || 0;
        (this as any).tangentialPressure = props.tangentialPressure || 0;
        (this as any).tiltX = props.tiltX || 0;
        (this as any).tiltY = props.tiltY || 0;
        (this as any).twist = props.twist || 0;
        (this as any).pointerType = props.pointerType || '';
        (this as any).isPrimary = props.isPrimary || false;
    }
} as any;

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();

Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(),
        readText: vi.fn(),
    },
});
