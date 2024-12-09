import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal, Award, Gift } from 'lucide-react';
import Confetti from 'react-confetti';
import { Button } from '../../components/Button';

/**
 * Displays the results of a completed battle including rewards and XP progress
 * 
 * @param props.score - Battle score data
 * @param props.rewards - Battle rewards including XP and items
 * @param props.stats - Battle statistics
 * @param props.on_continue - Callback for continue button
 * @param props.on_play_again - Callback for play again button
 * 
 * Dependencies:
 * - motion from framer-motion
 * 
 * State Management:
 * - Reads from battle_state for score
 * - Reads from rewards for XP/items
 * 
 * Related Components:
 * - BattleMode: Parent component
 * - XPProgressBar: Child component
 * - ItemReward: Child component
 */
interface BattleResultsProps {
  score: {
    player: number;
    opponent: number;
  };
  /**
   * Rewards structure containing various reward details from a battle
   * 
   * @property {number} xp_earned - Experience points earned
   * @property {number} coins_earned - Coins earned
   * @property {number} streak_bonus - Bonus from win streak
   * @property {number} [time_bonus] - Optional bonus for quick completion
   * @property {Array<Object>} [items_earned] - Optional items earned
   * @property {string} items_earned[].id - Item identifier
   * @property {string} items_earned[].name - Item name
   * @property {number} items_earned[].quantity - Quantity of the item
   * @property {string} items_earned[].type - Item type
   * @property {string} items_earned[].rarity - Item rarity level
   * @property {Array<Object>} [achievements_unlocked] - Optional achievements unlocked
   * @property {string} achievements_unlocked[].id - Achievement identifier
   * @property {string} achievements_unlocked[].title - Achievement title
   * @property {string} achievements_unlocked[].description - Description of the achievement
   * @property {number} achievements_unlocked[].points - Points awarded for the achievement
   * @property {string} achievements_unlocked[].rarity - Rarity level of the achievement
   * @property {Object} level_data - Information about level progression
   * @property {number} level_data.level - Current level achieved
   * @property {number} level_data.percentToNextLevel - Percentage to the next level
   * @property {number} level_data.next_level_xp - XP required to reach the next level
   */
  rewards: any;
  stats: any;
  on_continue: () => void;
  on_play_again: () => void;
  is_transitioning: boolean;
  rewards_claimed: boolean;
}

  /**
   * React component to display the results of a battle
   * 
   * @prop {BattleScore} score - The score of the battle
   * @prop {BattleRewards} rewards - The rewards earned from the battle
   * @prop {{total_battles: number, wins: number, losses: number, win_streak: number, highest_streak: number}} [stats] - The current stats of the player
   * @prop {() => void} on_continue - The function to call when the user chooses to continue
   * @prop {() => void} on_play_again - The function to call when the user chooses to play again
   * 
   * @returns {JSX.Element} A JSX element representing the battle results
   */
export function BattleResults({
  score,
  rewards,
  stats,
  on_continue,
  on_play_again,
  is_transitioning,
  rewards_claimed
}: BattleResultsProps) {
  const isVictory = score.player > score.opponent;
  const hasExtraRewards = rewards.items_earned?.length || rewards.achievements_unlocked?.length;

  // Format numbers for display
  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
  
  // Calculate win rate safely
  const winRate = stats.wins + stats.losses > 0 
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) 
    : 0;

  const renderAchievements = () => {
    if (!rewards.achievements_unlocked?.length) return null;

    return (
      <div className="achievements-earned space-y-3">
        <h3 className="text-lg font-medium">Achievements Unlocked</h3>
        <div className="grid grid-cols-1 gap-2">
          {rewards.achievements_unlocked.map((achievement) => (
            <div 
              key={achievement.id}
              className="achievement-item flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-500/20"
            >
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">
                  <Trophy size={20} />
                </span>
                <div>
                  <span className="text-sm font-medium">{achievement.title}</span>
                  <p className="text-xs text-gray-500">{achievement.description}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-yellow-500">+{achievement.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      className="battle-results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Victory/Defeat Banner */}
      <div className={`result-banner mb-6 text-center ${isVictory ? 'text-green-500' : 'text-red-500'}`}>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <Trophy className="w-16 h-16 mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">{isVictory ? 'Victory!' : 'Defeat'}</h2>
        <p className="text-lg">Score: {score.player} - {score.opponent}</p>
      </div>

      {/* Battle Stats */}
      <div className="battle-stats mb-6 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <div className="font-medium">Win Streak</div>
          <div className="text-blue-500">{stats.win_streak}</div>
        </div>
        <div>
          <div className="font-medium">Total Battles</div>
          <div>{stats.total_battles}</div>
        </div>
        <div>
          <div className="font-medium">Win Rate</div>
          <div className="text-green-500">
            {winRate}%
          </div>
        </div>
      </div>

      {/* Rewards Section */}
      <div className="rewards-section space-y-6">
        {/* Primary Rewards */}
        <div className="primary-rewards grid grid-cols-3 gap-4">
          <div className="reward-item p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-center">
            <span className="block text-sm text-blue-600 dark:text-blue-300">XP Earned</span>
            <span className="block text-lg font-bold">+{formatNumber(rewards.xp_earned)}</span>
          </div>
          <div className="reward-item p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-center">
            <span className="block text-sm text-yellow-600 dark:text-yellow-300">Coins</span>
            <span className="block text-lg font-bold">+{formatNumber(rewards.coins_earned)}</span>
          </div>
          {rewards.streak_bonus > 0 && (
            <div className="reward-item p-3 bg-purple-100 dark:bg-purple-900 rounded-lg text-center">
              <span className="block text-sm text-purple-600 dark:text-purple-300">Streak Bonus</span>
              <span className="block text-lg font-bold">+{formatNumber(rewards.streak_bonus)}</span>
            </div>
          )}
          {rewards.time_bonus && (
            <div className="reward-item p-3 bg-green-100 dark:bg-green-900 rounded-lg text-center">
              <span className="block text-sm text-green-600 dark:text-green-300">Time Bonus</span>
              <span className="block text-lg font-bold">+{formatNumber(rewards.time_bonus)}</span>
            </div>
          )}
        </div>

        {/* XP Progress */}
        <div className="xp-progress">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Level {rewards?.level_data?.level || 1} Progress</span>
            <span className="text-sm font-medium">{Math.round(rewards?.level_data?.percentToNextLevel || 0)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rewards?.level_data?.percentToNextLevel || 0}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-blue-500"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {formatNumber(rewards.xp_earned)} / {formatNumber(rewards?.level_data?.next_level_xp || 0)} XP to next level
          </div>
        </div>

        {/* Extra Rewards */}
        {hasExtraRewards && (
          <div className="extra-rewards space-y-3">
            <h3 className="text-lg font-medium">Additional Rewards</h3>
            
            {/* Items */}
            {rewards.items_earned && rewards.items_earned.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Items</h4>
                <div className="grid grid-cols-1 gap-2">
                  {rewards.items_earned.map((item) => (
                    <div 
                      key={item.id}
                      className={`reward-item flex justify-between items-center p-2 rounded-lg ${
                        getRarityColor(item.rarity)
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs text-gray-500">{item.type}</span>
                      </div>
                      <span className="font-medium">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {renderAchievements()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons mt-6 grid grid-cols-1 gap-4">
        {!rewards_claimed ? (
          <Button 
            onClick={on_continue}
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            disabled={is_transitioning}
          >
            <Trophy className="w-5 h-5" />
            Receber Recompensas
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={on_play_again}
              variant="secondary"
              className="w-full"
            >
              Nova Batalha
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Voltar ao Menu
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Utility function to get tailwind classes for rarity colors
const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'bg-gray-100 dark:bg-gray-800';
    case 'uncommon':
      return 'bg-green-100 dark:bg-green-900';
    case 'rare':
      return 'bg-blue-100 dark:bg-blue-900';
    case 'epic':
      return 'bg-purple-100 dark:bg-purple-900';
    case 'legendary':
      return 'bg-yellow-100 dark:bg-yellow-900';
    default:
      return 'bg-gray-100 dark:bg-gray-800';
  }
};
