import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import 'jest-environment-jsdom';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 

// Mock notifications
jest.mock('./utils/notifications', () => ({
  NotificationSystem: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    notifyAchievementUnlock: jest.fn(),
  },
}));

// Mock sounds
jest.mock('./contexts/SoundContext', () => ({
  useSoundContext: () => ({
    play_sound: jest.fn(),
  }),
})); 