import { render, act, fireEvent, waitFor } from '@testing-library/react';
import { TournamentProvider } from '../../contexts/TournamentContext';
import { TournamentList } from '../../components/Tournament/TournamentList';
import { TournamentBracket } from '../../components/Tournament/TournamentBracket';
import { MatchView } from '../../components/Tournament/MatchView';
import { TEST_MOCKS } from '../../types/tournament.TODO';

// Setup do ambiente de teste
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TournamentProvider>
      {ui}
    </TournamentProvider>
  );
};

describe('Tournament Integration Flow', () => {
  beforeEach(() => {
    // Reset mocks e estado
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should handle complete tournament flow', async () => {
    const { getByText, getByTestId } = renderWithProviders(
      <>
        <TournamentList />
        <TournamentBracket tournament_id="test-tournament" />
      </>
    );

    // 1. Verificar listagem de torneios
    await waitFor(() => {
      expect(getByText('Tournament Test')).toBeInTheDocument();
    });

    // 2. Registrar no torneio
    const registerButton = getByText('tournament.register');
    await act(async () => {
      fireEvent.click(registerButton);
    });

    // 3. Verificar bracket atualizado
    await waitFor(() => {
      expect(getByTestId('tournament-bracket')).toHaveTextContent('Player 1');
    });

    // 4. Iniciar partida
    const startMatchButton = getByText('tournament.start_match');
    await act(async () => {
      fireEvent.click(startMatchButton);
    });

    // 5. Verificar view da partida
    await waitFor(() => {
      expect(getByTestId('match-view')).toBeInTheDocument();
    });
  });

  it('should handle match progression correctly', async () => {
    const { getByTestId, getByText } = renderWithProviders(
      <MatchView match_id="test-match" />
    );

    // 1. Responder questões
    for (let i = 0; i < 3; i++) {
      const answerButton = getByTestId(`answer-option-0`);
      await act(async () => {
        fireEvent.click(answerButton);
      });

      // Verificar atualização do score
      await waitFor(() => {
        const scoreElement = getByTestId('match-score');
        expect(scoreElement).toHaveTextContent(/\d+/);
      });
    }

    // 2. Verificar conclusão da partida
    await waitFor(() => {
      expect(getByText('match.completed')).toBeInTheDocument();
    });
  });

  it('should handle tournament completion', async () => {
    const { getByText, getByTestId } = renderWithProviders(
      <TournamentBracket tournament_id="test-tournament" />
    );

    // 1. Simular conclusão de todas as partidas
    await act(async () => {
      TEST_MOCKS.completeAllMatches();
    });

    // 2. Verificar distribuição de recompensas
    await waitFor(() => {
      expect(getByTestId('tournament-rewards')).toBeInTheDocument();
      expect(getByText('tournament.completed')).toBeInTheDocument();
    });
  });
}); 