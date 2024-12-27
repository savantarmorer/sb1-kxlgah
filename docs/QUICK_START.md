# Quick Start Guide

## Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- Supabase account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
REDIS_URL=your_redis_url
```

4. Initialize the database:
```bash
# Run base schema
psql -U postgres -d your_database -f docs/SQL_SCHEMA.sql

# Run tournament schema
psql -U postgres -d your_database -f docs/TOURNAMENT_SCHEMA.sql

# Run tournament functions
psql -U postgres -d your_database -f docs/TOURNAMENT_FUNCTIONS.sql
```

## Configuration

### Database Setup
1. Create required tables and functions
2. Set up Row Level Security (RLS) policies
3. Configure database indexes
4. Initialize required extensions

### Redis Setup
1. Configure Redis connection
2. Set up caching policies
3. Configure rate limiting

### Tournament Setup
1. Configure tournament settings in `config/index.ts`:
```typescript
export const TOURNAMENT_CONFIG = {
  maxParticipants: 32,
  defaultTimeLimit: 60,
  ratingThreshold: 100,
  matchmakingTimeout: 30,
  cacheExpiry: 3600
};
```

2. Initialize tournament services:
```typescript
// Initialize tournament orchestrator
await initializeTournamentServices({
  redisClient,
  supabaseClient,
  config: TOURNAMENT_CONFIG
});
```

3. Set up tournament roles and permissions in Supabase.

## Development

1. Start the development server:
```bash
npm run dev
```

2. Run tests:
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Tournament tests
npm run test:tournament
```

3. Build for production:
```bash
npm run build
```

## Features

### Core Features
- User authentication
- Profile management
- Battle system
- Quest system
- Achievement system
- Store system
- Inventory system

### Tournament Features
- Tournament creation
- Participant registration
- Match system
- Bracket visualization
- Leaderboards
- Rewards system
- Admin controls

## Monitoring

1. Set up monitoring:
```bash
# Initialize monitoring
npm run init:monitoring

# Start metrics collection
npm run start:metrics
```

2. Monitor tournament metrics:
```bash
# View tournament stats
npm run stats:tournament

# Check system health
npm run health:check
```

## Troubleshooting

### Common Issues

1. Database Connection
```bash
# Test database connection
npm run test:db

# Reset database
npm run db:reset
```

2. Redis Connection
```bash
# Test Redis connection
npm run test:redis

# Clear Redis cache
npm run cache:clear
```

3. Tournament Issues
```bash
# Check tournament status
npm run tournament:status

# Reset tournament state
npm run tournament:reset

# Clear tournament cache
npm run tournament:clear-cache
```

## Security

1. Enable security features:
```bash
# Enable RLS
npm run security:enable-rls

# Configure rate limiting
npm run security:configure-limits
```

2. Monitor security:
```bash
# Check security logs
npm run security:logs

# Test security policies
npm run security:test
```

## Support

For additional help:
1. Check documentation in `/docs`
2. Run diagnostics: `npm run diagnose`
3. Contact support team

## Next Steps

1. Customize configuration
2. Add custom features
3. Set up monitoring
4. Deploy to production
5. Set up CI/CD