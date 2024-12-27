import { supabase } from '../lib/supabase';
import type { DisplayTitle, UserDisplayTitle, TitleStats, TitlePurchasePayload, TitleUpdatePayload } from '../types/titles';

export class TitleService {
  /**
   * Admin Operations
   */
  static async createTitle(title: Omit<DisplayTitle, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('display_titles')
      .insert(title)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTitle(id: string, updates: TitleUpdatePayload) {
    const { data, error } = await supabase
      .from('display_titles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTitle(id: string) {
    const { error } = await supabase
      .from('display_titles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getAllTitles() {
    const { data, error } = await supabase
      .from('display_titles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * User Operations
   */
  static async getUserTitles(userId: string) {
    const { data, error } = await supabase
      .from('user_display_titles')
      .select(`
        *,
        title:display_titles(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data as UserDisplayTitle[];
  }

  static async purchaseTitle(payload: TitlePurchasePayload) {
    // Start a transaction
    const { data: title, error: titleError } = await supabase
      .from('display_titles')
      .select('*')
      .eq('id', payload.title_id)
      .single();

    if (titleError) throw titleError;
    if (!title) throw new Error('Title not found');
    if (title.price !== payload.price) throw new Error('Price mismatch');

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('shop_transactions')
      .insert({
        user_id: payload.user_id,
        item_id: payload.title_id,
        quantity: 1,
        price_paid: payload.price,
        transaction_type: 'title_purchase',
        metadata: { title_name: title.name }
      });

    if (transactionError) throw transactionError;

    // Add title to user's collection
    const { error: unlockError } = await supabase
      .from('user_display_titles')
      .insert({
        user_id: payload.user_id,
        title_id: payload.title_id,
        is_equipped: false,
        unlocked_at: new Date().toISOString()
      });

    if (unlockError) throw unlockError;

    return title;
  }

  static async equipTitle(userId: string, titleId: string) {
    // First, unequip any currently equipped title
    await supabase
      .from('user_display_titles')
      .update({ is_equipped: false })
      .eq('user_id', userId)
      .eq('is_equipped', true);

    // Then equip the new title
    const { error } = await supabase
      .from('user_display_titles')
      .update({ is_equipped: true })
      .eq('user_id', userId)
      .eq('title_id', titleId);

    if (error) throw error;

    // Update the user's profile with the new title
    const { data: title } = await supabase
      .from('display_titles')
      .select('name')
      .eq('id', titleId)
      .single();

    if (title) {
      await supabase
        .from('profiles')
        .update({ display_title: title.name })
        .eq('id', userId);
    }
  }

  static async unequipTitle(userId: string) {
    // Unequip the current title
    const { error } = await supabase
      .from('user_display_titles')
      .update({ is_equipped: false })
      .eq('user_id', userId)
      .eq('is_equipped', true);

    if (error) throw error;

    // Reset the user's profile title to default
    await supabase
      .from('profiles')
      .update({ display_title: 'Adventurer' })
      .eq('id', userId);
  }

  /**
   * Analytics
   */
  static async getTitleStats(titleId: string): Promise<TitleStats> {
    const { data: purchases, error: purchaseError } = await supabase
      .from('shop_transactions')
      .select('price_paid')
      .eq('item_id', titleId)
      .eq('transaction_type', 'title_purchase');

    if (purchaseError) throw purchaseError;

    const { count: activeUsers, error: userError } = await supabase
      .from('user_display_titles')
      .select('*', { count: 'exact', head: true })
      .eq('title_id', titleId)
      .eq('is_equipped', true);

    if (userError) throw userError;

    const totalPurchases = purchases?.length || 0;
    const revenueGenerated = purchases?.reduce((sum, p) => sum + (p.price_paid || 0), 0) || 0;

    return {
      total_purchases: totalPurchases,
      revenue_generated: revenueGenerated,
      active_users: activeUsers || 0,
      popularity_rank: 0 // This would need a more complex query to calculate
    };
  }
} 