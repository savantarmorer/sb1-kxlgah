-- First, add the elimination potion to the items table
INSERT INTO items (id, name, description, type, rarity, effects, metadata)
VALUES (
    'elimination-potion-1',
    'Elimination Potion',
    'Eliminates one wrong answer during battle',
    'consumable',
    'rare',
    '[{
        "type": "eliminate_wrong_answer",
        "value": 1,
        "metadata": {
            "battle_only": true,
            "max_uses": 1,
            "icon": "🧪",
            "uses_remaining": 1
        }
    }]'::jsonb,
    '{"icon": "/images/items/potion-purple.png"}'::jsonb
);

-- Then, add it to the shop_items table
INSERT INTO shop_items (item_id, price, is_featured, is_available)
VALUES (
    'elimination-potion-1',
    200,
    true,
    true
); 