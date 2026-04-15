// authService.js - Authentication operations
import { supabase } from './supabase';

// Sign up new admin
export const signUp = async (email, password, username) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        }
      }
    });

    if (error) throw error;
    
    // Also create entry in admins table
    if (data.user) {
      const { error: adminError } = await supabase
        .from('admins')
        .insert([
          {
            id: data.user.id,
            username: username,
            password_hash: 'managed_by_auth',
          }
        ]);
      
      if (adminError) console.warn('Admin table insert warning:', adminError);
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
};

// Sign in
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get admin ID
    const adminId = data.user?.id;
    
    return { 
      success: true, 
      user: data.user,
      adminId: adminId
    };
  } catch (error) {
    console.error('Signin error:', error);
    return { success: false, error: error.message };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Signout error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { success: true, user, adminId: user?.id };
  } catch (error) {
    console.error('Get user error:', error);
    return { success: false, error: error.message };
  }
};

// Get current admin ID
export const getCurrentAdminId = async () => {
  const result = await getCurrentUser();
  return result.success ? result.adminId : null;
};