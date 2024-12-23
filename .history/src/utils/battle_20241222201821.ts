import { BattleAction } from '../types/battle';

export const ACTION_ADVANTAGES: Record<BattleAction, BattleAction> = {
  'inicial': 'reconvencao',
  'contestacao': 'inicial',
  'reconvencao': 'contestacao'
}; 