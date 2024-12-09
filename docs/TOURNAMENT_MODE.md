# Tournament Mode Documentation

## Overview
The tournament system provides a competitive platform for users to participate in structured quiz competitions. It includes bracket-style tournaments, real-time matchmaking, and reward systems.

## Architecture

### Component Architecture
```
Tournament System
├── Frontend Layer
│   ├── Views
│   │   ├── TournamentView (Main Container)
│   │   ├── TournamentList (Discovery)
│   │   ├── TournamentBracket (Progression)
│   │   ├── MatchView (Active Gameplay)
│   │   ├── TournamentLeaderboard (Rankings)
│   │   └── TournamentHistory (Past Events)
│   └── Admin
│       └── TournamentManager (Administration)
├── Service Layer
│   ├── TournamentService (Core Logic)
│   ├── TournamentMatchmaking (Pairing)
│   ├── TournamentOrchestrator (Flow Control)
│   └── TournamentCache (Performance)
└── Data Layer
    ├── Database (Supabase)
    └── Cache (Redis)
```

### Data Flow
1. **Tournament Creation**
   ```
   Admin → TournamentManager → TournamentService → Database
   ```

2. **Tournament Registration**
   ```
   User → TournamentList → TournamentService → Database
   ↳ TournamentOrchestrator (validates) → Cache (updates)
   ```

3. **Match Flow**
   ```
   TournamentOrchestrator → Matchmaking → Cache
   ↳ MatchView → TournamentService → Database
   ↳ WebSocket (real-time updates)
   ```

4. **Score Processing**
   ```
   MatchView → TournamentService → Database
   ↳ TournamentOrchestrator → Cache (updates)
   ↳ Leaderboard (updates)
   ```

### State Management
```typescript
// Tournament Context State
interface TournamentState {
  tournaments: Tournament[];
  currentTournament?: Tournament;
  currentMatch?: Match;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
  userStats: UserTournamentStats;
}

// Tournament Service Flow
class TournamentService {
  async createTournament(config: TournamentConfig);
  async joinTournament(tournamentId: string, userId: string);
  async startMatch(matchId: string);
  async submitAnswer(matchId: string, answer: string);
  async processTournamentResults(tournamentId: string);
}
```

## Components

### Frontend Components
1. **TournamentView** (`src/components/Tournament/TournamentView.tsx`)
   - Main tournament interface
   - Handles navigation between tournament sections
   - Integrates all tournament sub-components

2. **TournamentList** (`src/components/Tournament/TournamentList.tsx`)
   - Displays available and upcoming tournaments
   - Handles tournament registration
   - Shows tournament status and details

3. **TournamentBracket** (`src/components/Tournament/TournamentBracket.tsx`)
   - Visualizes tournament progression
   - Shows match pairings and results
   - Handles match navigation

4. **TournamentLeaderboard** (`src/components/Tournament/TournamentLeaderboard.tsx`)
   - Displays tournament rankings
   - Shows participant statistics
   - Highlights achievements and rewards

5. **TournamentHistory** (`src/components/Tournament/TournamentHistory.tsx`)
   - Lists past tournament participation
   - Shows historical performance
   - Displays earned rewards

6. **TournamentRewards** (`src/components/Tournament/TournamentRewards.tsx`)
   - Shows available prizes
   - Displays achievement progress
   - Handles reward distribution

7. **MatchView** (`src/components/Tournament/MatchView.tsx`)
   - Real-time match interface
   - Question display and answer handling
   - Score tracking and timer

### Admin Components
1. **TournamentManager** (`src/components/admin/TournamentManager.tsx`)
   - Tournament creation and editing
   - Participant management
   - Tournament status control

### Services
1. **TournamentService** (`src/services/tournamentService.ts`)
   - Core tournament logic
   - Database operations
   - State management

2. **TournamentMatchmaking** (`src/services/tournamentMatchmaking.ts`)
   - Player pairing algorithms
   - Skill-based matchmaking
   - Tournament bracket generation

3. **TournamentOrchestrator** (`src/services/tournamentOrchestrator.ts`)
   - Tournament progression management
   - Match synchronization
   - Rate limiting

4. **TournamentCache** (`src/services/tournamentCache.ts`)
   - Question caching
   - Performance optimization
   - State persistence

### Database Integration
1. **Schema** (`docs/TOURNAMENT_SCHEMA.sql`)
   - Tournament tables
   - Participant tracking
   - Match history
   - Reward system

2. **Functions** (`docs/TOURNAMENT_FUNCTIONS.sql`)
   - Tournament management procedures
   - Matchmaking functions
   - Analytics queries

3. **Security** (`docs/TOURNAMENT_SCHEMA.sql`)
   - Row Level Security (RLS) policies
   - Access control
   - Data protection

## Features

### Tournament Types
- Single Elimination
- Double Elimination
- Round Robin
- Custom Formats

### Matchmaking
- Skill-based pairing
- Rating system
- Anti-smurfing measures

### Rewards
- Experience points (XP)
- In-game currency
- Special achievements
- Unique badges

### Analytics
- Performance tracking
- Match statistics
- Player rankings
- Tournament metrics

## Integration Points

### Navigation
- Tournament mode accessible from main navigation
- Seamless integration with other game modes
- Context-aware navigation

### State Management
- Tournament context provider
- Real-time state updates
- Persistent storage

### User Interface
- Responsive design
- Dark mode support
- Animated transitions
- Loading states

## Security

### Access Control
- Role-based permissions
- Tournament registration validation
- Match result verification

### Rate Limiting
- Request throttling
- Anti-cheat measures
- Abuse prevention

### Data Protection
- Row Level Security
- Input validation
- Error handling

## Performance

### Optimization
- Question caching
- State persistence
- Lazy loading
- Code splitting

### Monitoring
- Performance metrics
- Error tracking
- Usage analytics

## Future Improvements
1. Real-time spectator mode
2. Tournament chat system
3. Custom tournament rules
4. Advanced analytics dashboard
5. Tournament replay system
6. Mobile-optimized interface
7. Social features integration
8. Advanced anti-cheat measures

## Dependencies
- Framer Motion (animations)
- Lucide React (icons)
- TailwindCSS (styling)
- Supabase (database)
- Redis (caching)

## Getting Started
1. Ensure database schema is up to date
2. Configure environment variables
3. Set up Redis for caching
4. Initialize tournament services
5. Test tournament flow

## Troubleshooting
1. Check database connectivity
2. Verify Redis cache status
3. Monitor rate limiting
4. Check security policies
5. Validate tournament state

## Database Schema

### Core Tables
```sql
-- Tournament Configuration
CREATE TABLE tournaments (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status tournament_status NOT NULL,
  max_participants INT NOT NULL,
  current_round INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament Participants
CREATE TABLE tournament_participants (
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES profiles(id),
  status participant_status NOT NULL,
  score INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  matches_lost INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tournament_id, user_id)
);

-- Tournament Matches
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  round INT NOT NULL,
  player1_id UUID REFERENCES profiles(id),
  player2_id UUID REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  status match_status NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Performance Optimizations
```sql
-- Indexes for frequent queries
CREATE INDEX idx_tournament_status ON tournaments(status);
CREATE INDEX idx_tournament_dates ON tournaments(start_date, end_date);
CREATE INDEX idx_match_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_participant_tournament ON tournament_participants(tournament_id);
```

## Error Handling

### Error Types
```typescript
export class TournamentError extends Error {
  constructor(
    message: string,
    public code: TournamentErrorCode,
    public details?: any
  ) {
    super(message);
  }
}

export enum TournamentErrorCode {
  TOURNAMENT_FULL = 'TOURNAMENT_FULL',
  INVALID_STATE = 'INVALID_STATE',
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_ACTION = 'INVALID_ACTION'
}
```

### Error Recovery
1. **Match Interruption**
   ```typescript
   try {
     await recoverMatchState(matchId);
     await syncParticipantState(matchId);
     await resumeMatch(matchId);
   } catch (error) {
     await handleMatchFailure(matchId, error);
   }
   ```

2. **Tournament State Recovery**
   ```typescript
   try {
     await validateTournamentState(tournamentId);
     await repairBrackets(tournamentId);
     await syncLeaderboard(tournamentId);
   } catch (error) {
     await handleTournamentFailure(tournamentId, error);
   }
   ```

## Feedback System

The tournament system includes a comprehensive feedback collection and analysis system that helps improve the user experience and monitor system performance.

### Match Feedback
- Players can provide feedback after each match
- Feedback includes:
  - Overall rating (1-5)
  - Connection quality rating (1-5)
  - Match balance rating (1-5)
  - Issues encountered (lag, disconnect, unfair matching, bugs)
  - Additional comments

### Tournament Feedback
- Players can provide feedback after tournament completion
- Feedback includes:
  - Overall experience rating (1-5)
  - Would play again indicator
  - Format rating (1-5)
  - Suggestions for improvement

### Feedback Collection
- Feedback is collected through modal forms
- Players can only submit feedback once per match/tournament
- Feedback is stored in dedicated database tables with appropriate indexes
- Row-level security ensures data privacy

### Feedback Analysis
- Tournament organizers can view aggregated feedback
- Analysis includes:
  - Average ratings
  - Common issues
  - Suggestions trends
  - Player satisfaction metrics

## Metrics System

The tournament system includes a robust metrics collection and analysis system for monitoring performance and user engagement.

### System Metrics
- Real-time monitoring of:
  - CPU usage
  - Memory usage
  - Error rates
  - Response times
  - Active connections
  - Requests per second

### Performance Metrics
- Match duration analysis
- Completion rates
- Error frequency
- System bottlenecks
- Peak usage times

### Player Retention Metrics
- Daily active users
- Weekly active users
- Monthly active users
- Churn rate analysis
- Engagement trends

### Metrics Collection
- Automated collection through system services
- Data stored in time-series format
- Efficient indexing for quick retrieval
- Secure access control through RLS

### Metrics Analysis
- Real-time dashboards
- Historical trend analysis
- Performance reports
  - Daily reports
  - Weekly reports
  - Custom date range reports
- Bottleneck identification
- System recommendations

### Alert System
- Configurable metric alerts
- Alert conditions:
  - Greater than threshold
  - Less than threshold
  - Equals threshold
- Alert notifications
- Alert history tracking
- Resolution tracking

## Database Schema

### Feedback Tables
```sql
-- Match feedback storage
CREATE TABLE match_feedback (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES tournament_matches,
  player_id UUID REFERENCES players,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  latency_rating INTEGER CHECK (latency_rating BETWEEN 1 AND 5),
  balance_rating INTEGER CHECK (balance_rating BETWEEN 1 AND 5),
  comments TEXT,
  issues TEXT[],
  created_at TIMESTAMPTZ
);

-- Tournament feedback storage
CREATE TABLE tournament_feedback (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments,
  player_id UUID REFERENCES players,
  overall_experience INTEGER CHECK (overall_experience BETWEEN 1 AND 5),
  would_play_again BOOLEAN,
  format_rating INTEGER CHECK (format_rating BETWEEN 1 AND 5),
  suggestions TEXT,
  created_at TIMESTAMPTZ
);
```

### Metrics Tables
```sql
-- System metrics storage
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ,
  cpu_usage FLOAT CHECK (cpu_usage BETWEEN 0 AND 100),
  memory_usage FLOAT CHECK (memory_usage BETWEEN 0 AND 100),
  error_rate FLOAT,
  response_time INTEGER,
  active_connections INTEGER,
  requests_per_second INTEGER
);

-- Feedback metrics aggregation
CREATE TABLE feedback_metrics (
  id UUID PRIMARY KEY,
  type TEXT CHECK (type IN ('match', 'tournament')),
  timestamp TIMESTAMPTZ,
  metrics JSONB
);

-- Metric alerts configuration
CREATE TABLE metric_alerts (
  id UUID PRIMARY KEY,
  metric_name TEXT,
  condition TEXT CHECK (condition IN ('greater_than', 'less_than', 'equals')),
  threshold FLOAT,
  status TEXT CHECK (status IN ('active', 'paused', 'deleted')),
  notification_channels JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Alert history tracking
CREATE TABLE alert_history (
  id UUID PRIMARY KEY,
  alert_id UUID REFERENCES metric_alerts,
  triggered_at TIMESTAMPTZ,
  metric_value FLOAT,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);
```

## Security

### Row Level Security
- Match feedback:
  - Players can view their own feedback
  - Tournament organizers can view feedback for their tournaments
- Tournament feedback:
  - Players can view their own feedback
  - Tournament organizers can view feedback for their tournaments
- System metrics:
  - Only admins can view metrics
  - Only system can insert metrics
- Metric alerts:
  - Only admins can manage alerts
  - Only system can insert alert history

### Data Privacy
- Personal feedback is protected
- Aggregated data is available to authorized users
- Sensitive metrics are restricted to admins
- Secure API endpoints with authentication

## Integration

### Frontend Components
- FeedbackModal: Collects user feedback
- FeedbackButton: Triggers feedback collection
- MetricsDashboard: Displays system metrics
- AlertsPanel: Manages metric alerts

### Backend Services
- FeedbackService: Manages feedback operations
- MetricsService: Handles metrics collection and analysis
- AlertService: Manages metric alerts

### Database Functions
- get_match_feedback_summary: Aggregates match feedback
- get_tournament_feedback_summary: Aggregates tournament feedback
- get_system_health_metrics: Retrieves system health data
- get_player_retention_metrics: Analyzes player retention
- track_metric_alert: Records metric alerts
- check_metric_alerts: Evaluates metric conditions
- aggregate_feedback_metrics: Processes feedback data

## Testing

### Unit Tests
- FeedbackModal.test.tsx: Tests feedback collection UI
- FeedbackService.test.ts: Tests feedback operations
- MetricsService.test.ts: Tests metrics collection

### Integration Tests
- feedback.cy.ts: Tests feedback system flow
- metrics.cy.ts: Tests metrics system flow

### Test Utilities
- generateFeedbackTestData: Creates test feedback data
- generateMetricsTestData: Creates test metrics data
- mockFeedbackService: Mocks feedback operations
- mockMetricsService: Mocks metrics operations