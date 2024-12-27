/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'Evite dependências circulares.',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Dependências não resolvidas precisam ser corrigidas.',
      from: {},
      to: {
        couldNotResolve: true
      }
    }
  ],
  options: {
    maxDepth: 2,
    includeOnly: [
      '^src',
      '^lib'
    ],
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: [
        'npm',
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled'
      ]
    },
    focus: [
      'src/components/Battle/BattleMode.tsx',
      'src/hooks/useBattle.ts',
      'src/services/battleService.ts',
      'src/utils/battleUtils.ts',
      'src/types/battle.ts',
      'src/lib/levelSystem.ts',
      'src/components/RewardSystem/XPSystem.tsx',
      'src/hooks/useLevelSystem.ts',
      'src/types/user.ts',
      'src/services/progressService.ts',
      'src/lib/supabaseClient.ts',
      'src/components/Battle/BattleStateTransition.tsx',
      'src/components/Battle/QuestionDisplay.tsx',
      'src/components/Battle/ScoreDisplay.tsx',
      'src/contexts/game/battle.ts'
    ],
    enhancedResolveOptions: {
      conditionNames: ['require', 'import', 'node', 'default'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }
  }
};
