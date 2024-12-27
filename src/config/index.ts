export const CACHE_CONFIG = {
  defaultTTL: 3600, // 1 hour in seconds
  patterns: {
    tournament: 'tournament:*',
    match: 'match:*',
    user: 'user:*'
  },
  keys: {
    tournament: (id: string) => `tournament:${id}`,
    match: (id: string) => `match:${id}`,
    user: (id: string) => `user:${id}`
  }
}; 