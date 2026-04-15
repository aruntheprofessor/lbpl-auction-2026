// teamService.js - Team database operations
import { supabase } from './supabase';

// Get current admin ID from auth
const getAdminId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Create a new team
export const createTeam = async (teamData) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          admin_id: adminId,
          name: teamData.name,
          logo_url: teamData.logo,
          motto: teamData.motto,
          team_color: teamData.color,
          current_purse: 100000,
        }
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating team:', error);
    return { success: false, error: error.message };
  }
};

// Get all teams for current admin
export const getTeams = async () => {
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

// Update a team
export const updateTeam = async (teamId, teamData) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('teams')
      .update({
        name: teamData.name,
        logo_url: teamData.logo,
        motto: teamData.motto,
        team_color: teamData.color,
        updated_at: new Date(),
      })
      .eq('id', teamId)
      .eq('admin_id', adminId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating team:', error);
    return { success: false, error: error.message };
  }
};

// Delete a team
export const deleteTeam = async (teamId) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: error.message };
  }
};

// Save all teams (bulk operation)
export const saveAllTeams = async (teams) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) throw new Error('Not authenticated');

    // First, get existing teams
    const { data: existingTeams } = await supabase
      .from('teams')
      .select('id')
      .eq('admin_id', adminId);

    // Delete teams that are no longer present
    if (existingTeams && existingTeams.length > 0) {
      const existingIds = existingTeams.map(t => t.id);
      const newIds = teams.filter(t => t.id).map(t => t.id);
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));
      
      if (idsToDelete.length > 0) {
        await supabase
          .from('teams')
          .delete()
          .in('id', idsToDelete)
          .eq('admin_id', adminId);
      }
    }

    // Upsert teams (update if exists, insert if new)
    const teamsToUpsert = teams.map(team => ({
      id: team.id,
      admin_id: adminId,
      name: team.name,
      logo_url: team.logo,
      motto: team.motto,
      team_color: team.color,
      current_purse: 100000,
      updated_at: new Date(),
    }));

    const { data, error } = await supabase
      .from('teams')
      .upsert(teamsToUpsert, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving teams:', error);
    return { success: false, error: error.message };
  }
};