import React, { useEffect, useState } from 'react';
import { BattleService } from '../../services/battleService';
import { Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

export function BattleManager() {
  const [battles, setBattles] = useState<any[]>([]);

  useEffect(() => {
    const fetchBattles = async () => {
      const { data, error } = await supabase
        .from('battle_matches')
        .select('*');

      if (!error && data) {
        setBattles(data);
      }
    };

    fetchBattles();
  }, []);

  const handleForceEnd = async (matchId: string) => {
    await BattleService.forceEndBattle(matchId);
    setBattles(prev => prev.filter(b => b.match_id !== matchId));
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Battle Manager
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Match ID</TableCell>
            <TableCell>Player 1</TableCell>
            <TableCell>Player 2</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {battles.map(battle => (
            <TableRow key={battle.match_id}>
              <TableCell>{battle.match_id}</TableCell>
              <TableCell>{battle.player1_username}</TableCell>
              <TableCell>{battle.player2_username || 'Bot'}</TableCell>
              <TableCell>{battle.status}</TableCell>
              <TableCell>
                <Button onClick={() => handleForceEnd(battle.match_id)}>Force End</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 