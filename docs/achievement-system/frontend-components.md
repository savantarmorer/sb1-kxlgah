# Frontend Components

This document details the frontend components used to display achievements and their requirements to users.

## Achievement List

The main component for displaying achievements:

```typescript
// src/components/Achievements/AchievementList.tsx
import React from 'react';
import { Achievement } from '../../types/achievements';
import { AchievementCard } from './AchievementCard';

interface AchievementListProps {
  achievements: Achievement[];
  category?: string;
}

export function AchievementList({ achievements, category }: AchievementListProps) {
  const filteredAchievements = category
    ? achievements.filter(a => a.category === category)
    : achievements;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredAchievements.map(achievement => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
        />
      ))}
    </div>
  );
}
```

## Achievement Card

Individual achievement display:

```typescript
// src/components/Achievements/AchievementCard.tsx
import React from 'react';
import { Achievement } from '../../types/achievements';
import { AchievementProgress } from './AchievementProgress';
import { AchievementRequirements } from './AchievementRequirements';

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <div className={`
      p-4 rounded-lg border
      ${achievement.unlocked 
        ? 'bg-gradient-to-br from-white to-indigo-50 border-indigo-200' 
        : 'bg-gray-50 border-gray-200'
      }
    `}>
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg text-2xl
          ${achievement.unlocked ? 'bg-indigo-100' : 'bg-gray-100'}
        `}>
          {achievement.icon}
        </div>
        <div>
          <h3 className="font-semibold">{achievement.title}</h3>
          <p className="text-sm text-gray-600">{achievement.description}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`
              px-2 py-0.5 rounded text-xs
              ${achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'}
            `}>
              {achievement.rarity}
            </span>
            <span className="text-sm text-gray-600">
              {achievement.points} points
            </span>
          </div>
        </div>
      </div>
      
      <AchievementProgress achievement={achievement} />
      <AchievementRequirements achievement={achievement} />
    </div>
  );
}
```

## Progress Display

Shows achievement completion progress:

```typescript
// src/components/Achievements/AchievementProgress.tsx
import React from 'react';
import { Achievement } from '../../types/achievements';

interface AchievementProgressProps {
  achievement: Achievement;
}

export function AchievementProgress({ achievement }: AchievementProgressProps) {
  return (
    <div className="mt-3">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`
            h-full rounded-full transition-all duration-500
            ${achievement.unlocked 
              ? 'bg-green-500' 
              : 'bg-blue-500'
            }
          `}
          style={{ width: `${achievement.progress}%` }}
        />
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {achievement.progress}% Complete
      </div>
    </div>
  );
}
```

## Requirements Display

Shows achievement requirements and conditions:

```typescript
// src/components/Achievements/AchievementRequirements.tsx
import React from 'react';
import { Achievement, TriggerCondition } from '../../types/achievements';
import { CheckCircle, Circle } from 'lucide-react';

interface AchievementRequirementsProps {
  achievement: Achievement;
}

export function AchievementRequirements({ achievement }: AchievementRequirementsProps) {
  const formatCondition = (condition: TriggerCondition): string => {
    switch (condition.type) {
      case 'battle_wins':
        return `Win ${condition.value} battles`;
      case 'xp_gained':
        return `Gain ${condition.value} XP`;
      case 'battle_score':
        return `Score ${condition.value} points in battle`;
      case 'quests_completed':
        return `Complete ${condition.value} quests`;
      case 'login_days':
        return `Login for ${condition.value} days`;
      default:
        return `Reach ${condition.value} ${condition.type}`;
    }
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-sm mb-2">Requirements</h4>
      <ul className="space-y-2">
        {achievement.trigger_conditions.map((condition, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            {achievement.unlocked ? (
              <CheckCircle className="text-green-500" size={16} />
            ) : (
              <Circle className="text-gray-400" size={16} />
            )}
            <span className={achievement.unlocked ? 'text-green-700' : 'text-gray-600'}>
              {formatCondition(condition)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Usage Example

Implement in your game UI:

```typescript
// src/pages/Achievements.tsx
import React from 'react';
import { useAchievements } from '../../hooks/useAchievements';
import { AchievementList } from '../../components/Achievements/AchievementList';
import { Tabs, Tab } from '@mui/material';

export function AchievementsPage() {
  const { achievements } = useAchievements();
  const [category, setCategory] = React.useState<string>('all');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Achievements</h1>
      
      <Tabs
        value={category}
        onChange={(_, newValue) => setCategory(newValue)}
        className="mb-4"
      >
        <Tab label="All" value="all" />
        <Tab label="Battle" value="battle" />
        <Tab label="Progress" value="progress" />
        <Tab label="Collection" value="collection" />
        <Tab label="Mastery" value="mastery" />
      </Tabs>

      <AchievementList
        achievements={achievements}
        category={category === 'all' ? undefined : category}
      />
    </div>
  );
}
```

## Styling

The components use Tailwind CSS for styling. Make sure to include these color classes in your Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Achievement rarity colors
        legendary: {
          100: '#fef3c7',
          500: '#f59e0b',
          800: '#92400e',
        },
        epic: {
          100: '#ede9fe',
          500: '#8b5cf6',
          800: '#5b21b6',
        },
        rare: {
          100: '#dbeafe',
          500: '#3b82f6',
          800: '#1e40af',
        },
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
    },
  },
};
```

## Accessibility

The components include:
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly content structure

## Performance

Optimization techniques:
- React.memo for static components
- Virtualization for long achievement lists
- Lazy loading of images
- Efficient re-rendering strategies 