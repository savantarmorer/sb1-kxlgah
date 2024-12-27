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

    enhancedResolveOptions: {
      conditionNames: ['require', 'import', 'node', 'default'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }
  }
};
