# Achievement System Documentation

## System Overview

The Achievement System is a comprehensive solution for managing in-game achievements in a legal education game platform. It provides a flexible and secure way to track player progress, reward accomplishments, and enhance player engagement.

### Key Features

- Real-time achievement tracking and unlocking
- Multiple achievement categories (battles, progress, collection, engagement)
- Type-safe trigger conditions with 12 different trigger types
- Secure achievement validation and progress tracking
- Modern UI with animations and toast notifications
- Admin management interface with live preview
- Metadata support for customization

## Quick Start

1. Install dependencies:
```bash
npm install @supabase/supabase-js react-hot-toast framer-motion lucide-react
```

2. Import and initialize:
```typescript
import { useAchievements } from '../hooks/useAchievements';
import { AchievementList } from '../components/Achievements/AchievementList';

// In your component:
function AchievementsPage() {
  const { achievements } = useAchievements();
  return <AchievementList achievements={achievements} />;
}
```

## Achievement Types

The system supports 12 different trigger types:

1. **XP & Progress**
   - `xp_gained`: Total XP points earned
   - `level_reached`: Player level reached
   - `quests_completed`: Number of quests completed
   - `coins_earned`: Total coins earned

2. **Battle Performance**
   - `battle_score`: Score in a single battle
   - `battle_wins`: Total battles won
   - `battle_streak`: Current win streak
   - `battle_rating`: Battle rating achieved
   - `battles_played`: Total battles participated in
   - `highest_streak`: Best win streak record

3. **Engagement & Collection**
   - `login_days`: Consecutive days logged in
   - `reward_rarity`: Rarity level of rewards earned

## Rarity Levels

Each achievement has one of four rarity levels:

- **Common**: Basic achievements (50-100 points)
  - Early game milestones
  - Basic battle victories
  - Initial quest completions

- **Rare**: Intermediate achievements (100-250 points)
  - Consistent performance
  - Battle streaks
  - Resource milestones

- **Epic**: Advanced achievements (250-500 points)
  - High performance goals
  - Long-term dedication
  - Complex combinations

- **Legendary**: Ultimate achievements (500+ points)
  - Perfect mastery
  - Exceptional records
  - Special challenges

## Admin Interface

The system includes a comprehensive admin interface for managing achievements:

```typescript
import { AchievementManager } from '../components/admin/AchievementManager';

function AdminPanel() {
  return <AchievementManager />;
}
```

Features:
- Create and edit achievements
- Live preview of achievement cards
- Type-safe trigger condition editor
- Metadata customization
- Rarity and category management

## Best Practices

1. **Achievement Design**
   - Start with clear, achievable goals
   - Use appropriate trigger types
   - Set meaningful point values
   - Include helpful descriptions

2. **Trigger Conditions**
   - Use 'gte' for progress-based triggers
   - Use 'eq' for exact matches
   - Combine multiple conditions when needed
   - Test all trigger combinations

3. **UI Integration**
   - Use toast notifications for unlocks
   - Show progress clearly
   - Provide sorting and filtering
   - Maintain consistent styling

4. **Performance**
   - Cache achievement data
   - Batch update checks
   - Use optimistic updates
   - Monitor trigger frequency

## Documentation Sections

1. [Integration Guide](./integration-guide.md)
2. [Achievement Design](./achievement-design.md)
3. [Frontend Components](./frontend-components.md)
4. [API Reference](./api-reference.md)

## License

This is a closed-source system. All rights reserved. 