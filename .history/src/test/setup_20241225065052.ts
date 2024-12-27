import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Add Jest compatibility layer
global.jest = vi;
global.expect = expect;

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.load = vi.fn();
window.HTMLMediaElement.prototype.play = vi.fn();
window.HTMLMediaElement.prototype.pause = vi.fn();

// Mock Audio
class AudioMock {
  load = vi.fn();
  play = vi.fn();
  pause = vi.fn();
}
global.Audio = AudioMock as any; 