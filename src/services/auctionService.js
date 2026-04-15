// auctionService.js - Auction setup database operations
import { supabase } from './supabase';

// Get current admin ID from auth
const getAdminId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// ===== CATEGORIES =====

// Get all categories
export const getCategories = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: [] };

    const { data, error } = await supabase
      .from('auction_setup')
      .select('*')
      .eq('admin_id', adminId)
      .order('base_price', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Create a category
export const createCategory = async (categoryData) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('auction_setup')
      .insert([
        {
          admin_id: adminId,
          category_name: categoryData.name,
          base_price: categoryData.basePrice,
          increment_value: categoryData.increment,
        }
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message };
  }
};

// Update a category
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('auction_setup')
      .update({
        category_name: categoryData.name,
        base_price: categoryData.basePrice,
        increment_value: categoryData.increment,
      })
      .eq('id', categoryId)
      .eq('admin_id', adminId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message };
  }
};

// Delete a category
export const deleteCategory = async (categoryId) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('auction_setup')
      .delete()
      .eq('id', categoryId)
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message };
  }
};

// Save all categories
export const saveAllCategories = async (categories) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const categoriesToUpsert = categories.map(cat => ({
      id: cat.id,
      admin_id: adminId,
      category_name: cat.name,
      base_price: cat.basePrice,
      increment_value: cat.increment,
    }));

    const { data, error } = await supabase
      .from('auction_setup')
      .upsert(categoriesToUpsert, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving categories:', error);
    return { success: false, error: error.message };
  }
};

// ===== BUDGET =====

// Get overall budget
export const getBudget = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: { overall_budget: 100000 } };

    const { data, error } = await supabase
      .from('auction_settings')
      .select('overall_budget')
      .eq('admin_id', adminId)
      .maybeSingle();

    if (error) {
      console.warn('Budget fetch warning, using default');
      return { success: true, data: { overall_budget: 100000 } };
    }
    
    return { 
      success: true, 
      data: { overall_budget: data?.overall_budget || 100000 } 
    };
  } catch (error) {
    console.warn('Budget fetch failed, using default');
    return { success: true, data: { overall_budget: 100000 } };
  }
};

// Save budget
export const saveBudget = async (budget) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    // First check if record exists
    const { data: existing } = await supabase
      .from('auction_settings')
      .select('id')
      .eq('admin_id', adminId)
      .maybeSingle();

    let result;
    
    if (existing) {
      // Update existing
      result = await supabase
        .from('auction_settings')
        .update({ overall_budget: budget })
        .eq('admin_id', adminId)
        .select();
    } else {
      // Insert new
      result = await supabase
        .from('auction_settings')
        .insert([{ admin_id: adminId, overall_budget: budget }])
        .select();
    }

    const { data, error } = result;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving budget:', error);
    return { success: false, error: error.message };
  }
};

// ===== STATISTICS =====

// Get auction statistics
export const getAuctionStats = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: { teams: 0, players: 0 } };

    // Get teams count
    const { count: teamsCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId);

    // Get players count
    const { count: playersCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId);

    return {
      success: true,
      data: {
        teams: teamsCount || 0,
        players: playersCount || 0,
      }
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { success: false, error: error.message };
  }
};