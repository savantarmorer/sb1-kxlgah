# Database Guide

## Core Tables and Their Purpose

### Admin-Managed Tables
1. `achievements`
   - Stores achievement definitions
   - Only admins can modify
   - Everyone can view

2. `daily_rewards`
   - Defines daily reward system
   - Managed by admins
   - Public viewing

3. `quests`
   - Quest definitions and requirements
   - Admin controlled
   - Public access for viewing

### User Data Tables
1. `profiles`
   - Core user information
   - Users can edit their own profile
   - Admin flag controls system access

2. `battle_stats`
   - Tracks user battle performance
   - Automatically updated during battles
   - Users can view their own stats

3. `user_achievements`, `user_quests`, `user_daily_rewards`
   - Track user progress and claims
   - Automatically updated by system
   - Users can only access their own data

## Common Operations

### User Operations 