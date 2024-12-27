# Project Architecture

## Context Organization
All context providers are located in `src/contexts/`. The main game state is managed by `GameContext.tsx`, which handles:

- User state
- Battle system
- Achievement system
- Quest system
- Inventory management
- Statistics tracking

Any imports should reference the context from this location: 