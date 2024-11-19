export function useQuests() {
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(false);

  const syncQuests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      dispatch({
        type: 'INITIALIZE_QUESTS',
        payload: data || []
      });
    } catch (error) {
      console.error('Error syncing quests:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    syncQuests();
  }, [syncQuests]);

  const updateQuestProgress = useCallback(async (questId: string, progress: number) => {
    try {
      const { data, error } = await supabase
        .from('quests')
        .update({ progress })
        .eq('id', questId)
        .select()
        .single();

      if (error) throw error;

      dispatch({
        type: 'UPDATE_QUEST',
        payload: data
      });
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  }, [dispatch]);

  return {
    quests: state.quests,
    loading,
    syncQuests,
    updateQuestProgress
  };
} 