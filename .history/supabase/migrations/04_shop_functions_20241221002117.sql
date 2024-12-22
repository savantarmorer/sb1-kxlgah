-- Function to purchase a shop item
CREATE OR REPLACE FUNCTION purchase_shop_item(
    p_shop_item_id UUID,
    p_user_id UUID,
    p_quantity INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    v_item_price INTEGER;
    v_item_id UUID;
    v_current_coins INTEGER;
    v_stock INTEGER;
BEGIN
    -- Get item details and validate availability
    SELECT 
        CASE 
            WHEN discount_price IS NOT NULL AND discount_ends_at > NOW() 
            THEN discount_price 
            ELSE price 
        END,
        item_id,
        stock
    INTO v_item_price, v_item_id, v_stock
    FROM shop_items
    WHERE id = p_shop_item_id AND is_available = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shop item not found or not available';
    END IF;

    -- Check stock if it's not unlimited
    IF v_stock IS NOT NULL THEN
        IF v_stock < p_quantity THEN
            RAISE EXCEPTION 'Not enough stock available';
        END IF;
    END IF;

    -- Get user's current coins
    SELECT coins INTO v_current_coins
    FROM profiles
    WHERE id = p_user_id;

    IF v_current_coins < (v_item_price * p_quantity) THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;

    -- Start transaction
    BEGIN
        -- Update user's coins
        UPDATE profiles
        SET coins = coins - (v_item_price * p_quantity)
        WHERE id = p_user_id;

        -- Update stock if it's not unlimited
        IF v_stock IS NOT NULL THEN
            UPDATE shop_items
            SET stock = stock - p_quantity
            WHERE id = p_shop_item_id;
        END IF;

        -- Add item to user's inventory
        INSERT INTO user_inventory (user_id, item_id, quantity, acquired_at)
        VALUES (p_user_id, v_item_id, p_quantity, NOW())
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET quantity = user_inventory.quantity + p_quantity;

        -- Record the transaction
        INSERT INTO shop_transactions (user_id, item_id, quantity, price_paid)
        VALUES (p_user_id, p_shop_item_id, p_quantity, v_item_price * p_quantity);
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 