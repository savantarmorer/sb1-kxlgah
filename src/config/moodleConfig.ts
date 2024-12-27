export const MOODLE_CONFIG = {
    // Reward multipliers
    rewards: {
        quiz: {
            xpBase: 2, // XP per percentage point
            xpBonus: 50, // Bonus for >90% score
            coinBase: 0.5, // Coins per percentage point
            coinBonus: 25 // Bonus for >90% score
        },
        forum: {
            xpPerWord: 0.5,
            maxXP: 100,
            firstPostBonus: 50,
            coinPerWord: 0.1
        },
        assignment: {
            xpBase: 100,
            earlySubmissionBonus: 50,
            coinBase: 25
        }
    },

    // Achievement thresholds
    achievements: {
        perfectQuiz: 100, // Perfect score
        forumParticipation: 10, // Posts
        assignmentStreak: 5 // Consecutive on-time submissions
    },

    // API Configuration
    api: {
        endpoint: process.env.MOODLE_API_URL,
        token: process.env.MOODLE_API_TOKEN,
        timeout: 5000
    }
} as const; 