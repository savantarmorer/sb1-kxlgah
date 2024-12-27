import React, { useState, useCallback } from 'react';
import { Button, Box, Typography, Card, CardContent } from '@mui/material';
import { useBattle } from '../../hooks/useBattle';
import { ItemEffect } from '../../types/items';

export function BattleTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    initialize_battle,
    handle_item_effect,
    battle: battle_state,
    get_current_question
  } = useBattle();

  const runTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Initialize battle
      await initialize_battle({
        category: 'all',
        difficulty: 'medium',
        mode: 'casual',
        is_bot: true
      });

      // 2. Wait for battle to be active
      if (battle_state?.status !== 'active') {
        throw new Error('Battle failed to initialize');
      }

      // 3. Use elimination potion
      const eliminationEffect: ItemEffect = {
        type: 'eliminate_wrong_answer',
        value: 1,
        metadata: {
          battle_only: true
        }
      };

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

      console.log('Test Results:', results);
      setTestResults(results);

    } catch (err) {
      console.error('Battle test failed:', err);
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsLoading(false);
    }
  }, [initialize_battle, handle_item_effect, battle_state, get_current_question]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Battle System Test</Typography>
      
      <Button 
        variant="contained" 
        onClick={runTest}
        disabled={isLoading}
        sx={{ mb: 4 }}
      >
        {isLoading ? 'Running Test...' : 'Run Battle Test'}
      </Button>

      {error && (
        <Card sx={{ mb: 4, bgcolor: 'error.dark' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
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