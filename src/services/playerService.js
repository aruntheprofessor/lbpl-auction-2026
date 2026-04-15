// playerService.js - Player database operations
import { supabase } from './supabase';

// Get current admin ID from auth
const getAdminId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Create a new player
export const createPlayer = async (playerData) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('players')
      .insert([
        {
          admin_id: adminId,
          name: playerData.name,
          age: playerData.age,
          skill_level: playerData.skill,
          achievements: playerData.achievements,
          category: playerData.category,
          image_url: playerData.image,
          base_price: playerData.basePrice || 0,
          status: 'available',
        }
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating player:', error);
    return { success: false, error: error.message };
  }
};

// Get all players for current admin
export const getPlayers = async () => {
  try {
    const adminId = await getAdminId();
    if (!adminId) return { success: true, data: [] };

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching players:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Update a player
export const updatePlayer = async (playerId, playerData) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('players')
      .update({
        name: playerData.name,
        age: playerData.age,
        skill_level: playerData.skill,
        achievements: playerData.achievements,
        category: playerData.category,
        image_url: playerData.image,
        base_price: playerData.basePrice,
      })
      .eq('id', playerId)
      .eq('admin_id', adminId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating player:', error);
    return { success: false, error: error.message };
  }
};

// Delete a player
export const deletePlayer = async (playerId) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting player:', error);
    return { success: false, error: error.message };
  }
};

// Save all players (bulk operation)
export const saveAllPlayers = async (players) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const playersToUpsert = players.map(player => ({
      id: player.id,
      admin_id: adminId,
      name: player.name,
      age: player.age,
      skill_level: player.skill,
      achievements: player.achievements,
      category: player.category,
      image_url: player.image,
      base_price: player.basePrice || 0,
      status: 'available',
    }));

    const { data, error } = await supabase
      .from('players')
      .upsert(playersToUpsert, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving players:', error);
    return { success: false, error: error.message };
  }
};