import React from 'react';
import { render } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import { TournamentProvider } from '../contexts/TournamentContext';
import { GameProvider } from '../contexts/GameContext';
import { MemoryRouter } from 'react-router-dom';
import { initialGameState } from '../contexts/game/initialState';

interface ProvidersProps {
  children: React.ReactNode;
  initialGameState?: typeof initialGameState;
}

export const AllTheProviders = ({ children, initialGameState: gameState = initialGameState }: ProvidersProps) => {
  return (
    <MemoryRouter>
      <AuthProvider>
        <LanguageProvider>
          <GameProvider initialState={gameState} skipInitialLoad={true}>
            <TournamentProvider>
              {children}
            </TournamentProvider>
          </GameProvider>
        </LanguageProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  { initialGameState: gameState = initialGameState } = {}
) => {
  return render(ui, { 
    wrapper: ({ children }) => (
      <AllTheProviders initialGameState={gameState}>
        {children}
      </AllTheProviders>
    )
  });
};

// Mock data
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  level: 1,
  xp: 0,
  coins: 0,
};

export const mockTournament = {
  id: 'test-tournament-id',
  name: 'Test Tournament',
  status: 'active',
  current_round: 1,
  total_rounds: 3,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 86400000).toISOString(),
};

// Mock functions
export const mockFunctions = {
  simulateAPIError: () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));
  },
  clearMocks: () => {
    vi.clearAllMocks();
  }
}; 