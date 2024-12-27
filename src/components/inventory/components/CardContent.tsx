import { InventoryItem } from '../../../types/items';
import { GlassPanel } from './GlassPanel';
import { ItemEffects } from './ItemEffects';
import { ItemHeader } from './ItemHeader';
import { ItemDescription } from './ItemDescription';
import { ItemStats } from './ItemStats';
import { cardStyles } from '../styles/rarity';

interface CardContentProps {
  item: InventoryItem;
}

export const CardContent = ({ item }: CardContentProps) => (
  <div className={cardStyles.content}>
    <div className="flex flex-col space-y-4">
      <ItemHeader item={item} />
      <ItemDescription item={item} />
    </div>
    <div className="flex flex-col space-y-4">
      <ItemEffects effects={item.effects} />
      <ItemStats item={item} />
    </div>
  </div>
); 