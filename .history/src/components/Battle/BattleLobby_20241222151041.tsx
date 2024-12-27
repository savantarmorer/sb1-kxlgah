import React, { useState } from 'react';
import { Box, Typography, useTheme, alpha, Container, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Trophy, 
  Star, 
  Shield, 
  Target, 
  Zap, 
  Crown, 
  Users, 
  Timer, 
  Medal, 
  TrendingUp, 
  BookOpen, 
  Scale, 
  Gavel, 
  FileText 
} from 'lucide-react';
import Button from '../Button';
import { useGame } from '../../contexts/GameContext';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { BattleStats, BattleOptions } from '../../types/battle';

interface BattleLobbyProps {
  on_start_battle: (options: BattleOptions) => Promise<void>;
  on_close: () => void;
  stats: BattleStats;
}

function getRankTier(rating: number): string {
  if (rating >= 2000) return 'Master';
  if (rating >= 1800) return 'Diamond';
  if (rating >= 1600) return 'Platinum';
  if (rating >= 1400) return 'Gold';
  if (rating >= 1200) return 'Silver';
  if (rating >= 1000) return 'Bronze';
  return 'Unranked';
}

export function BattleLobby({ on_start_battle, on_close, stats }: BattleLobbyProps) {
  const theme = useTheme();
  const { state } = useGame();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'constitutional' | 'criminal' | 'civil'>('general');
  const [selectedMode, setSelectedMode] = useState<'casual' | 'ranked'>('casual');
  const [showRules, setShowRules] = useState(false);

  const winRate = stats.total_battles > 0 
    ? Math.round((stats.wins / stats.total_battles) * 100) 
    : 0;

  const handleStartBattle = () => {
    void on_start_battle({
      mode: selectedMode,
      category: selectedCategory,
      difficulty: selectedDifficulty
    });
  };

  const difficultyConfig = {
    easy: {
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      borderColor: alpha(theme.palette.success.main, 0.2),
      multiplier: '0.8x'
    },
    medium: {
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      borderColor: alpha(theme.palette.warning.main, 0.2),
      multiplier: '1x'
    },
    hard: {
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.1),
      borderColor: alpha(theme.palette.error.main, 0.2),
      multiplier: '1.5x'
    }
  };

  const categoryConfig = {
    general: {
      title: 'Geral',
      icon: <BookOpen />,
      description: 'All areas of law',
      bgImage: 'url(/images/backgrounds/general-law.jpg)'
    },
    constitutional: {
      title: 'Constitucional',
      icon: <Scale />,
      description: 'Constitutional law questions',
      bgImage: 'url(/images/backgrounds/constitutional.jpg)'
    },
    criminal: {
      title: 'Penal',
      icon: <Gavel />,
      description: 'Criminal law questions',
      bgImage: 'url(/images/backgrounds/criminal.jpg)'
    },
    civil: {
      title: 'Civil',
      icon: <FileText />,
      description: 'Civil law questions',
      bgImage: 'url(/images/backgrounds/civil.jpg)'
    }
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component={motion.div}
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 2
            }}
          >
            <Swords size={40} className="text-primary" />
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 800,
                background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Battle Arena
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary">
            Test your knowledge in epic legal battles
          </Typography>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Box sx={{ 
                p: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Trophy size={24} className="text-yellow-400" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Win Rate
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {winRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.wins}W - {stats.losses}L
                </Typography>
              </Box>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Box sx={{ 
                p: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.2)
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Star size={24} className="text-yellow-400" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Win Streak
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {stats.win_streak}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Best: {stats.highest_streak}
                </Typography>
              </Box>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Box sx={{ 
                p: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.success.main, 0.2)
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUp size={24} className="text-green-400" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Avg Score
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {stats.average_score}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.total_battles} Total Battles
                </Typography>
              </Box>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Box sx={{ 
                p: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.2)
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Medal size={24} className="text-blue-400" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Rank
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {selectedMode === 'ranked' 
                    ? getRankTier(state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating)
                    : '-'
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMode === 'ranked' 
                    ? `${state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating} Rating` 
                    : 'Casual Mode'
                  }
                </Typography>
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        {/* Battle Categories */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Select Category
          </Typography>
          <Grid container spacing={2}>
            {(Object.entries(categoryConfig) as [typeof categoryConfig[keyof typeof categoryConfig], typeof categoryConfig[keyof typeof categoryConfig]][]).map(([category, config]) => (
              <Grid item xs={12} sm={6} md={3} key={category}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box
                    onClick={() => setSelectedCategory(category)}
                    sx={{ 
                      p: 3,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: selectedCategory === category 
                        ? 'primary.main'
                        : alpha(theme.palette.divider, 0.1),
                      bgcolor: selectedCategory === category
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: selectedCategory === category 
                          ? 'primary.main'
                          : alpha(theme.palette.divider, 0.2)
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        {React.cloneElement(config.icon, { 
                          size: 24,
                          className: "text-primary"
                        })}
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {config.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {config.description}
                      </Typography>
                      {category !== 'general' && (
                        <Box sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          px: 1,
                          py: 0.5,
                          borderRadius: 'full',
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          border: '1px solid',
                          borderColor: alpha(theme.palette.warning.main, 0.2)
                        }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'warning.main',
                              fontWeight: 'medium'
                            }}
                          >
                            Coming Soon
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Battle Mode Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Battle Mode
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  onClick={() => setSelectedMode('casual')}
                  sx={{ 
                    p: 3,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: selectedMode === 'casual'
                      ? 'primary.main'
                      : alpha(theme.palette.divider, 0.1),
                    bgcolor: selectedMode === 'casual'
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: selectedMode === 'casual'
                        ? 'primary.main'
                        : alpha(theme.palette.divider, 0.2)
                    }
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Users size={32} className="text-primary mb-2" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Casual
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Practice mode with no rating changes
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  onClick={() => setSelectedMode('ranked')}
                  sx={{ 
                    p: 3,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: selectedMode === 'ranked'
                      ? 'primary.main'
                      : alpha(theme.palette.divider, 0.1),
                    bgcolor: selectedMode === 'ranked'
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: selectedMode === 'ranked'
                        ? 'primary.main'
                        : alpha(theme.palette.divider, 0.2)
                    }
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Crown size={32} className="text-primary mb-2" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Ranked
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Competitive mode with rating changes
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        {/* Difficulty Selection */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Difficulty
          </Typography>
          <Grid container spacing={2}>
            {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
              <Grid item xs={12} sm={4} key={difficulty}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box
                    onClick={() => setSelectedDifficulty(difficulty)}
                    sx={{ 
                      p: 3,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: selectedDifficulty === difficulty
                        ? difficultyConfig[difficulty].color
                        : alpha(theme.palette.divider, 0.1),
                      bgcolor: selectedDifficulty === difficulty
                        ? difficultyConfig[difficulty].bgColor
                        : 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: selectedDifficulty === difficulty
                          ? difficultyConfig[difficulty].color
                          : alpha(theme.palette.divider, 0.2)
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: difficultyConfig[difficulty].color,
                          textTransform: 'capitalize'
                        }}
                      >
                        {difficulty}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reward Multiplier: {difficultyConfig[difficulty].multiplier}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Battle Rules */}
        <Box sx={{ mb: 6 }}>
          <Box
            component={motion.div}
            initial={false}
            animate={{ height: showRules ? 'auto' : '40px' }}
          >
            <Button
              variant="ghost"
              onClick={() => setShowRules(!showRules)}
              startIcon={<Shield size={20} />}
              sx={{ color: 'text.secondary' }}
            >
              Battle Rules
            </Button>
            
            <AnimatePresence>
              {showRules && (
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.divider, 0.1)
                  }}
                >
                  <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                    <Typography component="li" variant="body2">
                      • Answer {BATTLE_CONFIG.questions_per_battle} questions correctly to win
                    </Typography>
                    <Typography component="li" variant="body2">
                      • Each question has a {BATTLE_CONFIG.time_per_question} second time limit
                    </Typography>
                    <Typography component="li" variant="body2">
                      • Base rewards: {BATTLE_CONFIG.rewards.base_xp} XP and {BATTLE_CONFIG.rewards.base_coins} coins
                    </Typography>
                    <Typography component="li" variant="body2">
                      • Earn up to {BATTLE_CONFIG.rewards.time_bonus.max_bonus}% bonus for quick answers
                    </Typography>
                    <Typography component="li" variant="body2">
                      • Maintain your streak for up to {BATTLE_CONFIG.rewards.streak_bonus.max_bonus}% bonus
                    </Typography>
                    <Typography component="li" variant="body2">
                      • Victory multipliers: {BATTLE_CONFIG.rewards.victory_bonus.xp_multiplier}x XP, {BATTLE_CONFIG.rewards.victory_bonus.coins_multiplier}x coins
                    </Typography>
                  </Box>
                </Box>
              )}
            </AnimatePresence>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: 2
        }}>
          <Button
            variant="ghost"
            onClick={on_close}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStartBattle}
            startIcon={<Swords size={18} />}
            disabled={selectedCategory !== 'general'}
          >
            {selectedCategory === 'general' ? 'Start Battle' : 'Coming Soon'}
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
} 