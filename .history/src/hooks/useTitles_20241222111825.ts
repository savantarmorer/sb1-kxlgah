import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { TitleService } from '../services/titleService';
import type { DisplayTitle, UserDisplayTitle } from '../types/titles';
import { useNotification } from '../contexts/NotificationContext';

export function useTitles() {
  const { state, dispatch } = useGame();
  const { showSuccess, showError } = useNotification();
  const [titles, setTitles] = useState<DisplayTitle[]>([]);
  const [userTitles, setUserTitles] = useState<UserDisplayTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.user?.id) {
      loadTitles();
    }
  }, [state.user?.id]);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const [allTitles, userOwnedTitles] = await Promise.all([
        TitleService.getAllTitles(),
        TitleService.getUserTitles(state.user!.id)
      ]);

      setTitles(allTitles);
      setUserTitles(userOwnedTitles);
    } catch (error) {
      console.error('Error loading titles:', error);
      showError('Failed to load titles');
    } finally {
      setLoading(false);
    }
  };

  const purchaseTitle = async (titleId: string, price: number) => {
    if (!state.user) return;

    try {
      if (state.user.coins < price) {
        showError('Insufficient coins');
        return;
      }

      await TitleService.purchaseTitle({
        user_id: state.user.id,
        title_id: titleId,
        price
      });

      // Update user's coins in state
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: { coins: state.user.coins - price }
      });

      await loadTitles(); // Refresh titles
      showSuccess('Title purchased successfully!');
    } catch (error) {
      console.error('Error purchasing title:', error);
      showError('Failed to purchase title');
    }
  };

  const equipTitle = async (titleId: string) => {
    if (!state.user) return;

    try {
      await TitleService.equipTitle(state.user.id, titleId);
      const title = titles.find(t => t.id === titleId);
      
      if (title) {
        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: { display_title: title.name }
        });
      }

      await loadTitles(); // Refresh titles
      showSuccess('Title equipped successfully!');
    } catch (error) {
      console.error('Error equipping title:', error);
      showError('Failed to equip title');
    }
  };

  const unequipTitle = async () => {
    if (!state.user) return;

    try {
      await TitleService.unequipTitle(state.user.id);
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: { display_title: 'Adventurer' }
      });

      await loadTitles(); // Refresh titles
      showSuccess('Title unequipped');
    } catch (error) {
      console.error('Error unequipping title:', error);
      showError('Failed to unequip title');
    }
  };

  const isOwned = (titleId: string) => {
    return userTitles.some(ut => ut.title_id === titleId);
  };

  const isEquipped = (titleId: string) => {
    return userTitles.some(ut => ut.title_id === titleId && ut.is_equipped);
  };

  return {
    titles,
    userTitles,
    loading,
    purchaseTitle,
    equipTitle,
    unequipTitle,
    isOwned,
    isEquipped,
    refresh: loadTitles
  };
} 