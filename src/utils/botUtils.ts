import { BotOpponent } from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';

// Bot name generation components
const BOT_PREFIXES = ['Prof.', 'Dr.', 'Mestre', 'Juiz', 'Advogado'];
const BOT_FIRST_NAMES = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Luiza', 'Paulo', 'Clara'];
const BOT_LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues'];

/**
 * Generates a unique ID for a bot
 * Format: bot_[timestamp]_[random]
 * Used by: BattleService.get_bot_opponent
 * Dependencies: None
 */
export function generate_bot_id(): string {
  return `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a random name for a bot
 * Format: [Prefix] [FirstName] [LastName]
 * Used by: BattleService.get_bot_opponent
 * Dependencies: None
 */
export function generate_bot_name(): string {
  const prefix = BOT_PREFIXES[Math.floor(Math.random() * BOT_PREFIXES.length)];
  const first_name = BOT_FIRST_NAMES[Math.floor(Math.random() * BOT_FIRST_NAMES.length)];
  const last_name = BOT_LAST_NAMES[Math.floor(Math.random() * BOT_LAST_NAMES.length)];
  return `${prefix} ${first_name} ${last_name}`;
}

/**
 * Calculates bot rating based on difficulty
 * Used by: BattleService.get_bot_opponent
 * Dependencies: BATTLE_CONFIG
 */
export function calculate_bot_rating(difficulty: number): number {
  const base_rating = BATTLE_CONFIG.bot.base_rating || 1000;
  const rating_multiplier = BATTLE_CONFIG.bot.rating_multiplier || 100;
  return base_rating + (difficulty * rating_multiplier);
}

/**
 * Creates a bot opponent with specified difficulty and category
 * Used by: BattleService.get_bot_opponent
 * Dependencies: BotOpponent type, generate_bot_id, generate_bot_name, calculate_bot_rating
 */
export function create_bot_opponent(difficulty: number = 1, category: string = 'general'): BotOpponent {
  return {
    id: generate_bot_id(),
    name: generate_bot_name(),
    rating: calculate_bot_rating(difficulty),
    is_bot: true
  };
}

/**
 * Simulates bot answer behavior based on difficulty
 * Used by: Battle system for bot responses
 * Dependencies: BATTLE_CONFIG
 * 
 * @param difficulty - Bot difficulty level (1-5)
 * @returns Object containing answer correctness and response time
 */
export function simulate_bot_answer(difficulty: number): { 
  is_correct: boolean; 
  response_time: number 
} {
  const base_accuracy = BATTLE_CONFIG.bot.base_accuracy || 0.5;
  const accuracy_multiplier = BATTLE_CONFIG.bot.accuracy_multiplier || 0.1;
  const accuracy = Math.min(base_accuracy + (difficulty * accuracy_multiplier), 0.95);

  const min_response_time = BATTLE_CONFIG.bot.min_response_time || 1000;
  const max_response_time = BATTLE_CONFIG.bot.max_response_time || 5000;
  const response_time = Math.random() * (max_response_time - min_response_time) + min_response_time;

  return {
    is_correct: Math.random() < accuracy,
    response_time
  };
}
