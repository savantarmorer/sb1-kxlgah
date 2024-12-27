import { setupBattleTest, simulateBattleAction } from '../utils/testUtils';

describe('BattleMode Integration Tests', () => {
  it('should transition to IN_PROGRESS phase when battle starts', async () => {
    await setupBattleTest();
    expect(screen.getByTestId('battle-arena')).toBeInTheDocument();
  });

  describe('Battle Results', () => {
    it('should show victory screen when opponent health reaches 0', async () => {
      await setupBattleTest();

      // Simulate multiple correct answers and attacks
      for (let i = 0; i < 5; i++) {
        await simulateBattleAction('ATTACK', 'A');
      }

      await waitFor(() => {
        expect(screen.getByText(/Victory!/i)).toBeInTheDocument();
        expect(screen.getByTestId('confetti')).toBeInTheDocument();
      });
    });

    it('should show defeat screen when player health reaches 0', async () => {
      await setupBattleTest();

      // Simulate multiple incorrect answers
      for (let i = 0; i < 5; i++) {
        await simulateBattleAction('DEFENSE', 'D');
      }

      await waitFor(() => {
        expect(screen.getByText(/Defeat/i)).toBeInTheDocument();
      });
    });
  });

  describe('Battle Mechanics', () => {
    it('should apply correct damage calculations', async () => {
      await setupBattleTest();
      await simulateBattleAction('ATTACK', 'A');

      await waitFor(() => {
        const opponentHealth = screen.getByTestId('opponent-health');
        expect(opponentHealth).toHaveTextContent(/80/);
      });
    });

    // ... similar updates for other battle mechanics tests ...
  });
}); 