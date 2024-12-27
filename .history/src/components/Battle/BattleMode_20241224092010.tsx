import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { BattleQuestion } from '../../types/battle';
import { User } from '../../types/user';

// Battle phases
export enum BattlePhase {
  PREPARING = 'PREPARING',
  INITIALIZING = 'INITIALIZING',
  CARD_DISTRIBUTION = 'CARD_DISTRIBUTION',
  ACTION_SELECTION = 'ACTION_SELECTION',
  QUESTION = 'QUESTION',
  ANIMATION = 'ANIMATION',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Card types and initial state
export type CardType = 'ataque' | 'defesa' | 'contra_ataque' | 'wildcard';

export interface Card {
  id: string;
  type: CardType;
  isWildcard: boolean;
  isUsed: boolean;
  power: number;
  description: string;
}

export interface PlayerState {
  health: number;
  shield: number;
  selectedCard: Card | null;
  selectedAction: CardType | null;
  answer: string | null;
  isReady: boolean;
  isCorrect: boolean;
  timeLeft: number;
  hand: Card[];
}

const generateInitialHand = (): Card[] => {
  const hand: Card[] = [];
  
  // Add 2 attack cards
  for (let i = 0; i < 2; i++) {
    hand.push({
      id: `attack-${i}`,
      type: 'ataque',
      isWildcard: false,
      isUsed: false,
      power: 20,
      description: 'Causa dano ao oponente'
    });
  }
  
  // Add 2 defense cards
  for (let i = 0; i < 2; i++) {
    hand.push({
      id: `defense-${i}`,
      type: 'defesa',
      isWildcard: false,
      isUsed: false,
      power: 15,
      description: 'Bloqueia dano e ganha escudo'
    });
  }
  
  // Add 2 counter cards
  for (let i = 0; i < 2; i++) {
    hand.push({
      id: `counter-${i}`,
      type: 'contra_ataque',
      isWildcard: false,
      isUsed: false,
      power: 25,
      description: 'Contra-ataca com dano aumentado'
    });
  }
  
  // Add 1 wildcard
  hand.push({
    id: 'wildcard-0',
    type: 'wildcard',
    isWildcard: true,
    isUsed: false,
    power: 30,
    description: 'Pode ser usado como qualquer tipo de carta'
  });
  
  return hand.sort(() => Math.random() - 0.5);
};

export interface BattleModeProps {
  mode?: 'all' | 'constitutional' | 'civil' | 'criminal' | 'administrative';
}

const initialPlayerState: PlayerState = {
  health: 100,
  shield: 0,
  selectedCard: null,
  selectedAction: null,
  answer: null,
  isReady: false,
  isCorrect: false,
  timeLeft: 0,
  hand: []
};