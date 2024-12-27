import React, { useState } from 'react';
import { Button, Box, Typography, Card, CardContent } from '@mui/material';
import { testBattle } from '../../utils/test/battleTest';

export function BattleTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await testBattle();
      setTestResults(results);
      if (!results.success) {
        setError(results.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsLoading(false);
    }
  };

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