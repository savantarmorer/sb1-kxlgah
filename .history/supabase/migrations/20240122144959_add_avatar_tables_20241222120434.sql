-- Add gem_price to shop_items
ALTER TABLE shop_items
ADD COLUMN gem_price INTEGER;

-- Add gem_price to items table for default pricing
ALTER TABLE items
ADD COLUMN gem_price INTEGER;

-- Add gem_price to display_titles for consistency
ALTER TABLE display_titles
ADD COLUMN gem_price INTEGER;

-- Add price fields to avatars table
ALTER TABLE avatars
ADD COLUMN price INTEGER,
ADD COLUMN gem_price INTEGER,
ADD COLUMN rarity TEXT NOT NULL DEFAULT 'common',
ADD COLUMN requirements JSONB,
ADD COLUMN metadata JSONB;

-- Create set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_avatars table to track owned/equipped avatars
CREATE TABLE IF NOT EXISTS user_avatars (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_id INTEGER REFERENCES avatars(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, avatar_id)
);

-- Add RLS policies for user_avatars
ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own avatars"
    ON user_avatars FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatars"
    ON user_avatars FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avatars"
    ON user_avatars FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add trigger to maintain updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON user_avatars
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Add trigger to ensure only one equipped avatar per user
CREATE OR REPLACE FUNCTION public.ensure_single_equipped_avatar()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_equipped THEN
        UPDATE user_avatars
        SET is_equipped = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_equipped_avatar
    BEFORE INSERT OR UPDATE ON user_avatars
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_equipped_avatar();

-- Create view for shop avatars
CREATE OR REPLACE VIEW v_shop_avatars AS
SELECT 
    a.id,
    a.name,
    a.description,
    a.url,
    a.category,
    a.rarity,
    a.price,
    a.gem_price,
    a.requirements,
    a.metadata,
    a.is_premium,
    a.is_active,
    COALESCE(ua.is_equipped, false) as is_equipped,
    ua.unlocked_at as acquired_at
FROM avatars a
LEFT JOIN user_avatars ua ON ua.avatar_id = a.id AND ua.user_id = auth.uid()
WHERE a.is_active = true;

-- Add RLS policy for v_shop_avatars
ALTER VIEW v_shop_avatars OWNER TO authenticated;

-- Add avatar items to shop_items view
CREATE OR REPLACE VIEW v_shop_items AS
SELECT 
    si.id,
    si.item_id,
    si.price,
    si.gem_price,
    si.discount_price,
    si.discount_ends_at,
    si.stock,
    si.is_featured,
    si.is_available,
    si.created_at,
    si.updated_at,
    i.name,
    i.description,
    i.type,
    i.rarity,
    i.icon,
    i.icon_color,
    i.effects,
    i.metadata as item_metadata,
    i.effect_multiplier,
    i.allowed_combinations,
    COALESCE(
        CASE 
            WHEN si.discount_ends_at > now() THEN si.discount_price 
            ELSE NULL 
        END,
        si.price
    ) as current_price,
    si.discount_ends_at > now() as is_on_sale
FROM shop_items si
JOIN items i ON i.id = si.item_id; 