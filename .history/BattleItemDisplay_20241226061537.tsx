import { calculateBattleRewards } from '../../utils/battleUtils';
// Applies effects but may not sync with battle state
const handleItemClick = (item: InventoryItem) => {
  onUseItem(item);
}; 