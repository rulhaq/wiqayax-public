// Stub auth service for standalone operation without Firebase
// All authentication is handled locally via localStorage

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: Array<{ providerId: string }>;
}

// Create a mock user for local operation
const createLocalUser = (): User => ({
  uid: 'local-user-' + Date.now(),
  email: 'local@wiqayax.local',
  displayName: 'Local User',
  photoURL: null,
  emailVerified: true,
  providerData: [{ providerId: 'local' }]
});

export const signUpWithEmail = async (email: string, password: string) => {
  // For standalone mode, just create a local user
  const user = createLocalUser();
  localStorage.setItem('wiqaya_user', JSON.stringify(user));
  return { user, error: null };
};

export const signInWithEmail = async (email: string, password: string) => {
  // For standalone mode, just create a local user
  const user = createLocalUser();
  localStorage.setItem('wiqaya_user', JSON.stringify(user));
  return { user, error: null };
};

export const signInWithGoogle = async () => {
  // For standalone mode, just create a local user
  const user = createLocalUser();
  localStorage.setItem('wiqaya_user', JSON.stringify(user));
  return { user, error: null };
};

export const handleGoogleRedirect = async () => {
  // For standalone mode, return null
  return { user: null, error: null };
};

export const signOut = async () => {
  localStorage.removeItem('wiqaya_user');
  return { error: null };
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('wiqaya_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  // Immediately call with current user
  callback(getCurrentUser());
  
  // Return empty unsubscribe function
  return () => {};
};

export const resendVerificationEmail = async () => {
  return { error: null };
};
