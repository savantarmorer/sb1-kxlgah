import { MoodleEvent } from '../types/moodle';
import { supabase } from '../lib/supabase';

export async function handleMoodleEvent(event: MoodleEvent) {
    try {
        // Validate event JWT token
        const { user_id } = await validateMoodleToken(event.token);
        
        // Process event based on type
        switch (event.type) {
            case 'quiz_completed':
                await handleQuizCompletion(user_id, event.data);
                break;
            case 'forum_post':
                await handleForumPost(user_id, event.data);
                break;
            case 'assignment_submitted':
                await handleAssignmentSubmission(user_id, event.data);
                break;
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error handling Moodle event:', error);
        return { success: false, error: error.message };
    }
}

async function handleQuizCompletion(userId: string, data: any) {
    const { score, maxScore } = data;
    const percentage = (score / maxScore) * 100;
    
    // Calculate rewards
    const xpReward = Math.floor(percentage * 2);
    const coinReward = Math.floor(percentage / 2);
    
    // Update user progress
    await supabase.rpc('award_quiz_completion', {
        user_id: userId,
        xp_amount: xpReward,
        coin_amount: coinReward,
        score_percentage: percentage
    });
} 