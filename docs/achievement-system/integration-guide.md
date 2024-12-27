# Integration Guide

This guide explains how to integrate the achievement system into your game.

## Setup

1. Install Dependencies:
```bash
npm install @supabase/supabase-js react-hot-toast framer-motion @mui/material @emotion/react @emotion/styled lucide-react
```

2. Database Setup:
```sql
-- Achievements table
CREATE TABLE achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR NOT NULL,
  points INTEGER NOT NULL,
  rarity VARCHAR NOT NULL,
  prerequisites TEXT[] DEFAULT '{}',
  dependents TEXT[] DEFAULT '{}',
  trigger_conditions JSONB NOT NULL,
  order_num INTEGER NOT NULL,
  icon VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id),
  achievement_id UUID REFERENCES achievements(id),
  progress INTEGER DEFAULT 0,
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
```

## Route Configuration

Add the achievements route to your router:

```typescript
// src/App.tsx or router configuration
import { AchievementsPage } from './pages/Achievements';

// In your router configuration:
{
  path: '/achievements',
  element: <AchievementsPage />
}
```

## Achievement Tracking

1. Initialize the achievement system in your game context:

```typescript
// In your game context
import { useAchievements } from '../hooks/useAchievements';

const { initializeAchievements, checkTrigger } = useAchievements();

// Initialize on mount
useEffect(() => {
  initializeAchievements();
}, []);
```

2. Track events in your game:

```typescript
// Example: Track battle wins
function onBattleWin() {
  checkTrigger('battle_wins', totalWins);
}

// Example: Track XP gains
function onXPGain(amount: number) {
  checkTrigger('xp_gained', totalXP);
}
```

## UI Integration

1. Add the achievements button to your navigation:

```typescript
// src/components/Navigation/Navbar.tsx
import { Trophy } from 'lucide-react';
import { useAchievements } from '../hooks/useAchievements';

// In your navigation component:
const { achievements } = useAchievements();
const unlockedCount = achievements.filter(a => a.unlocked).length;

<Link to="/achievements">
  <Trophy className="text-yellow-500" />
  Achievements
  {unlockedCount > 0 && (
    <span className="badge">{unlockedCount}</span>
  )}
</Link>
```

2. Add achievement notifications:

```typescript
// In your layout component
import { Toaster } from 'react-hot-toast';

<Toaster
  position="top-right"
  toastOptions={{
    duration: 5000,
    style: {
      background: '#333',
      color: '#fff'
    }
  }}
/>
```

## Security

1. Add Row Level Security (RLS) policies:

```sql
-- Allow users to read their own achievements
CREATE POLICY "Users can read their own achievements"
ON user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Allow the system to update achievement progress
CREATE POLICY "System can update achievement progress"
ON user_achievements FOR UPDATE
USING (auth.uid() = user_id);
```

2. Add API validation:

```typescript
// In your achievement service
const validateAchievementUpdate = (userId: string, achievementId: string) => {
  // Validate user owns the achievement
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .match({ user_id: userId, achievement_id: achievementId })
    .single();

  if (error || !data) {
    throw new Error('Unauthorized achievement update');
  }
};
```

## Testing

1. Add test achievements:

```typescript
// In your test setup
const testAchievements = [
  {
    id: 'test-1',
    title: 'Test Achievement',
    description: 'For testing purposes',
    category: 'test',
    points: 100,
    rarity: 'common',
    trigger_conditions: [
      { type: 'test', value: 1, comparison: 'eq' }
    ]
  }
];
```

2. Test achievement triggers:

```typescript
test('should unlock achievement when conditions are met', async () => {
  const { checkTrigger } = useAchievements();
  await checkTrigger('test', 1);
  
  const achievements = await getAchievements();
  expect(achievements[0].unlocked).toBe(true);
});
```

## Error Handling

1. Handle network errors:

```typescript
try {
  await checkTrigger('battle_wins', wins);
} catch (error) {
  console.error('Failed to check achievement:', error);
  toast.error('Failed to update achievement progress');
}
```

2. Handle validation errors:

```typescript
const validateTriggerConditions = (conditions: TriggerCondition[]) => {
  if (!conditions?.length) {
    throw new Error('Invalid trigger conditions');
  }
  
  conditions.forEach(condition => {
    if (!condition.type || !condition.value || !condition.comparison) {
      throw new Error('Invalid trigger condition format');
    }
  });
};
```

## Performance Optimization

1. Cache achievement data:

```typescript
const useAchievementCache = () => {
  const [cache, setCache] = useState<Map<string, Achievement>>(new Map());

  const updateCache = useCallback((achievements: Achievement[]) => {
    const newCache = new Map();
    achievements.forEach(a => newCache.set(a.id, a));
    setCache(newCache);
  }, []);

  return { cache, updateCache };
};
```

2. Batch achievement updates:

```typescript
const batchUpdateProgress = async (updates: AchievementUpdate[]) => {
  const { error } = await supabase
    .from('user_achievements')
    .upsert(updates);

  if (error) throw error;
};
```

## Troubleshooting

Common issues and solutions:

1. Achievement not unlocking:
- Check trigger conditions are met
- Verify user has required prerequisites
- Check for database connection issues

2. Progress not updating:
- Verify trigger event is firing
- Check database permissions
- Validate progress calculation

3. UI not updating:
- Check React state management
- Verify achievement context updates
- Check component re-rendering 