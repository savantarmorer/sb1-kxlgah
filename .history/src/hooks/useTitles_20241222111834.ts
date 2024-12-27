import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGame } from '../contexts/GameContext';
import { useNotification } from '../contexts/NotificationContext';
import { DisplayTitle } from '../types/titles';

interface UserTitle {
  id: string;
  user_id: string;
  title_id: string;
  is_equipped: boolean;
  unlocked_at: string;
  title: DisplayTitle;
}

export function useTitles() {
  const { state, dispatch } = useGame();
  const { showSuccess, showError } = useNotification();
  const [userTitles, setUserTitles] = useState<UserTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.user?.id) {
      loadUserTitles();
    }
  }, [state.user?.id]);

  const loadUserTitles = async () => {
    try {
      setLoading(true);
      const { data: userTitlesData, error: userTitlesError } = await supabase
        .from('user_display_titles')
        .select(`
          *,
          title:display_titles(*)
        `)
        .eq('user_id', state.user?.id);

      if (userTitlesError) throw userTitlesError;

      setUserTitles(userTitlesData as UserTitle[]);
    } catch (error) {
      console.error('Error loading user titles:', error);
      showError('Failed to load titles');
    } finally {
      setLoading(false);
    }
  };

  const equipTitle = async (titleId: string) => {
    if (!state.user?.id) return;

    try {
      setLoading(true);

      // First, unequip all other titles
      await supabase
        .from('user_display_titles')
        .update({ is_equipped: false })
        .eq('user_id', state.user.id);

      // Then equip the selected title
      const { error: equipError } = await supabase
        .from('user_display_titles')
        .update({ is_equipped: true })
        .eq('id', titleId)
        .eq('user_id', state.user.id);

      if (equipError) throw equipError;

      // Get the title details
      const { data: titleData, error: titleError } = await supabase
        .from('display_titles')
        .select('name')
        .eq('id', titleId)
        .single();

      if (titleError) throw titleError;

      // Update the user's profile with the new title
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_title: titleData.name })
        .eq('id', state.user.id);

      if (profileError) throw profileError;

      // Update local state
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: {
          ...state.user,
          display_title: titleData.name
        }
      });

      await loadUserTitles();
      showSuccess('Title equipped successfully');
    } catch (error) {
      console.error('Error equipping title:', error);
      showError('Failed to equip title');
    } finally {
      setLoading(false);
    }
  };

  const unequipTitle = async (titleId: string) => {
    if (!state.user?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_display_titles')
        .update({ is_equipped: false })
        .eq('id', titleId)
        .eq('user_id', state.user.id);

      if (error) throw error;

      // Update the user's profile to remove the title
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_title: null })
        .eq('id', state.user.id);

      if (profileError) throw profileError;

      // Update local state
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: {
          ...state.user,
          display_title: null
        }
      });

      await loadUserTitles();
      showSuccess('Title unequipped');
    } catch (error) {
      console.error('Error unequipping title:', error);
      showError('Failed to unequip title');
    } finally {
      setLoading(false);
    }
  };

  return {
    userTitles,
    loading,
    equipTitle,
    unequipTitle
  };
} 