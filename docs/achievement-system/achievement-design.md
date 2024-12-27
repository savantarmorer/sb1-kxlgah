# Achievement Design Guide

## Database Schema

```sql
-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  prerequisites TEXT[] DEFAULT '{}',
  dependents TEXT[] DEFAULT '{}',
  trigger_conditions JSONB NOT NULL DEFAULT '[]',
  order_num INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{"icon": "🏆"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User achievements table
CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, achievement_id)
);

-- Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public achievements are viewable by everyone" 
  ON achievements FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify achievements" 
  ON achievements FOR ALL 
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

CREATE POLICY "Users can view their own achievements" 
  ON user_achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can update user achievements" 
  ON user_achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

## Achievement Structure

```typescript
interface Achievement {
  id: string;                    // UUID primary key
  title: string;                 // Display title
  description: string;           // Detailed description
  category: string;              // Achievement category
  points: number;                // Points awarded
  rarity: AchievementRarity;     // Rarity level
  prerequisites: string[];       // Required achievements
  dependents: string[];         // Unlocked achievements
  trigger_conditions: TriggerCondition[]; // Unlock conditions
  order_num: number;            // Display order
  progress: number;             // Current progress (0-100)
  icon: string | LucideIcon;    // Achievement icon
  metadata?: Record<string, any>; // Additional data
  unlocked: boolean;            // Unlock status
  unlocked_at?: string;         // Unlock timestamp
  claimed?: boolean;            // Reward claimed status
}

type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface TriggerCondition {
  type: AchievementTriggerType;  // Type of trigger
  value: number;                 // Target value
  comparison: 'eq' | 'gt' | 'gte' | 'lt' | 'lte'; // Comparison operator
}

type AchievementTriggerType = 
  | 'xp_gained'         // Total XP points earned
  | 'highest_streak'    // Highest consecutive win streak
  | 'quests_completed'  // Number of quests completed
  | 'battle_score'      // Score achieved in a single battle
  | 'battle_wins'       // Total battles won
  | 'battle_streak'     // Current battle win streak
  | 'battle_rating'     // Battle rating achieved
  | 'reward_rarity'     // Rarity level of rewards earned (1-4)
  | 'login_days'        // Consecutive days logged in
  | 'battles_played'    // Total battles participated in
  | 'level_reached'     // Player level reached
  | 'coins_earned';     // Total coins earned
```

## Achievement Creation

Example of creating an achievement through the service:

```typescript
import { AchievementService } from '../services/achievementService';

// Create a basic achievement
const basicAchievement = await AchievementService.create({
  title: "First Victory",
  description: "Win your first battle",
  category: "battle",
  points: 50,
  rarity: "common",
  trigger_conditions: [{
    type: "battle_wins",
    value: 1,
    comparison: "gte"
  }],
  metadata: {
    icon: "🏆",
    color: "text-yellow-500"
  }
});

// Create a complex achievement
const complexAchievement = await AchievementService.create({
  title: "Battle Master",
  description: "Reach level 10 and maintain a 5-win streak",
  category: "battle",
  points: 250,
  rarity: "epic",
  trigger_conditions: [
    {
      type: "level_reached",
      value: 10,
      comparison: "gte"
    },
    {
      type: "battle_streak",
      value: 5,
      comparison: "gte"
    }
  ],
  metadata: {
    icon: "⚔️",
    color: "text-purple-500",
    animation: "sparkle"
  }
});
```

## Progress Tracking

The system automatically tracks progress through hooks:

```typescript
// In your component
function BattleComponent() {
  const { checkTrigger } = useAchievements();
  
  const handleBattleWin = async () => {
    // Update battle stats
    await updateBattleStats();
    
    // Check achievement triggers
    await checkTrigger('battle_wins', totalWins);
    await checkTrigger('battle_streak', currentStreak);
    await checkTrigger('battle_rating', playerRating);
  };
}

// Achievement triggers hook
function useAchievementTriggers() {
  const { state } = useGame();
  const { checkTrigger } = useAchievements();

  // Track XP gains
  useEffect(() => {
    checkTrigger('xp_gained', state.user.xp);
  }, [state.user.xp]);

  // Track battle stats
  useEffect(() => {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  prerequisites: string[];
  dependents: string[];
  trigger_conditions: TriggerCondition[];
  order_num: number;
  icon: string;
  metadata: Record<string, any>;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
}

interface TriggerCondition {
  type: string;
  value: number;
  comparison: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
}
```

## Categories

1. **Battle Achievements**
   - Combat performance
   - Win streaks
   - Tournament rankings
   - Battle ratings

2. **Progress Achievements**
   - XP milestones
   - Level progression
   - Study completion
   - Quiz scores

3. **Collection Achievements**
   - Item collection
   - Resource gathering
   - Reward claims
   - Unlocks

4. **Mastery Achievements**
   - Skill mastery
   - Perfect scores
   - Expert challenges
   - Special accomplishments

## Rarity Levels

1. **Common (50-100 points)**
   - Basic accomplishments
   - Early game achievements
   - Tutorial completion
   - First-time actions

2. **Rare (100-250 points)**
   - Intermediate challenges
   - Consistent performance
   - Resource milestones
   - Skill development

3. **Epic (250-500 points)**
   - Advanced challenges
   - High performance
   - Significant milestones
   - Expert knowledge

4. **Legendary (500+ points)**
   - Ultimate challenges
   - Perfect mastery
   - Complete collections
   - Special events

## Trigger Conditions

Available trigger types:

```typescript
type TriggerType =
  | 'xp_gained'      // Total XP earned
  | 'battle_wins'    // Number of battles won
  | 'battle_score'   // Score in a single battle
  | 'battle_streak'  // Consecutive wins
  | 'battle_rating'  // Tournament rating
  | 'quests_completed' // Total quests completed
  | 'login_days'     // Consecutive login days
  | 'study_time'     // Total study time
  | 'perfect_scores' // Perfect battle/quiz scores
  | 'items_collected'; // Items in collection
```

Example conditions:

```typescript
const conditions = [
  // Win 10 battles
  {
    type: 'battle_wins',
    value: 10,
    comparison: 'gte'
  },
  
  // Reach 1000 XP
  {
    type: 'xp_gained',
    value: 1000,
    comparison: 'gte'
  },
  
  // Get a perfect score
  {
    type: 'battle_score',
    value: 100,
    comparison: 'eq'
  }
];
```

## Achievement Design Principles

1. **Progressive Difficulty**
   - Start with easy achievements
   - Gradually increase challenge
   - Clear progression path
   - Multiple difficulty tiers

2. **Clear Goals**
   - Specific objectives
   - Measurable progress
   - Achievable targets
   - Time-relevant goals

3. **Meaningful Rewards**
   - Points match difficulty
   - Special rewards for rare achievements
   - Cosmetic rewards
   - Status symbols

4. **Engagement Hooks**
   - Early achievements for motivation
   - Mid-game goals for retention
   - Long-term goals for dedication
   - Special event achievements

## Achievement Metadata

Use metadata for additional features:

```typescript
interface AchievementMetadata {
  icon_color?: string;      // Custom icon color
  background?: string;      // Custom background
  sound_effect?: string;    // Unlock sound
  animation?: string;       // Unlock animation
  reward_type?: string;     // Special reward type
  reward_value?: number;    // Reward amount
  hidden?: boolean;         // Secret achievement
  expires_at?: string;      // Limited time
}
```

Example usage:

```typescript
const achievement = {
  // ... basic properties
  metadata: {
    icon_color: '#FFD700',
    background: 'legendary_bg.png',
    sound_effect: 'legendary_unlock.mp3',
    animation: 'sparkle',
    reward_type: 'gems',
    reward_value: 100,
    hidden: true
  }
};
```

## Achievement Dependencies

1. **Prerequisites**
   - Required achievements
   - Level requirements
   - Skill requirements
   - Resource requirements

2. **Dependents**
   - Unlocked achievements
   - Available content
   - New features
   - Special rewards

Example chain:

```typescript
const achievementChain = [
  {
    id: 'novice_warrior',
    prerequisites: [],
    dependents: ['skilled_warrior']
  },
  {
    id: 'skilled_warrior',
    prerequisites: ['novice_warrior'],
    dependents: ['master_warrior']
  },
  {
    id: 'master_warrior',
    prerequisites: ['skilled_warrior'],
    dependents: ['legendary_warrior']
  }
];
```

## Best Practices

1. **Achievement Names**
   - Clear and concise
   - Descriptive
   - Memorable
   - Thematic

2. **Descriptions**
   - Explain requirements
   - Provide context
   - Include hints
   - Be engaging

3. **Progress Tracking**
   - Clear indicators
   - Real-time updates
   - Visual feedback
   - Milestone notifications

4. **User Experience**
   - Immediate feedback
   - Clear notifications
   - Easy discovery
   - Satisfying unlocks

## Example Achievements

1. **Battle Master**
```typescript
{
  id: 'battle_master',
  title: 'Battle Master',
  description: 'Win 100 battles with a 75% or higher win rate',
  category: 'battle',
  points: 500,
  rarity: 'legendary',
  trigger_conditions: [
    { type: 'battle_wins', value: 100, comparison: 'gte' },
    { type: 'battle_rating', value: 75, comparison: 'gte' }
  ],
  metadata: {
    icon: '⚔️',
    animation: 'legendary_sparkle',
    reward_type: 'title',
    reward_value: 'Battle Master'
  }
}
```

2. **Knowledge Seeker**
```typescript
{
  id: 'knowledge_seeker',
  title: 'Knowledge Seeker',
  description: 'Complete 50 study sessions',
  category: 'progress',
  points: 200,
  rarity: 'rare',
  trigger_conditions: [
    { type: 'study_time', value: 3000, comparison: 'gte' }
  ],
  metadata: {
    icon: '📚',
    reward_type: 'xp_multiplier',
    reward_value: 1.1
  }
}