export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'avatar' | 'background' | 'item';
  imageUrl?: string;
}

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'default_avatar',
    name: 'Default Avatar',
    description: 'The default avatar for all players',
    price: 0,
    type: 'avatar',
    imageUrl: '/avatars/default.png'
  },
  // Add more store items as needed
];
