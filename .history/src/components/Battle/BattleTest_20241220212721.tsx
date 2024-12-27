import React, { useState, useCallback } from 'react';
import { Button, Box, Typography, Card, CardContent } from '@mui/material';
import { useBattle } from '../../hooks/useBattle';
import { ItemEffect } from '../../types/items';
import { useGame } from '../../contexts/GameContext';

export function BattleTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const {
    initialize_battle,
    handle_item_effect,
    battle: battle_state,
    get_current_question,
    isReady,
    loading
  } = useBattle();

  const { state } = useGame();

  const runTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Starting battle test with state:', {
        isReady,
        loading,
        battleState: battle_state,
        userState: state.user
      });

      if (!isReady) {
        throw new Error('Battle system is not ready. Please wait for initialization.');
      }

      if (!state.user) {
        throw new Error('User is not authenticated.');
      }

      // 1. Initialize battle
      console.log('Initializing battle...');
      await initialize_battle({
        category: 'all',
        difficulty: 'medium',
        is_bot: true
      });

      // Wait for battle to be active
      console.log('Waiting for battle to be active...');
      let attempts = 0;
      const maxAttempts = 10;
      while (battle_state?.status !== 'active' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        console.log(`Attempt ${attempts}: Battle status = ${battle_state?.status}`);
      }

      // 2. Check battle state
      if (battle_state?.status !== 'active') {
        throw new Error(`Battle failed to initialize. Status: ${battle_state?.status}`);
      }

      console.log('Battle initialized successfully:', battle_state);

      // 3. Use elimination potion
      const eliminationEffect: ItemEffect = {
        type: 'eliminate_wrong_answer',
        value: 1,
        metadata: {
          battle_only: true
        }
      };

      console.log('Applying elimination effect...');
      await handle_item_effect(eliminationEffect);

      // 4. Get current question and verify eliminated options
      const currentQuestion = get_current_question();
      const eliminatedOptions = battle_state?.metadata?.eliminated_options || [];

      const results = {
        success: true,
        battleStatus: battle_state?.status,
        currentQuestion,
        eliminatedOptions,
        remainingOptions: ['A', 'B', 'C', 'D'].filter(opt => !eliminatedOptions.includes(opt))
      };

      console.log('Test completed successfully:', results);
      setTestResults(results);

    } catch (err) {
      console.error('Battle test failed:', err);
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsLoading(false);
    }
  }, [initialize_battle, handle_item_effect, battle_state, get_current_question, isReady, loading, state.user]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Battle System Test</Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>System Status:</Typography>
        <Typography>
          Battle System Ready: {isReady ? 'Yes' : 'No'}{' '}
          {loading && '(Loading...)'}
        </Typography>
        <Typography>
          User Authenticated: {state.user ? 'Yes' : 'No'}
        </Typography>
      </Box>

      <Button 
        variant="contained" 
        onClick={runTest}
        disabled={isLoading || !isReady || loading || !state.user}
        sx={{ mb: 4 }}
      >
        {isLoading ? 'Running Test...' : 'Run Battle Test'}
      </Button>

      {error && (
        <Card sx={{ mb: 4, bgcolor: 'error.dark' }}>
          <CardContent>
            <Typography color="error" sx={{ mb: 2 }}>Error: {error}</Typography>
            <Typography variant="body2" color="error.light">
              Debug Information:
            </Typography>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8em' }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {testResults && !error && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Test Results:</Typography>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 