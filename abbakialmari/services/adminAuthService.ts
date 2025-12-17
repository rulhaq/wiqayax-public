// Admin Authentication Service using Firebase Auth
import { signInWithEmail } from '../../services/authService';
import { getCurrentUser, signOut } from '../../services/authService';
import { User } from 'firebase/auth';

// Admin email - must match the email in Firebase Auth
const ADMIN_EMAIL = 'cto@scalovate.com';

export interface AdminSession {
  isAuthenticated: boolean;
  email: string;
  user: User;
  loginTime: Date;
}

export const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Trim and validate email format
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    // Verify it's the admin email before attempting login
    if (trimmedEmail !== ADMIN_EMAIL.toLowerCase()) {
      return { success: false, error: 'Access denied. Admin access only.' };
    }
    
    // Use Firebase Auth to sign in
    const result = await signInWithEmail(trimmedEmail, password);
    
    if (result.error) {
      console.error('Admin login error:', result.error);
      return { success: false, error: result.error };
    }
    
    if (!result.user) {
      console.error('Admin login failed: No user returned');
      return { success: false, error: 'Login failed. Please try again.' };
    }
    
    // Double-check the email matches admin email (should already be verified above)
    if (result.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      // Sign out if not admin
      await signOut();
      console.warn('Admin login attempt with non-admin email:', result.user.email);
      return { success: false, error: 'Access denied. Admin access only.' };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Admin login exception:', error);
    const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred. Please try again.';
    return { success: false, error: errorMessage };
  }
};

export const adminLogout = async (): Promise<void> => {
  await signOut();
};

export const isAdminAuthenticated = (): boolean => {
  const user = getCurrentUser();
  if (!user || !user.email) {
    return false;
  }
  // Check if the logged-in user's email matches admin email
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export const getAdminSession = (): AdminSession | null => {
  const user = getCurrentUser();
  if (!user || !user.email) {
    return null;
  }
  
  if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }
  
  return {
    isAuthenticated: true,
    email: user.email,
    user: user,
    loginTime: new Date()
  };
};

