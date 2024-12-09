import { useEffect } from 'react';
import { use_game } from '../contexts/GameContext';

export function useStudyTime() {
  const { state, dispatch } = use_game();
  
  useEffect(() => {
    let startTime = Date.now();
    let timer = setInterval(() => {
      const studyTime = Math.floor((Date.now() - startTime) / 1000);
      dispatch({
        type: 'update_study_time',
        payload: {
          today: studyTime,
          total: studyTime
        }
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [dispatch]);

  return state.user.study_time;
} 