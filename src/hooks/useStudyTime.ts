import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

interface StudyTimeData {
  today: number;
  total: number;
}

export function useStudyTime(): StudyTimeData {
  const { state, dispatch } = useGame();
  
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