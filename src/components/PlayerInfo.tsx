import React from 'react';
import { Trophy } from '@/components/icons';

interface PlayerInfoProps {
  player: string;
  isWinner?: boolean;
}

export function PlayerInfo({ player, isWinner }: PlayerInfoProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="font-medium">{player}</span>
      {isWinner && (
        <Trophy className="w-4 h-4 text-yellow-500" />
      )}
    </div>
  );
} 