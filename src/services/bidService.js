// bidService.js - Live auction and bidding operations
import { supabase } from './supabase';

// Get current admin ID from auth
const getAdminId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// ===== TEAM OPERATIONS =====

// Get all teams with current purse
export const getTeamsForAuction = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: [] };

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching teams:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Update team purse
export const updateTeamPurse = async (teamId, newPurse) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('teams')
      .update({ current_purse: newPurse })
      .eq('id', teamId)
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating team purse:', error);
    return { success: false, error: error.message };
  }
};

// ===== PLAYER OPERATIONS =====

// Get available players by category
export const getAvailablePlayers = async (category) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: [] };

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('admin_id', adminId)
      .eq('category', category)
      .eq('status', 'available')
      .order('base_price', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching players:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Get unsold players
export const getUnsoldPlayers = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: [] };

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('admin_id', adminId)
      .eq('status', 'unsold')
      .order('base_price', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching unsold players:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Mark player as sold
export const sellPlayer = async (playerId, teamId, soldPrice) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('players')
      .update({
        status: 'sold',
        sold_to_team: teamId,
        sold_price: soldPrice
      })
      .eq('id', playerId)
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error selling player:', error);
    return { success: false, error: error.message };
  }
};

// Mark player as unsold
export const unsellPlayer = async (playerId) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('players')
      .update({ status: 'unsold' })
      .eq('id', playerId)
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking player unsold:', error);
    return { success: false, error: error.message };
  }
};

// ===== BID OPERATIONS =====

// Record a bid
export const recordBid = async (playerId, teamId, bidAmount) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('bids_history')
      .insert([{
        admin_id: adminId,
        player_id: playerId,
        team_id: teamId,
        bid_amount: bidAmount
      }]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error recording bid:', error);
    return { success: false, error: error.message };
  }
};

// Get bid history for a player
export const getPlayerBidHistory = async (playerId) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: [] };

    const { data, error } = await supabase
      .from('bids_history')
      .select(`
        *,
        teams:team_id (name, team_color)
      `)
      .eq('admin_id', adminId)
      .eq('player_id', playerId)
      .order('bid_time', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching bid history:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// ===== AUCTION SUMMARY =====

// Get all sold players with team info
export const getSoldPlayers = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: [] };

    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        teams:sold_to_team (name, team_color, logo_url)
      `)
      .eq('admin_id', adminId)
      .eq('status', 'sold')
      .order('sold_price', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching sold players:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Get auction statistics
export const getAuctionSummary = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: {} };

    // Get teams with current purse
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .eq('admin_id', adminId);

    // Get sold players count and total value
    const { data: soldPlayers } = await supabase
      .from('players')
      .select('sold_price')
      .eq('admin_id', adminId)
      .eq('status', 'sold');

    // Get unsold players count
    const { count: unsoldCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .eq('status', 'unsold');

    // Get available players count
    const { count: availableCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .eq('status', 'available');

    const totalSoldValue = soldPlayers?.reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;

    return {
      success: true,
      data: {
        teams: teams || [],
        soldCount: soldPlayers?.length || 0,
        unsoldCount: unsoldCount || 0,
        availableCount: availableCount || 0,
        totalSoldValue
      }
    };
  } catch (error) {
    console.error('Error fetching summary:', error);
    return { success: false, error: error.message, data: {} };
  }
};

// ===== CATEGORY OPERATIONS =====

// Get all categories
export const getAuctionCategories = async () => {
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

// Get category details
export const getCategoryDetails = async (categoryName) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: null };

    const { data, error } = await supabase
      .from('auction_setup')
      .select('*')
      .eq('admin_id', adminId)
      .eq('category_name', categoryName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching category details:', error);
    return { success: false, error: error.message, data: null };
  }
};

// ===== RESET OPERATIONS =====

// Reset auction (keep teams and players)
export const resetAuction = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    // Get overall budget
    const { data: settings } = await supabase
      .from('auction_settings')
      .select('overall_budget')
      .eq('admin_id', adminId)
      .maybeSingle();

    const budget = settings?.overall_budget || 100000;

    // Reset team purses
    await supabase
      .from('teams')
      .update({ current_purse: budget })
      .eq('admin_id', adminId);

    // Reset all players to available
    await supabase
      .from('players')
      .update({
        status: 'available',
        sold_to_team: null,
        sold_price: null
      })
      .eq('admin_id', adminId);

    // Clear bid history
    await supabase
      .from('bids_history')
      .delete()
      .eq('admin_id', adminId);

    return { success: true };
  } catch (error) {
    console.error('Error resetting auction:', error);
    return { success: false, error: error.message };
  }
};